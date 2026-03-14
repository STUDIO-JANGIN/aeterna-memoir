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

/** Premium upgrade: $29.99 USD (cents) */
const PREMIUM_USD_CENTS = 2999

export type CreatePremiumUsdCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Create Stripe Checkout Session for Premium upgrade ($29.99 USD).
 * purpose: premium_film — webhook sets is_paid/is_premium.
 * success_url → /p/[slug]/success?session_id={CHECKOUT_SESSION_ID}
 * cancel_url → /p/[slug]/admin
 */
export async function createPremiumUsdCheckoutSessionAction(
  eventId: string,
  slug: string
): Promise<CreatePremiumUsdCheckoutResult> {
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
            currency: "usd",
            unit_amount: PREMIUM_USD_CENTS,
            product_data: {
              name: "Aeterna Premium",
              description:
                "High-quality AI memorial film (~1 min), permanent storage for all memories (no 7-day deletion), and high-resolution photo downloads.",
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
    console.error("[createPremiumUsdCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}
