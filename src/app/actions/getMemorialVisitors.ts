"use server"

import { verifyMemorialOwnerBySlug } from "@/lib/verifyMemorialOwner"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import {
  VISITOR_PROVIDER_STORY_PREFIX,
  isMissingVisitorsStoryIdColumn,
} from "@/lib/visitorStoryNotify"

export type VisitorRow = {
  email: string | null
  provider: string | null
  story_id: string | null
  created_at: string | null
}

export async function getMemorialVisitorsAction(
  slug: string
): Promise<{ ok: true; visitors: VisitorRow[] } | { ok: false; error: string }> {
  const norm = slug?.trim()
  if (!norm) return { ok: false, error: "Invalid memorial." }

  const allowed = await verifyMemorialOwnerBySlug(norm)
  if (!allowed) return { ok: false, error: "Not authorized." }

  const supabase = getSupabaseAdmin()
  const { data: ev, error: evErr } = await supabase.from("events").select("id").eq("slug", norm).maybeSingle()
  if (evErr || !ev?.id) return { ok: false, error: "Memorial not found." }

  let data:
    | { email: string | null; provider: string | null; created_at: string | null; story_id?: string | null }[]
    | null = null
  let error: { message: string; code?: string } | null = null

  const full = await supabase
    .from("visitors")
    .select("email, provider, story_id, created_at")
    .eq("event_id", ev.id)
    .order("created_at", { ascending: false })

  if (full.error && isMissingVisitorsStoryIdColumn(full.error)) {
    const minimal = await supabase
      .from("visitors")
      .select("email, provider, created_at")
      .eq("event_id", ev.id)
      .order("created_at", { ascending: false })
    data = minimal.data
    error = minimal.error
  } else {
    data = full.data
    error = full.error
  }

  if (error) {
    console.error("[getMemorialVisitors]", error)
    return { ok: false, error: error.message }
  }

  const visitors: VisitorRow[] = (data ?? []).map((row) => {
    const fromProvider =
      row.provider?.startsWith(VISITOR_PROVIDER_STORY_PREFIX) === true
        ? row.provider.slice(VISITOR_PROVIDER_STORY_PREFIX.length) || null
        : null
    return {
      email: row.email,
      provider: row.provider,
      created_at: row.created_at,
      story_id: row.story_id ?? fromProvider,
    }
  })

  return { ok: true, visitors }
}
