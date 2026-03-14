"use server"

import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type VerifyDonationResult = { ok: true } | { ok: false; error: string }

/**
 * Verify Stripe Checkout session for platform_tip.
 * Used on /p/[slug]/donation-success to unlock bank info for this browser.
 */
export async function verifyDonationAction(
  sessionId: string,
  slug: string
): Promise<VerifyDonationResult> {
  if (!stripe || !sessionId?.trim() || !slug?.trim()) {
    return { ok: false, error: "Invalid session or slug." }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== "paid") {
      return { ok: false, error: "Payment not completed." }
    }

    const meta = session.metadata
    if (meta?.purpose !== "platform_tip" || meta?.slug !== slug) {
      return { ok: false, error: "Invalid session for this memorial." }
    }

    return { ok: true }
  } catch (err) {
    console.error("[verifyDonation]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to verify donation.",
    }
  }
}
