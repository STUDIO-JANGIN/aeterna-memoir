import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAppBaseUrl } from "@/lib/appUrl"

const secretKey = process.env.STRIPE_SECRET_KEY

const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

type TierConfig = {
  id: string
  participantLimit: number
  amountCents: number
  label: string
}

const TIERS: TierConfig[] = [
  { id: "tier_25", participantLimit: 25, amountCents: 999, label: "Up to 25 participants" },
  { id: "tier_50", participantLimit: 50, amountCents: 1999, label: "Up to 50 participants" },
  { id: "tier_100", participantLimit: 100, amountCents: 3999, label: "Up to 100 participants" },
  { id: "tier_200", participantLimit: 200, amountCents: 6999, label: "Up to 200 participants" },
  { id: "tier_unlimited", participantLimit: 0, amountCents: 9999, label: "Unlimited participants" },
]

export async function POST(req: NextRequest) {
  if (!stripe) {
    console.error("STRIPE_SECRET_KEY is not set")
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const eventId = (body?.eventId as string | undefined) || null
    const tierId = (body?.tierId as string | undefined) || null

    if (!eventId || !tierId) {
      return NextResponse.json({ error: "Missing eventId or tierId" }, { status: 400 })
    }

    const tier = TIERS.find((t) => t.id === tierId)
    if (!tier) {
      return NextResponse.json({ error: "Unknown tierId" }, { status: 400 })
    }

    const baseUrl = getAppBaseUrl()

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: tier.amountCents,
            product_data: {
              name: "Aeterna · Event tier",
              description: tier.label,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        purpose: "tier_upgrade",
        tierId,
        participantLimit: String(tier.participantLimit),
      },
      success_url: `${baseUrl}/admin/${eventId}?tier=success`,
      cancel_url: `${baseUrl}/admin/${eventId}?tier=cancelled`,
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("Stripe tier checkout error:", error)
    return NextResponse.json({ error: "Unable to start tier checkout" }, { status: 500 })
  }
}

