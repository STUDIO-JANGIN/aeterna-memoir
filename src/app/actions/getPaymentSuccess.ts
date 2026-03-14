"use server"

import Stripe from "stripe"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type PaymentSuccessResult =
  | { ok: true; downloadUrl: string; eventName: string | null }
  | { ok: false; error: string }

/**
 * Verify Stripe session and return download link only if payment is completed.
 * Used on /p/[slug]/success to show the download link securely.
 */
export async function getPaymentSuccessAction(
  sessionId: string,
  slug: string
): Promise<PaymentSuccessResult> {
  if (!stripe || !sessionId?.trim()) {
    return { ok: false, error: "Invalid session." }
  }
  const supabase = getSupabaseAdmin()

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    })

    if (session.payment_status !== "paid") {
      return { ok: false, error: "Payment not completed." }
    }

    const eventId = session.metadata?.eventId
    const purpose = session.metadata?.purpose
    if (!eventId || purpose !== "premium_film") {
      return { ok: false, error: "Invalid session metadata." }
    }

    const maxAttempts = 3
    const retryDelayMs = 2000
    let lastError: string = "Event not found."

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Ensure we have a completed payment record (webhook may have written it)
      const { data: payment } = await supabase
        .from("payments")
        .select("id, status")
        .eq("stripe_session_id", sessionId)
        .single()

      if (payment && payment.status !== "completed") {
        await supabase
          .from("payments")
          .update({
            status: "completed",
            user_email: session.customer_details?.email || session.customer_email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", sessionId)
      }

      // Mark event as paid (idempotent; webhook may have already done this)
      await supabase.from("events").update({ is_paid: true }).eq("id", eventId)

      // Fetch event: use full_film_url, preview_film_url, or film_url (film may not be ready yet)
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("full_film_url, preview_film_url, film_url, name")
        .eq("id", eventId)
        .single()

      if (!eventError && event) {
        const downloadUrl =
          (event.full_film_url ?? event.preview_film_url ?? event.film_url ?? "") || ""
        return {
          ok: true,
          downloadUrl,
          eventName: event.name ?? null,
        }
      }

      lastError = eventError?.message ?? "Event not found."
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      }
    }

    return { ok: false, error: lastError }
  } catch (err) {
    console.error("[getPaymentSuccess]", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unable to verify payment.",
    }
  }
}
