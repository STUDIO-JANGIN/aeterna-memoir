"use server"

import { attemptTributeClipGenerationForEvent } from "@/lib/tributeClipPipeline"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type RequestFullFilmResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * Premium: request the next ~10s Luma Ray 2 clip (five clips total per purchase).
 */
export async function requestFullFilmAction(slug: string): Promise<RequestFullFilmResult> {
  const supabase = getSupabaseAdmin()
  const { data: row, error } = await supabase.from("events").select("id").eq("slug", slug).maybeSingle()

  if (error || !row?.id) {
    return { ok: false, error: "Event not found." }
  }

  const result = await attemptTributeClipGenerationForEvent(row.id, {
    revalidate: true,
    source: "admin",
  })

  if (result.ok) {
    return { ok: true, message: result.message }
  }
  return { ok: false, error: result.error }
}
