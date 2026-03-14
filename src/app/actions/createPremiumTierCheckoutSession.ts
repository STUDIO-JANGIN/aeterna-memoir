"use server"

import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { PAYMENT_METHOD_TYPES } from "@/lib/checkout"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

/** Premium tier: $39.99 USD (Plus + AI 헌정 영상 1회) */
const PREMIUM_TIER_USD_CENTS = 3999
const STRIPE_PRICE_ID_PREMIUM = process.env.STRIPE_PRICE_ID_PREMIUM ?? ""

export type CreatePremiumTierCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Create Stripe Checkout Session for Premium tier ($39.99).
 * metadata.tier: "premium" → webhook sets events.tier = 'premium', is_paid = true.
 */
export async function createPremiumTierCheckoutSessionAction(
  eventId: string,
  slug: string
): Promise<CreatePremiumTierCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = STRIPE_PRICE_ID_PREMIUM
    ? [{ price: STRIPE_PRICE_ID_PREMIUM, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            unit_amount: PREMIUM_TIER_USD_CENTS,
            product_data: {
              name: "Aeterna Premium — 마법 앨범",
              description:
                "고인의 서로 다른 3가지 모습을 마법 영화로 간직하세요. Plus의 모든 기능 + 시네마틱 AI 헌정 영상 제작 3회, 고화질 다운로드 및 영구 보관.",
              images: [],
            },
          },
          quantity: 1,
        },
      ]

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        eventId,
        slug,
        purpose: "premium_film",
        tier: "premium",
      },
      success_url: `${origin}/p/${encodeURIComponent(slug)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/p/${encodeURIComponent(slug)}/admin`,
    })

    if (!session.url) {
      return { ok: false, error: "Failed to create checkout URL." }
    }

    try {
      await supabase.from("payments").upsert(
        {
          event_id: eventId,
          stripe_session_id: session.id,
          user_email: null,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
    } catch {
      // Table may not exist yet
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error("[createPremiumTierCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}
