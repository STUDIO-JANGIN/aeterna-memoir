"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { verifyMemorialOwnerBySlug } from "@/lib/verifyMemorialOwner"

export type SetSelectedResult = { ok: true } | { ok: false; error: string }

/** Admin: set final story selection flag (stories.is_selected) for video rendering. */
export async function setStorySelectedAction(
  storyId: string,
  isSelected: boolean
): Promise<SetSelectedResult> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("stories")
    .update({ is_selected: isSelected })
    .eq("id", storyId)

  if (error) {
    console.error("[setStorySelected]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export type AdminStory = {
  id: string
  event_id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  likes_count: number | null
  is_selected: boolean | null
  is_approved: boolean | null
  created_at: string
}

export type AdminEvent = {
  id: string
  name: string | null
  slug: string | null
  collection_end_at: string | null
  expired_at: string | null
  is_paid: boolean | null
  tier: string | null
  video_credits?: number | null
  created_at: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
  flower_link: string | null
  profile_image: string | null
  music_url: string | null
  bank_info: string | null
  invitation_bio: string | null
  preview_film_url: string | null
  full_film_requested_at: string | null
  full_film_url?: string | null
  /** Five slots for ~10s Luma clips (null = not generated yet). */
  tribute_film_urls?: (string | null)[] | null
  video_status?: string | null
  invite_pdf_url?: string | null
  /** Locale code → public PDF URL (Supabase `invite_pdf_urls` JSON). */
  invite_pdf_urls?: Record<string, string> | null
}

/** Server action: fetch a single event by slug (client-invoked). */
export async function getEventBySlugAction(slug: string): Promise<AdminEvent | null> {
  return getEventBySlug(slug)
}

/** Fetch one event by slug (admin/guest). Try exact match, then one case-insensitive fallback. */
export async function getEventBySlug(slug: string): Promise<AdminEvent | null> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) {
    console.error("[getEventBySlug] empty slug", { slug })
    return null
  }

  const selectCols =
    "id, name, slug, collection_end_at, expired_at, is_paid, tier, video_credits, created_at, birth_date, death_date, location, ceremony_time, flower_link, profile_image, music_url, bank_info, invitation_bio, preview_film_url, full_film_requested_at, full_film_url, tribute_film_urls, video_status, invite_pdf_url, invite_pdf_urls"

  const { data, error } = await supabase
    .from("events")
    .select(selectCols)
    .eq("slug", slugNorm)
    .maybeSingle()

  if (error) {
    console.error("[getEventBySlug] query failed", { slug: slugNorm, message: error.message, code: error.code })
    return null
  }

  if (data && typeof data === "object" && data.id) {
    return {
      ...data,
      expired_at: data.expired_at ?? data.collection_end_at ?? null,
    } as AdminEvent
  }

  const { data: dataFallback, error: errorFallback } = await supabase
    .from("events")
    .select(selectCols)
    .ilike("slug", slugNorm)
    .limit(1)
    .maybeSingle()

  if (errorFallback) {
    console.error("[getEventBySlug] fallback(ilike) query failed", { slug: slugNorm, message: errorFallback.message })
    return null
  }
  if (dataFallback && typeof dataFallback === "object" && dataFallback.id) {
    return {
      ...dataFallback,
      expired_at: dataFallback.expired_at ?? dataFallback.collection_end_at ?? null,
    } as AdminEvent
  }

  console.error("[getEventBySlug] event not found (no data or invalid type). slug:", slugNorm)
  return null
}

/** Admin: fetch event by slug + all stories (approved and pending), sorted by likes desc. */
export async function getStoriesForAdminAction(slug: string): Promise<{
  event: AdminEvent | null
  stories: AdminStory[]
  error?: string
}> {
  const allowed = await verifyMemorialOwnerBySlug(slug)
  if (!allowed) {
    return { event: null, stories: [], error: "Unauthorized." }
  }

  const supabase = getSupabaseAdmin()
  const eventData = await getEventBySlug(slug)

  if (!eventData) {
    console.error("[getStoriesForAdminAction] getEventBySlug returned null → Event not found.", { slug })
    return { event: null, stories: [], error: "Event not found." }
  }

  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id, event_id, author_name, story_text, image_url, likes_count, is_selected, is_approved, created_at")
    .eq("event_id", eventData.id)
    .order("likes_count", { ascending: false, nullsFirst: false })

  if (storiesError) {
    console.error("[getStoriesForAdminAction] failed to fetch story list", { eventId: eventData.id, message: storiesError.message })
    return { event: eventData, stories: [], error: storiesError.message }
  }

  return {
    event: eventData,
    stories: (storiesData ?? []) as AdminStory[],
  }
}

/** Presentation mode: fetch event by slug + approved stories with images only. */
export type PresentStory = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  created_at: string
}

export type PresentEvent = {
  id: string
  name: string | null
  birth_date: string | null
  death_date: string | null
  music_url: string | null
}

export async function getPresentDataAction(slug: string): Promise<{
  event: PresentEvent | null
  stories: PresentStory[]
  error?: string
}> {
  const supabase = getSupabaseAdmin()
  const eventData = await getEventBySlug(slug)
  if (!eventData) {
    return { event: null, stories: [], error: "Event not found." }
  }

  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id, author_name, story_text, image_url, created_at")
    .eq("event_id", eventData.id)
    .eq("is_approved", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: true })

  if (storiesError) {
    console.error("[getPresentDataAction] stories fetch failed", storiesError)
    return { event: eventData, stories: [], error: storiesError.message }
  }

  const event: PresentEvent = {
    id: eventData.id,
    name: eventData.name,
    birth_date: eventData.birth_date,
    death_date: eventData.death_date,
    music_url: eventData.music_url,
  }
  return {
    event,
    stories: (storiesData ?? []) as PresentStory[],
  }
}
