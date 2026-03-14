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

/** Plus tier: $19.99 USD (데이터 영구 보관 + 고화질 다운로드) */
const PLUS_USD_CENTS = 1999
const STRIPE_PRICE_ID_PLUS = process.env.STRIPE_PRICE_ID_PLUS ?? ""

export type CreatePlusCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Create Stripe Checkout Session for Plus tier ($19.99).
 * metadata.tier: "plus" → webhook sets events.tier = 'plus', is_paid = true.
 */
export async function createPlusCheckoutSessionAction(
  eventId: string,
  slug: string
): Promise<CreatePlusCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }
  const supabase = getSupabaseAdmin()
  const origin = getAppBaseUrl()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = STRIPE_PRICE_ID_PLUS
    ? [{ price: STRIPE_PRICE_ID_PLUS, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            unit_amount: PLUS_USD_CENTS,
            product_data: {
              name: "Aeterna Plus — 데이터 영구 보관",
              description:
                "모든 사진과 메시지를 영구 보관하고, 고화질 사진 전체 다운로드 권한을 이용하세요.",
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
        tier: "plus",
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
    console.error("[createPlusCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}
