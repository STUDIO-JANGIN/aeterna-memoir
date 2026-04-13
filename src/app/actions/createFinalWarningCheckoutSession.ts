"use server"

import Stripe from "stripe"
import { checkoutSessionPaymentAndLocale } from "@/lib/checkout"
import { STRIPE_PREMIUM_PRODUCT_FINAL_WARNING } from "@/lib/notifyPremiumFilmPurchase"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

/** Final Warning offer: $9.99 USD */
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
  slug: string,
  checkoutLocale?: string
): Promise<CreateFinalWarningCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }
  const supabase = getSupabaseAdmin()
  const origin = getAppBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...checkoutSessionPaymentAndLocale({
        locale: checkoutLocale,
        currency: "usd",
      }),
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: FINAL_WARNING_USD_CENTS,
            product_data: {
              name: "Aeterna — preserve every memory forever (Final Warning)",
              description:
                "Pay now before deletion and preserve every memory safely. Includes five ~10s AI tribute clips and high-resolution downloads.",
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        eventId,
        memorialId: eventId,
        slug,
        purpose: "premium_film",
        tier: "premium",
        premium_product: STRIPE_PREMIUM_PRODUCT_FINAL_WARNING,
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
