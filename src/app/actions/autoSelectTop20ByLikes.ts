"use server"

import { eventRowIsPaidMemorial } from "@/lib/paidMemorialDeadlines"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { TRIBUTE_FILM_MAX_PHOTOS } from "@/lib/tributeFilmConfig"

export type AutoSelectResult =
  | { ok: true; selectedCount: number }
  | { ok: false; error: string }

/**
 * For closed events, auto-select top liked photos as AI film candidates (is_selected).
 * Count matches the per-clip Eternal Film selection cap. Runs only after closure and is idempotent.
 */
export async function autoSelectTop20ByLikesAction(
  slug: string
): Promise<AutoSelectResult> {
  const supabase = getSupabaseAdmin()
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, collection_end_at, is_paid, tier, is_premium")
    .eq("slug", slug.trim())
    .maybeSingle()

  if (eventErr || !event?.id) {
    return { ok: false, error: "Event not found." }
  }

  const paid = eventRowIsPaidMemorial(event)
  const deadlineAt = event.collection_end_at
  if (!paid) {
    if (!deadlineAt) {
      return { ok: false, error: "Event has no deadline." }
    }
    if (new Date(deadlineAt).getTime() > Date.now()) {
      return { ok: false, error: "Event not yet expired." }
    }
  }

  const { data: approved, error: listErr } = await supabase
    .from("stories")
    .select("id")
    .eq("event_id", event.id)
    .eq("is_approved", true)
    .order("likes_count", { ascending: false, nullsFirst: false })
    .limit(TRIBUTE_FILM_MAX_PHOTOS)

  if (listErr) {
    return { ok: false, error: listErr.message }
  }

  const topIds = (approved ?? []).map((r) => r.id)
  if (topIds.length === 0) {
    await supabase
      .from("stories")
      .update({ is_selected: false })
      .eq("event_id", event.id)
    revalidatePath(`/p/${slug}/admin`)
    return { ok: true, selectedCount: 0 }
  }

  await supabase
    .from("stories")
    .update({ is_selected: false })
    .eq("event_id", event.id)

  await supabase
    .from("stories")
    .update({ is_selected: true })
    .in("id", topIds)

  revalidatePath(`/p/${slug}/admin`)
  return { ok: true, selectedCount: topIds.length }
}
