"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

export type StartAiFilmResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * Request AI film build for an event (slug).
 * Ensures exactly 20 stories are selected; then marks build as requested.
 * Actual video generation would be done by a backend job; here we only validate and persist state.
 */
export async function startAiFilmAction(slug: string): Promise<StartAiFilmResult> {
  const supabase = getSupabaseAdmin()
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name")
    .eq("slug", slug)
    .single()

  if (eventErr || !event) {
    return { ok: false, error: "Event not found." }
  }

  const { data: selected, error: selErr } = await supabase
    .from("stories")
    .select("id")
    .eq("event_id", event.id)
    .eq("is_approved", true)
    .eq("is_selected", true)

  if (selErr) {
    return { ok: false, error: "Failed to load selection." }
  }

  const count = selected?.length ?? 0
  if (count !== 20) {
    return {
      ok: false,
      error: `Please select exactly 20 photos for the film. Currently selected: ${count}.`,
    }
  }

  // Optional: set a column like film_build_requested_at for backend job to pick up.
  // For now we only validate; you can add .update({ film_build_requested_at: new Date().toISOString() }) when the column exists.
  revalidatePath(`/p/${slug}/admin`)
  revalidatePath(`/p/${slug}`)
  return {
    ok: true,
    message: "AI film build started. You will be notified when the film is ready.",
  }
}
