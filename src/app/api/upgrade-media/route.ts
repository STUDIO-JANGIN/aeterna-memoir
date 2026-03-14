import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAppBaseUrl } from "@/lib/appUrl"

const secretKey = process.env.STRIPE_SECRET_KEY

// Voice & Motion Pack ($29) – product ID from Stripe (test mode)
const VOICE_MOTION_PRODUCT_ID = "prod_U5Sd5ycjwNTaKN"

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
    const eventId = (body?.eventId as string | undefined) || null

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
    }

    const baseUrl = getAppBaseUrl()

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            // $29.00 USD
            unit_amount: 2900,
            // Use the provided product so it groups correctly in Stripe
            product: VOICE_MOTION_PRODUCT_ID,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        purpose: "upgrade_media",
      },
      success_url: `${baseUrl}/admin/${eventId}?upgrade_media=success`,
      cancel_url: `${baseUrl}/admin/${eventId}?upgrade_media=cancelled`,
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("Stripe media upgrade checkout error:", error)
    return NextResponse.json({ error: "Unable to start media upgrade checkout" }, { status: 500 })
  }
}

