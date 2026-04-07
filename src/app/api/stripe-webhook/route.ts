import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover", // Keep this version in sync with Stripe account requirements.
  })

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

        // For Premium payments, set video_credits to exactly 3.
        if (tier === "premium") {
          await supabase
            .from("events")
            .update({ is_paid: true, tier, video_credits: 3 })
            .eq("id", eventId)
        } else {
          await supabase
            .from("events")
            .update({ is_paid: true, tier })
            .eq("id", eventId)
        }

        // Revenue Slack notification (shared by Plus/Premium)
        try {
          const amountMajor =
            currency.toLowerCase() === "usd" ? `$${(amountTotal / 100).toFixed(2)}` : `${amountTotal} ${currency}`

          const { data: eventRow } = await supabase
            .from("events")
            .select("name")
            .eq("id", eventId)
            .maybeSingle()

          const familyName = eventRow?.name ?? "Unknown name"

          await notifyAdmin(`💰 [Revenue] Payment completed: ${amountMajor} · Family: ${familyName}`, {
            eventId,
            tier,
            purpose,
            currency,
            amount_cents: amountTotal,
            customerEmail,
            stripe_session_id: session.id,
          })
        } catch (err) {
          console.error("[stripe-webhook] Failed to send Slack revenue notification:", err)
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
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("Stripe webhook handler error:", err)
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }
}

