"use server"

import type { PostgrestError } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

/**
 * Memorial public fetch uses ONLY {@link getSupabaseAdmin} (SUPABASE_SERVICE_ROLE_KEY).
 * The browser anon client is never used here — RLS does not apply to service_role.
 */

export type PublicMemorialEvent = {
  id: string
  name: string | null
  profile_image: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
  flower_link: string | null
  collection_end_at: string | null
  is_paid: boolean | null
  created_at: string | null
  film_url: string | null
  full_film_url: string | null
  creator_email: string | null
  creator_user_id: string | null
  photo_deadline: string | null
  status: string | null
  is_premium: boolean | null
  tier: string | null
  bank_info: string | null
  invite_pdf_url: string | null
  /** Remembrance text from create flow / admin — shown on public memorial. */
  invitation_bio: string | null
}

export type PublicMemorialStory = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  thumb_url?: string | null
  likes_count: number | null
  created_at: string
}

export type GetPublicMemorialPageDataResult =
  | { ok: true; event: PublicMemorialEvent; stories: PublicMemorialStory[] }
  | {
      ok: false
      notFound: true
      /** Only set when MEMORIAL_FETCH_DEBUG=1 on the server (Vercel env). */
      debugSupabase?: { diagnostic: Record<string, unknown>; supabaseHost: string }
    }

const MEMORIAL_FETCH_DEBUG = process.env.MEMORIAL_FETCH_DEBUG === "1"

function supabaseHostFromEnv(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  try {
    return new URL(u).host || u
  } catch {
    return "(invalid NEXT_PUBLIC_SUPABASE_URL)"
  }
}

/** Logs the full PostgREST error (message, code, details, hint, etc.) for Vercel Runtime logs. */
function logSupabaseDetailedError(context: string, error: PostgrestError | null | undefined) {
  if (!error) return
  console.error(`SUPABASE_DETAILED_ERROR [${context}]:`, JSON.stringify(error, null, 2))
}

function normalizeSlugFromUrl(raw: string): string {
  const t = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "")
  try {
    return decodeURIComponent(t)
  } catch {
    return t
  }
}

/** PostgREST: 0 rows from .single() / .maybeSingle() — not an application error. */
function isNoRowsError(code: string | undefined): boolean {
  return code === "PGRST116" || code === "PGRST301"
}

function rowToPublicEvent(row: Record<string, unknown>): PublicMemorialEvent {
  return {
    id: String(row.id),
    name: (row.name as string | null) ?? null,
    profile_image: (row.profile_image as string | null) ?? null,
    birth_date: (row.birth_date as string | null) ?? null,
    death_date: (row.death_date as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    ceremony_time: (row.ceremony_time as string | null) ?? null,
    flower_link: (row.flower_link as string | null) ?? null,
    collection_end_at: (row.collection_end_at as string | null) ?? null,
    is_paid: (row.is_paid as boolean | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    film_url: (row.film_url as string | null) ?? null,
    full_film_url: (row.full_film_url as string | null) ?? null,
    creator_email: (row.creator_email as string | null) ?? null,
    creator_user_id: (row.creator_user_id as string | null) ?? null,
    photo_deadline: (row.photo_deadline as string | null) ?? null,
    status: (row.status as string | null) ?? null,
    is_premium: (row.is_premium as boolean | null) ?? null,
    tier: (row.tier as string | null) ?? null,
    bank_info: (row.bank_info as string | null) ?? null,
    invite_pdf_url: (row.invite_pdf_url as string | null) ?? null,
    invitation_bio: (row.invitation_bio as string | null) ?? null,
  }
}

/**
 * Public memorial page: load event + approved stories using the service role so
 * anon RLS cannot block reads after Stripe redirect or for guests.
 */
export async function getPublicMemorialPageDataAction(slug: string): Promise<GetPublicMemorialPageDataResult> {
  const slugNorm = normalizeSlugFromUrl(slug ?? "")
  if (!slugNorm) {
    return { ok: false, notFound: true }
  }

  try {
    const supabase = getSupabaseAdmin()
    const host = supabaseHostFromEnv()

    // Public memorial: match by slug only. Free tier (is_paid: false) must load — never filter .eq("is_paid", true).
    const { data: row, error: rowError } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slugNorm)
      .maybeSingle()

    if (rowError && !isNoRowsError(rowError.code)) {
      logSupabaseDetailedError("getPublicMemorialPageDataAction.events_eq_slug", rowError)
    }

    if (row && typeof row === "object" && "id" in row && row.id) {
      const data = row as Record<string, unknown>
      const eventId = String(data.id)

      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select("id, author_name, story_text, image_url, thumb_url, likes_count, created_at")
        .eq("event_id", eventId)
        .eq("is_approved", true)
        .order("likes_count", { ascending: false, nullsFirst: false })

      if (storiesError) {
        logSupabaseDetailedError("getPublicMemorialPageDataAction.stories", storiesError)
      }
      const rawStories = storiesError ? [] : (storiesData ?? [])
      const stories: PublicMemorialStory[] = rawStories.map((row: Record<string, unknown>) => ({
        id: String(row.id ?? ""),
        author_name: (row.author_name as string | null) ?? null,
        story_text: (row.story_text as string | null) ?? null,
        image_url: (row.image_url as string | null) ?? null,
        thumb_url: (row.thumb_url as string | null) ?? undefined,
        likes_count: (row.likes_count as number | null) ?? null,
        created_at:
          typeof row.created_at === "string"
            ? row.created_at
            : row.created_at != null
              ? String(row.created_at)
              : new Date().toISOString(),
      }))

      return {
        ok: true,
        event: rowToPublicEvent(data),
        stories,
      }
    }

    const debugSupabase = MEMORIAL_FETCH_DEBUG
      ? { diagnostic: { note: "no row" }, supabaseHost: host }
      : undefined
    return { ok: false, notFound: true, ...(debugSupabase ? { debugSupabase } : {}) }
  } catch (e) {
    console.error("[getPublicMemorialPageDataAction] CRITICAL DB ERROR:", e)
    throw e
  }
}

export type PublicTeaserStory = { id: string; image_url: string | null }

export async function getPublicSelectedTeaserStoriesAction(eventId: string): Promise<PublicTeaserStory[]> {
  if (!eventId?.trim()) return []
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("stories")
    .select("id, image_url")
    .eq("event_id", eventId.trim())
    .eq("is_selected", true)
    .limit(5)

  if (error) return []
  return (data ?? []) as PublicTeaserStory[]
}

export async function getPublicApprovedStoriesForEventAction(eventId: string): Promise<PublicMemorialStory[]> {
  if (!eventId?.trim()) return []
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("stories")
    .select("id, author_name, story_text, image_url, thumb_url, likes_count, created_at")
    .eq("event_id", eventId.trim())
    .eq("is_approved", true)
    .order("likes_count", { ascending: false, nullsFirst: false })

  if (error) return []
  return (data ?? []) as PublicMemorialStory[]
}
