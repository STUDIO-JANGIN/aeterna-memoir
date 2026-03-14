"use server"

import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const secretKey = process.env.STRIPE_SECRET_KEY
// 에러 메시지가 요구하는 "2026-02-25.clover"로 정확히 맞췄습니다.
const stripe = secretKey 
  ? new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover" as any,
    })
  : null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

const AETERNA_PACKAGE_PRICE_CENTS = 4900

export type CreateCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function createCheckoutSessionAction(
  eventId: string,
  slug: string
): Promise<CreateCheckoutResult> {
  if (!stripe) {
    return { ok: false, error: "Stripe is not configured." }
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

  try {
    // 최신 버전 규격에 맞게 'payment_method_types'를 제거하고 'automatic_payment_methods'를 썼습니다.
    // @ts-ignore
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      automatic_payment_methods: {
        enabled: true,
      },
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
      metadata: { eventId, slug, purpose: "premium_film" },
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