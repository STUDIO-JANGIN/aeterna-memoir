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

      /** Plus & Premium checkouts must carry eventId — otherwise we cannot attribute revenue or unlock the memorial. */
      if (purpose === "premium_film" && !eventId) {
        console.error(
          "[stripe-webhook] checkout.session.completed premium_film missing eventId/memorialId:",
          session.id,
        )
        await notifyAdmin(
          `🚨 [stripe-webhook] Paid Premium/Plus checkout missing eventId in metadata — fix Stripe metadata or reconcile manually`,
          {
            alert: "premium_film_missing_event_id",
            stripe_session_id: session.id,
            amount_cents: amountTotal,
            currency,
            customerEmail,
            metadata: session.metadata ?? {},
          },
        )
      }

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

        const revenueLabel = formatCheckoutAmount(amountTotal, currency)
        const dbIssues: string[] = []

        try {
          const { error: payErr } = await supabase.from("payments").upsert(
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
          if (payErr) {
            dbIssues.push(`payments: ${payErr.message}`)
            console.error("[stripe-webhook] payments upsert failed:", payErr.message)
          }
        } catch (e) {
          const m = e instanceof Error ? e.message : String(e)
          dbIssues.push(`payments (exception): ${m}`)
          console.error("[stripe-webhook] payments upsert exception:", e)
        }

        try {
          const deadlines = paidMemorialDeadlineFields()
          const eventPayload =
            tier === "premium"
              ? {
                  is_paid: true,
                  tier,
                  is_premium: true,
                  video_credits: 5,
                  ...deadlines,
                }
              : {
                  is_paid: true,
                  tier,
                  is_premium: true,
                  ...deadlines,
                }

          const { error: evErr } = await supabase.from("events").update(eventPayload).eq("id", eventId)
          if (evErr) {
            dbIssues.push(`events: ${evErr.message}`)
            console.error("[stripe-webhook] events update failed:", evErr.message)
          }
        } catch (e) {
          const m = e instanceof Error ? e.message : String(e)
          dbIssues.push(`events (exception): ${m}`)
          console.error("[stripe-webhook] events update exception:", e)
        }

        if (dbIssues.length > 0) {
          await notifyAdmin(
            `🚨 [stripe-webhook] Database error after Stripe payment succeeded — reconcile Supabase (payments/events)`,
            {
              alert: "stripe_db_partial_failure",
              eventId,
              stripe_session_id: session.id,
              tier,
              issues: dbIssues,
              amount_cents: amountTotal,
              currency,
              customerEmail,
            }
          )
        }

        // Slack + email: always attempt — Stripe already captured funds even if DB writes failed above.
        try {
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
              dbPersisted: dbIssues.length === 0,
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
        let platformTipDbError: string | null = null
        try {
          const { error } = await supabase.from("payments").upsert(
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
          if (error) {
            platformTipDbError = error.message
            console.error("[stripe-webhook] platform_tip payments upsert failed:", error.message)
          }
        } catch (e) {
          platformTipDbError = e instanceof Error ? e.message : String(e)
          console.error("[stripe-webhook] platform_tip payments upsert exception:", e)
        }

        if (platformTipDbError) {
          await notifyAdmin(`🚨 [stripe-webhook] payments upsert failed (platform_tip): ${platformTipDbError}`, {
            eventId,
            stripe_session_id: session.id,
            amount_cents: amountTotal,
            currency,
          })
        }

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
              dbPersisted: !platformTipDbError,
            }
          )
        } catch (e) {
          console.error("[stripe-webhook] platform_tip Slack notify failed:", e)
        }
      }

      if (purpose === "support_family" && eventId && supabase) {
        let supportDbError: string | null = null
        try {
          const { error } = await supabase.from("payments").upsert(
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
          if (error) {
            supportDbError = error.message
            console.error("[stripe-webhook] support_family payments upsert failed:", error.message)
          }
        } catch (e) {
          supportDbError = e instanceof Error ? e.message : String(e)
          console.error("[stripe-webhook] support_family payments upsert exception:", e)
        }

        if (supportDbError) {
          await notifyAdmin(`🚨 [stripe-webhook] payments upsert failed (support_family): ${supportDbError}`, {
            eventId,
            stripe_session_id: session.id,
            amount_cents: amountTotal,
            currency,
          })
        }

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
              dbPersisted: !supportDbError,
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

