"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function randomId(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24) || "memorial"
  return `${base}-${randomId(6)}`
}

export type CreateEventInput = {
  name: string
  birth_date: string
  death_date: string
  location: string
  ceremony_time?: string
  has_fund: boolean
  fund_link?: string
  /** Ignored — creator email is taken only from the authenticated session. */
  creator_email?: string
  memorial_type?: "person" | "pet"
  /** "3" | "7" | "14" = days, "custom" = use custom_expired_at */
  collection_period?: "3" | "7" | "14" | "custom"
  /** Used only when collection_period === "custom" (ISO string). */
  custom_expired_at?: string
  /** Optional remembrance line for the printable invitation. */
  invitation_bio?: string
  /**
   * @deprecated Ignored at insert. Events are always created as `free`; Plus/Premium
   * are set only after Stripe payment (webhook / verified session).
   */
  tier?: "free" | "plus" | "premium"
  /** @deprecated Ignored at insert. */
  is_premium?: boolean
}

export type CreateEventResult =
  | { ok: true; slug: string; eventId: string }
  | { ok: false; error: string }

export async function createEventAction(
  input: CreateEventInput
): Promise<CreateEventResult> {
  const supabase = getSupabaseAdmin()
  const name = input.name?.trim()
  if (!name) return { ok: false, error: "Name is required." }

  const auth = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await auth.auth.getUser()
  if (userError || !user?.id) {
    return {
      ok: false,
      error: "Could not verify your session. Refresh the page and try again.",
    }
  }
  const email = user.email?.trim()
  if (!email) {
    return { ok: false, error: "Your account needs an email address to create a memorial." }
  }

  const creator_user_id = user.id

  let slug = makeSlug(name)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()
    if (!existing) break
    slug = makeSlug(name)
  }

  const ceremony_time = input.ceremony_time?.trim() || "Time TBD"
  const location = input.location?.trim() || "Location TBD"
  const flower_link =
    input.has_fund && input.fund_link?.trim()
      ? input.fund_link.trim()
      : null

  const now = new Date()
  let expiredAt: Date
  if (input.collection_period === "custom" && input.custom_expired_at?.trim()) {
    const parsed = new Date(input.custom_expired_at.trim())
    if (Number.isNaN(parsed.getTime())) expiredAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    else expiredAt = parsed
  } else if (input.collection_period === "3") {
    expiredAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  } else if (input.collection_period === "14") {
    expiredAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  } else {
    expiredAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
  const expired_at = expiredAt.toISOString()
  const collection_end_at = expired_at
  const photo_deadline = expired_at
  const memorial_type = input.memorial_type === "pet" ? "pet" : "person"
  /**
   * SECURITY: Never trust client `tier` / `is_premium` for paid plans.
   * Plus / Premium must be granted only after Stripe `checkout.session.completed` (webhook)
   * or verified Checkout Session on the server. New memorials always start as `free`.
   *
   * Tier is stored per `events` row: the same user may have multiple memorials, each with its own
   * tier — payment for one never upgrades another.
   */
  const tier = "free"
  const isPremium = false

  const invitation_bio =
    input.invitation_bio?.trim() ? input.invitation_bio.trim().slice(0, 2000) : null

  const insertRow: Record<string, unknown> = {
    name,
    creator_email: email,
    creator_user_id,
    birth_date: input.birth_date || "—",
    death_date: input.death_date || "—",
    location,
    ceremony_time,
    flower_link,
    invitation_bio,
    slug,
    expired_at,
    collection_end_at,
    memorial_type,
    status: "active",
    photo_deadline,
    is_premium: isPremium,
    tier,
  }

  const { data, error } = await supabase
    .from("events")
    .insert([insertRow])
    .select("id, slug")
    .single()

  if (error) {
    console.error("[createEvent]", error)
    return { ok: false, error: error.message }
  }
  if (!data?.slug) return { ok: false, error: "Failed to create event." }
  return { ok: true, slug: data.slug, eventId: data.id }
}
