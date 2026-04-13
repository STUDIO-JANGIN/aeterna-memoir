"use server"

import Stripe from "stripe"
import { checkoutSessionPaymentAndLocale } from "@/lib/checkout"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { STRIPE_PREMIUM_PRODUCT_AI_FILM } from "@/lib/notifyPremiumFilmPurchase"

const secretKey = process.env.STRIPE_SECRET_KEY
// Keep this pinned to "2026-02-25.clover" per Stripe requirements.
const stripe = secretKey 
  ? new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover" as any,
    })
  : null

const AETERNA_PACKAGE_PRICE_CENTS = 4900

export type CreateCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function createCheckoutSessionAction(
  eventId: string,
  slug: string,
  checkoutLocale?: string
): Promise<CreateCheckoutResult> {
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
            unit_amount: AETERNA_PACKAGE_PRICE_CENTS,
            product_data: {
              name: "Aeterna Memorial Package",
              description: "Full access: all memories, AI memorial film, and high-quality download.",
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
        premium_product: STRIPE_PREMIUM_PRODUCT_AI_FILM,
      },
      success_url: `${origin}/p/${encodeURIComponent(slug)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/p/${encodeURIComponent(slug)}`,
    })

    if (!session.url) {
      return { ok: false, error: "Failed to create checkout URL." }
    }

    try {
      await supabase.from("payments").upsert(
        {
          event_id: eventId,
          stripe_session_id: session.id,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
    } catch (e) {
      console.error("Supabase error:", e)
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error("[createCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}