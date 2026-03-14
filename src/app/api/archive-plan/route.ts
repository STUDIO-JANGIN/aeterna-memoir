import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getAppBaseUrl } from "@/lib/appUrl"
import { supabase } from "@/lib/supabase"

const secretKey = process.env.STRIPE_SECRET_KEY

// Permanent Archive product – use the prod_ ID you provided
// e.g. STRIPE_PRODUCT_ARCHIVE_LIFETIME=prod_U5SxaVtDPgA0i0
const archiveProductId = process.env.STRIPE_PRODUCT_ARCHIVE_LIFETIME

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

  if (!archiveProductId) {
    console.error("STRIPE_PRODUCT_ARCHIVE_LIFETIME is not configured")
    return NextResponse.json({ error: "Archive product is not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const eventId = (body?.eventId as string | undefined) || null

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
    }

    const { data: eventRow, error } = await supabase
      .from("events")
      .select("media_tier")
      .eq("id", eventId)
      .single()

    if (error) {
      console.error("Error loading event for archive checkout", error)
      return NextResponse.json({ error: "Unable to load event" }, { status: 500 })
    }

    const hasCredit = eventRow?.media_tier === "voice_motion"
    // Full price: $99, Credit price: $70 (99 - 29)
    const unitAmount = hasCredit ? 7000 : 9900

    const baseUrl = getAppBaseUrl()

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product: archiveProductId,
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        purpose: "archive_lifetime",
        appliedCredit: hasCredit ? "29" : "0",
      },
      success_url: `${baseUrl}/admin/${eventId}?archive=success`,
      cancel_url: `${baseUrl}/admin/${eventId}?archive=cancelled`,
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("Stripe archive checkout error:", error)
    return NextResponse.json({ error: "Unable to start archive checkout" }, { status: 500 })
  }
}

