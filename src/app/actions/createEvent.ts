"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

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
  creator_email: string
  memorial_type?: "person" | "pet"
  /** "3" | "7" | "14" = 일수, "custom" = custom_expired_at 사용 */
  collection_period?: "3" | "7" | "14" | "custom"
  /** collection_period === "custom"일 때만 사용 (ISO 문자열) */
  custom_expired_at?: string
  /** free | plus | premium. Free=7일 후 삭제·영상 불가, Plus=영구·전체 사진, Premium=Plus+AI 영상 */
  tier?: "free" | "plus" | "premium"
  /** @deprecated use tier instead */
  is_premium?: boolean
}

export type CreateEventResult =
  | { ok: true; slug: string; eventId: string }
  | { ok: false; error: string }

export async function createEventAction(
  input: CreateEventInput
): Promise<CreateEventResult> {
  const name = input.name?.trim()
  if (!name) return { ok: false, error: "Name is required." }
  if (!input.creator_email) return { ok: false, error: "Creator email is required." }

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
  const tier = input.tier === "plus" || input.tier === "premium" ? input.tier : input.is_premium === true ? "premium" : "free"
  const isPremium = tier === "premium" || tier === "plus"

  const { data, error } = await supabase
    .from("events")
    .insert([
      {
        name,
        creator_email: input.creator_email,
        birth_date: input.birth_date || "—",
        death_date: input.death_date || "—",
        location,
        ceremony_time,
        flower_link,
        slug,
        expired_at,
        collection_end_at,
        memorial_type,
        status: "active",
        photo_deadline,
        is_premium: isPremium,
        tier,
      },
    ])
    .select("id, slug")
    .single()

  if (error) {
    console.error("[createEvent]", error)
    return { ok: false, error: error.message }
  }
  if (!data?.slug) return { ok: false, error: "Failed to create event." }
  return { ok: true, slug: data.slug, eventId: data.id }
}
