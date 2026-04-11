"use server"

import { verifyMemorialOwnerBySlug } from "@/lib/verifyMemorialOwner"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

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

  const { data, error } = await supabase
    .from("visitors")
    .select("email, provider, story_id, created_at")
    .eq("event_id", ev.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getMemorialVisitors]", error)
    return { ok: false, error: error.message }
  }

  return { ok: true, visitors: (data ?? []) as VisitorRow[] }
}
