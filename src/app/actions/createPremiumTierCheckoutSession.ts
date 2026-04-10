"use server"

import Stripe from "stripe"
import { PAYMENT_METHOD_TYPES } from "@/lib/checkout"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import {
  type PricingCurrencyId,
  resolveStripePriceIdPremium,
  stripeCurrencyCode,
  TIER_STRIPE_UNITS,
} from "@/lib/landingPricing"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type CreatePremiumTierCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export type PremiumTierCheckoutSessionOptions = {
  cancelToCreate?: boolean
  planQueryParam?: "basic" | "premium" | "free" | "forever" | "film"
  pricingCurrency?: PricingCurrencyId
}

function resolvePremiumCancelUrl(
  origin: string,
  slug: string,
  options?: PremiumTierCheckoutSessionOptions
): string {
  if (options?.cancelToCreate) {
    const plan = options.planQueryParam ?? "premium"
    return `${origin}/create?plan=${encodeURIComponent(plan)}`
  }
  return `${origin}/p/${encodeURIComponent(slug)}/admin`
}

/**
 * Create Stripe Checkout Session for Premium tier (regional pricing).
 * metadata.tier: "premium" → webhook sets events.tier = 'premium', is_paid = true.
 */
export async function createPremiumTierCheckoutSessionAction(
  eventId: string,
  slug: string,
  options?: PremiumTierCheckoutSessionOptions
): Promise<CreatePremiumTierCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }
  const supabase = getSupabaseAdmin()
  const origin = getAppBaseUrl()

  const currency = options?.pricingCurrency ?? "usd"
  const stripePriceId = resolveStripePriceIdPremium(currency)
  const unitAmount = TIER_STRIPE_UNITS[currency][2]
  const curr = stripeCurrencyCode(currency)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = stripePriceId
    ? [{ price: stripePriceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: curr,
            unit_amount: unitAmount,
            product_data: {
              name: "Aeterna Premium — cinematic tribute album",
              description:
                "Keep your loved one’s story alive through cinematic AI tribute films. Includes all Plus features, 3 AI film credits, high-resolution downloads, and lifetime storage.",
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
        memorialId: eventId,
        slug,
        purpose: "premium_film",
        tier: "premium",
        pricing_currency: currency,
      },
      success_url: `${origin}/p/${encodeURIComponent(slug)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: resolvePremiumCancelUrl(origin, slug, options),
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
