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

/** Final Warning 할인: $9.99 USD (₩13,000 상당) */
const FINAL_WARNING_USD_CENTS = 999

export type CreateFinalWarningCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Create Stripe Checkout Session for Final Warning offer ($9.99 USD / ₩13,000).
 * purpose: premium_film — webhook sets is_paid/is_premium.
 */
export async function createFinalWarningCheckoutSessionAction(
  eventId: string,
  slug: string
): Promise<CreateFinalWarningCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: FINAL_WARNING_USD_CENTS,
            product_data: {
              name: "Aeterna — 모든 기록 영구 보관 (Final Warning)",
              description:
                "내일 삭제 전, 지금 결제하면 모든 추억을 안전하게 보관합니다. AI 헌정 영상 및 고화질 다운로드 포함.",
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        slug,
        purpose: "premium_film",
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
      // Table may not exist yet; checkout still proceeds
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error("[createFinalWarningCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}
