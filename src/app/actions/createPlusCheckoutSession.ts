"use server"

import Stripe from "stripe"
import { checkoutSessionPaymentAndLocale } from "@/lib/checkout"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import {
  type PricingCurrencyId,
  resolveStripePriceIdPlus,
  stripeCurrencyCode,
  TIER_STRIPE_UNITS,
} from "@/lib/landingPricing"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type CreatePlusCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/** Optional: send users who cancel Stripe back to /create (vs memorial admin). */
export type PlusCheckoutSessionOptions = {
  cancelToCreate?: boolean
  /** Used with cancelToCreate — matches landing `?plan=` (e.g. forever, film, free). */
  planQueryParam?: "basic" | "premium" | "free" | "forever" | "film"
  /** Regional Stripe Price / `price_data` (KRW, JPY, SAR, USD). Defaults to USD. */
  pricingCurrency?: PricingCurrencyId
  /** App landing locale — drives Checkout language and KR wallet ordering. */
  checkoutLocale?: string
}

function resolvePlusCancelUrl(
  origin: string,
  slug: string,
  options?: PlusCheckoutSessionOptions
): string {
  if (options?.cancelToCreate) {
    const plan = options.planQueryParam ?? "basic"
    return `${origin}/create?plan=${encodeURIComponent(plan)}`
  }
  return `${origin}/p/${encodeURIComponent(slug)}/admin`
}

/**
 * Create Stripe Checkout Session for Plus tier (regional pricing).
 * metadata.tier: "plus" → webhook sets events.tier = 'plus', is_paid = true.
 */
export async function createPlusCheckoutSessionAction(
  eventId: string,
  slug: string,
  options?: PlusCheckoutSessionOptions
): Promise<CreatePlusCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }
  const supabase = getSupabaseAdmin()
  const origin = getAppBaseUrl()

  const currency = options?.pricingCurrency ?? "usd"
  const stripePriceId = resolveStripePriceIdPlus(currency)
  const unitAmount = TIER_STRIPE_UNITS[currency][1]
  const curr = stripeCurrencyCode(currency)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = stripePriceId
    ? [{ price: stripePriceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: curr,
            unit_amount: unitAmount,
            product_data: {
              name: "Aeterna Plus — lifetime memory storage",
              description:
                "Preserve all photos and messages for life, with full high-resolution download access.",
              images: [],
            },
          },
          quantity: 1,
        },
      ]

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ...checkoutSessionPaymentAndLocale({
        locale: options?.checkoutLocale,
        currency: curr,
      }),
      line_items: lineItems,
      ...(stripePriceId ? { currency: curr } : {}),
      metadata: {
        eventId,
        memorialId: eventId,
        slug,
        purpose: "premium_film",
        tier: "plus",
        pricing_currency: currency,
      },
      success_url: `${origin}/p/${encodeURIComponent(slug)}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: resolvePlusCancelUrl(origin, slug, options),
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
