"use server"

import Stripe from "stripe"
import {
  checkoutSessionPaymentAndLocale,
  getCheckoutPaymentMethodTypesFallback,
  getDonationAmountByLocale,
  getDonationProductCopy,
} from "@/lib/checkout"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type CreateDonationCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Stripe Checkout for platform tip.
 * Locale: ko → 1,000 KRW, else → 0.99 USD. success_url → /p/[slug]/donation-success?session_id=...
 */
export async function createDonationCheckoutSessionAction(
  eventId: string,
  slug: string,
  locale?: string
): Promise<CreateDonationCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }
  const supabase = getSupabaseAdmin()
  const origin = getAppBaseUrl()

  const { currency, unit_amount } = getDonationAmountByLocale(locale ?? "en")
  const product = getDonationProductCopy()

  const common = checkoutSessionPaymentAndLocale({
    locale: locale ?? undefined,
    currency,
  })

  const body: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    ...common,
    line_items: [
      {
        price_data: {
          currency,
          unit_amount,
          product_data: {
            name: product.name,
            description: product.description,
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
      purpose: "platform_tip",
    },
    success_url: `${origin}/p/${encodeURIComponent(slug)}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/p/${encodeURIComponent(slug)}`,
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create(body)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("payment_method") || msg.includes("Invalid")) {
      session = await stripe.checkout.sessions.create({
        ...body,
        payment_method_types: getCheckoutPaymentMethodTypesFallback({
          locale: locale ?? undefined,
          currency,
        }),
      })
    } else {
      throw err
    }
  }

  try {
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
          purpose: "platform_tip",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      )
    } catch {
      // purpose column may not exist yet
    }

    return { ok: true, url: session.url }
  } catch (err) {
    console.error("[createDonationCheckoutSession]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to start checkout.",
    }
  }
}
