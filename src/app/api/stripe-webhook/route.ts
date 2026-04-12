import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { notifyAdmin } from "@/lib/notifyAdmin"
import {
  sendPremiumPurchaseEmail,
  shouldNotifyPremiumAiFilmPurchase,
} from "@/lib/notifyPremiumFilmPurchase"
import { attemptTributeClipGenerationForEvent } from "@/lib/tributeClipPipeline"
import { paidMemorialDeadlineFields } from "@/lib/paidMemorialDeadlines"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover", // Keep this version in sync with Stripe account requirements.
  })

/** Stripe `amount_total` is in the smallest unit; zero-decimal currencies are not divided by 100. */
const STRIPE_ZERO_DECIMAL = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
])

function formatCheckoutAmount(amount: number, currency: string): string {
  const c = currency.toLowerCase()
  if (STRIPE_ZERO_DECIMAL.has(c)) return `${amount} ${c.toUpperCase()}`
  if (c === "usd") return `$${(amount / 100).toFixed(2)}`
  if (c === "eur") return `€${(amount / 100).toFixed(2)}`
  if (c === "gbp") return `£${(amount / 100).toFixed(2)}`
  return `${(amount / 100).toFixed(2)} ${c.toUpperCase()}`
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook not configured – missing secret or webhook secret")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (e) {
    console.error("Supabase not configured:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const h = await headers()
  const sig = h.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Stripe webhook signature verification failed:", msg)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const eventId = session.metadata?.eventId ?? session.metadata?.memorialId
      const purpose = session.metadata?.purpose
      const amountTotal = session.amount_total ?? 0
      const currency = session.currency ?? "usd"
      const customerEmail = (session.customer_details?.email || session.customer_email) ?? null

      /** `eventId` in metadata scopes Plus/Premium to a single memorial row — never shared across a user’s events. */
      if (purpose === "premium_film" && eventId && supabase) {
        const tierFromMeta = session.metadata?.tier as string | undefined
        const tier: "plus" | "premium" =
          tierFromMeta === "plus" ? "plus" : tierFromMeta === "premium" ? "premium" : "premium"
        if (tierFromMeta !== "plus" && tierFromMeta !== "premium") {
          console.warn(
            "[stripe-webhook] premium_film checkout missing tier metadata; defaulting to premium (legacy session)",
            session.id
          )
        }

        await supabase.from("payments").upsert(
          {
            event_id: eventId,
            stripe_session_id: session.id,
            user_email: customerEmail,
            status: "completed",
            purpose: "premium_film",
            amount_cents: amountTotal,
            currency,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_session_id" }
        )

        const deadlines = paidMemorialDeadlineFields()
        // For Premium payments, set video_credits to five (~10s tribute clips each).
        if (tier === "premium") {
          await supabase
            .from("events")
            .update({
              is_paid: true,
              tier,
              is_premium: true,
              video_credits: 5,
              ...deadlines,
            })
            .eq("id", eventId)
        } else {
          await supabase
            .from("events")
            .update({
              is_paid: true,
              tier,
              is_premium: true,
              ...deadlines,
            })
            .eq("id", eventId)
        }

        // One Slack message per successful payment (tier + revenue); Premium also gets optional Resend email.
        try {
          const revenueLabel = formatCheckoutAmount(amountTotal, currency)

          const { data: eventRow } = await supabase
            .from("events")
            .select("name, slug")
            .eq("id", eventId)
            .maybeSingle()

          const familyName = eventRow?.name ?? "Unknown name"
          const slug = (eventRow?.slug as string | null | undefined) ?? null
          const tierLabel =
            tier === "plus" ? "Eternal Legacy (Plus)" : "Eternal Film (Premium)"

          await notifyAdmin(
            `💳 *[Payment · Live]* ${tierLabel} · ${revenueLabel} · *${familyName}*${slug ? ` · /p/${slug}` : ""}`,
            {
              alert: "checkout_completed",
              eventId,
              tier,
              tierLabel,
              purpose,
              currency,
              amount_cents: amountTotal,
              revenueLabel,
              customerEmail,
              stripe_session_id: session.id,
            }
          )

          if (tier === "premium" && shouldNotifyPremiumAiFilmPurchase(tier, session)) {
            await sendPremiumPurchaseEmail({
              eventId,
              memorialName: eventRow?.name ?? null,
              slug,
              amountMajor: revenueLabel,
              amountCents: amountTotal,
              currency,
              customerEmail,
              stripeSessionId: session.id,
            })
          }
        } catch (err) {
          console.error("[stripe-webhook] Failed to send revenue / premium notification:", err)
        }

        // Auto-start first Living Portrait clip after Premium (non-blocking so the webhook ACK stays fast).
        if (tier === "premium") {
          void (async () => {
            try {
              const auto = await attemptTributeClipGenerationForEvent(eventId, {
                revalidate: true,
                source: "payment_webhook",
              })
              if (!auto.ok && auto.code !== "skip") {
                console.error("[stripe-webhook] Auto tribute clip failed:", auto.error)
              }
            } catch (e) {
              console.error("[stripe-webhook] Auto tribute clip exception:", e)
              await notifyAdmin(
                `🚨 [stripe-webhook] Auto tribute clip error: ${e instanceof Error ? e.message : String(e)}`,
                { eventId, source: "payment_webhook" }
              )
            }
          })()
        }
      }

      if (purpose === "platform_tip" && eventId && supabase) {
        await supabase.from("payments").upsert(
          {
            event_id: eventId,
            stripe_session_id: session.id,
            user_email: customerEmail,
            status: "completed",
            purpose: "platform_tip",
            amount_cents: amountTotal,
            currency,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_session_id" }
        )
        try {
          const { data: er } = await supabase.from("events").select("name, slug").eq("id", eventId).maybeSingle()
          const amt = formatCheckoutAmount(amountTotal, currency)
          await notifyAdmin(
            `☕ [Platform tip] ${amt} · ${er?.name ?? "Memorial"}${er?.slug ? ` · /p/${er.slug}` : ""}`,
            {
              eventId,
              purpose: "platform_tip",
              amount_cents: amountTotal,
              currency,
              customerEmail,
              stripe_session_id: session.id,
            }
          )
        } catch (e) {
          console.error("[stripe-webhook] platform_tip Slack notify failed:", e)
        }
      }

      if (purpose === "support_family" && eventId && supabase) {
        await supabase.from("payments").upsert(
          {
            event_id: eventId,
            stripe_session_id: session.id,
            user_email: customerEmail,
            status: "completed",
            purpose: "support_family",
            amount_cents: amountTotal,
            currency,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_session_id" }
        )
        try {
          const { data: er } = await supabase.from("events").select("name, slug").eq("id", eventId).maybeSingle()
          const amt = formatCheckoutAmount(amountTotal, currency)
          await notifyAdmin(
            `🤝 [Family support] ${amt} · ${er?.name ?? "Memorial"}${er?.slug ? ` · /p/${er.slug}` : ""}`,
            {
              eventId,
              purpose: "support_family",
              amount_cents: amountTotal,
              currency,
              customerEmail,
              stripe_session_id: session.id,
            }
          )
        } catch (e) {
          console.error("[stripe-webhook] support_family Slack notify failed:", e)
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Stripe webhook handler error:", err)
    await notifyAdmin(`🚨 [stripe-webhook] Handler error: ${msg}`, {
      source: "stripe-webhook",
    })
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }
}

