import { getAppBaseUrl } from "@/lib/appUrl"

/** Stripe Checkout `metadata.premium_product` for the main AI Film / Premium SKUs (not Final Warning). */
export const STRIPE_PREMIUM_PRODUCT_AI_FILM = "ai_film"
/** Post-deletion rescue offer — same DB tier as Premium but should not trigger the AI Film owner alert. */
export const STRIPE_PREMIUM_PRODUCT_FINAL_WARNING = "final_warning"

export type PremiumFilmPurchaseContext = {
  eventId: string
  memorialName: string | null
  slug: string | null
  amountMajor: string
  amountCents: number
  currency: string
  customerEmail: string | null
  stripeSessionId: string
}

/**
 * Email alert for Premium checkout (Resend). Slack is sent once per payment from the Stripe webhook.
 */
/** Resend email only — Slack for paid checkouts is sent from `stripe-webhook` (one message per payment). */
export async function sendPremiumPurchaseEmail(ctx: PremiumFilmPurchaseContext): Promise<void> {
  const base = getAppBaseUrl()
  const adminPath = ctx.slug ? `/p/${encodeURIComponent(ctx.slug)}/admin` : null
  const adminUrl = adminPath ? `${base}${adminPath}` : null
  await sendPremiumTierEmailResend(ctx, adminUrl)
}

/** @deprecated Prefer `sendPremiumPurchaseEmail`; Slack is handled in the webhook. */
export async function notifyPremiumFilmPurchase(ctx: PremiumFilmPurchaseContext): Promise<void> {
  await sendPremiumPurchaseEmail(ctx)
}

/**
 * Whether to send the owner alert for this checkout. Excludes Final Warning and legacy USD $9.99 rescue checkouts.
 */
export function shouldNotifyPremiumAiFilmPurchase(
  tier: "plus" | "premium",
  session: {
    metadata?: { premium_product?: string | null } | null
    amount_total?: number | null
    currency?: string | null
  }
): boolean {
  if (tier !== "premium") return false
  const raw = session.metadata?.premium_product?.trim().toLowerCase()
  if (raw === STRIPE_PREMIUM_PRODUCT_FINAL_WARNING) return false
  const c = (session.currency ?? "usd").toLowerCase()
  const amt = session.amount_total ?? 0
  if (!raw && c === "usd" && amt === 999) return false
  return true
}

async function sendPremiumTierEmailResend(
  ctx: PremiumFilmPurchaseContext,
  adminUrl: string | null
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return
  }

  const from = process.env.RESEND_FROM?.trim()
  if (!from) {
    console.warn(
      "[notifyPremiumFilmPurchase] RESEND_API_KEY is set but RESEND_FROM is missing; email skipped."
    )
    return
  }

  const toRaw = process.env.PREMIUM_ALERT_EMAIL_TO?.trim() || "hoon@aya.yale.edu"
  const to = toRaw.split(",").map((s) => s.trim()).filter(Boolean)

  const text = [
    "Premium (5 tribute clips) purchase completed",
    "",
    `Amount: ${ctx.amountMajor}`,
    `Currency: ${ctx.currency}`,
    `Memorial: ${ctx.memorialName ?? "—"}`,
    `Payer email: ${ctx.customerEmail ?? "—"}`,
    adminUrl ? `Admin: ${adminUrl}` : `Event ID: ${ctx.eventId}`,
    `Stripe session: ${ctx.stripeSessionId}`,
  ].join("\n")

  const subject = `[Aeterna] Premium (5× ~10s clips) — ${ctx.amountMajor} · ${ctx.memorialName ?? "Memorial"}`

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("[notifyPremiumFilmPurchase] Resend API error:", res.status, errBody)
    }
  } catch (err) {
    console.error("[notifyPremiumFilmPurchase] Resend request failed:", err)
  }
}
