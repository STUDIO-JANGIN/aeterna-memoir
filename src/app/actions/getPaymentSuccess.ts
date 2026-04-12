"use server"

import Stripe from "stripe"
import { paidMemorialDeadlineFields } from "@/lib/paidMemorialDeadlines"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const secretKey = process.env.STRIPE_SECRET_KEY
const stripe =
  secretKey &&
  new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  })

export type PaymentSuccessResult =
  | { ok: true; downloadUrl: string; eventName: string | null; tier: string | null }
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

    const eventId = session.metadata?.eventId ?? session.metadata?.memorialId
    const purpose = session.metadata?.purpose
    const metaSlug = session.metadata?.slug
    const normSeg = (s: string) => s.trim().toLowerCase()
    if (!eventId || purpose !== "premium_film") {
      return { ok: false, error: "Invalid session metadata." }
    }
    if (metaSlug && normSeg(metaSlug) !== normSeg(slug)) {
      return { ok: false, error: "This payment confirmation does not match this memorial." }
    }

    const maxAttempts = 5
    const retryDelayMs = 1500
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

      // Apply paid status + tier from Stripe metadata only (never from client).
      const deadlines = paidMemorialDeadlineFields()
      const tierMeta = session.metadata?.tier as string | undefined
      if (tierMeta === "premium") {
        await supabase
          .from("events")
          .update({
            is_paid: true,
            tier: "premium",
            is_premium: true,
            video_credits: 5,
            ...deadlines,
          })
          .eq("id", eventId)
      } else if (tierMeta === "plus") {
        await supabase
          .from("events")
          .update({
            is_paid: true,
            tier: "plus",
            is_premium: true,
            ...deadlines,
          })
          .eq("id", eventId)
      } else {
        // Legacy sessions without tier metadata: treat as Premium so DB matches current checkout defaults.
        await supabase
          .from("events")
          .update({
            is_paid: true,
            tier: "premium",
            is_premium: true,
            video_credits: 5,
            ...deadlines,
          })
          .eq("id", eventId)
      }

      // Fetch event: use full_film_url, preview_film_url, or film_url (film may not be ready yet)
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("full_film_url, preview_film_url, film_url, name, slug")
        .eq("id", eventId)
        .single()

      if (!eventError && event) {
        if (event.slug && normSeg(event.slug) !== normSeg(slug)) {
          return { ok: false, error: "This memorial could not be verified." }
        }
        const downloadUrl =
          (event.full_film_url ?? event.preview_film_url ?? event.film_url ?? "") || ""
        const rawTier = (session.metadata?.tier as string | undefined)?.trim()
        const tier = rawTier || "premium"
        return {
          ok: true,
          downloadUrl,
          eventName: event.name ?? null,
          tier,
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
