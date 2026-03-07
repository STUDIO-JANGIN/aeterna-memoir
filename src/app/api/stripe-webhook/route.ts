import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"

const secretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  })

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook not configured – missing secret or webhook secret")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const sig = headers().get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err?.message || err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      // We store event linkage and payment details in metadata
      const eventId = session.metadata?.eventId
      const amountTotal = session.amount_total ?? 0
      const currency = session.currency ?? "usd"
      const customerEmail = (session.customer_details?.email || session.customer_email) ?? null

      console.log("Support-family payment completed", {
        eventId,
        amountTotal,
        currency,
        customerEmail,
        sessionId: session.id,
        paymentIntent: session.payment_intent,
      })

      // TODO: Insert a row into a `contributions` table in Supabase, e.g.
      // id (uuid), event_id, amount_cents, currency, stripe_session_id, stripe_payment_intent_id, payer_email, status, created_at
      //
      // You can call Supabase here using a service role key or use a server-side helper.
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error("Stripe webhook handler error:", err)
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }
}

