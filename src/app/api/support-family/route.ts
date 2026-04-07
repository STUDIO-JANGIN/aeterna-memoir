import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAppBaseUrl } from "@/lib/appUrl"
import { PAYMENT_METHOD_TYPES } from "@/lib/checkout"

const secretKey = process.env.STRIPE_SECRET_KEY

const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export async function POST(req: NextRequest) {
  if (!stripe) {
    console.error("STRIPE_SECRET_KEY is not set")
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const eventId = body.eventId as string | undefined
    const amount = Number(body.amount)
    const currency = (body.currency as string | undefined) || "usd"

    if (!eventId || !amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid eventId or amount" }, { status: 400 })
    }

    const baseUrl = getAppBaseUrl()

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: "Support the Family · Memorial Fund",
              description: "A contribution to support the family for this Aeterna memorial.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        purpose: "support_family",
      },
      success_url: `${baseUrl}/event/${eventId}?support=success`,
      cancel_url: `${baseUrl}/event/${eventId}?support=cancelled`,
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 })
  }
}

