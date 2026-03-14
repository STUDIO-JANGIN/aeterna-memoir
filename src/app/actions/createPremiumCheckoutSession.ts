"use server"

import Stripe from "stripe"
import { PAYMENT_METHOD_TYPES } from "@/lib/checkout"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

/** 프리미엄 업그레이드 결제: 29,000원 (KRW) */
const PREMIUM_KRW_AMOUNT = 29000

export type CreatePremiumCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Create Stripe Checkout Session for Premium upgrade (29,000 KRW).
 * purpose: premium_film — same as regular package; webhook sets is_paid/is_premium.
 * success_url → /p/[slug]/success?session_id={CHECKOUT_SESSION_ID}
 * cancel_url → /p/[slug]/admin
 */
export async function createPremiumCheckoutSessionAction(
  eventId: string,
  slug: string
): Promise<CreatePremiumCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }
  const supabase = getSupabaseAdmin()
  const origin = getAppBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "krw",
            unit_amount: PREMIUM_KRW_AMOUNT,
            product_data: {
              name: "Aeterna 프리미엄 (AI 헌정 영상 + 영구 보관)",
              description:
                "추억 수집 마감 후 업그레이드: AI 헌정 영상 제작 및 모든 사진 영구 보관.",
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
    console.error("[createPremiumCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}
