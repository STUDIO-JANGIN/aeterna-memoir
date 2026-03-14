import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { PAYMENT_METHOD_TYPES } from "@/lib/checkout"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

/** Allowed tip amounts in USD */
const BRIDGE_TIP_AMOUNTS = [1, 2, 3] as const

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const eventId = body.eventId as string | undefined
    const amount = Number(body.amount)
    const redirectUrl = typeof body.redirectUrl === "string" ? body.redirectUrl : ""

    if (!eventId || !BRIDGE_TIP_AMOUNTS.includes(amount as 1 | 2 | 3)) {
      return NextResponse.json({ error: "Invalid eventId or amount (use 1, 2, or 3)" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const successUrl = redirectUrl
      ? `${baseUrl}/event/${eventId}?bridge=success&redirect=${encodeURIComponent(redirectUrl)}`
      : `${baseUrl}/event/${eventId}?bridge=success`
    const cancelUrl = `${baseUrl}/event/${eventId}`

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: "Aeterna · Voluntary tip",
              description: "Thank you for supporting Aeterna. You’ll be taken to the family’s link after payment.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        purpose: "bridge_tip",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout URL" }, { status: 500 })
    }

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (err) {
    console.error("[bridge-tip]", err)
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 })
  }
}
