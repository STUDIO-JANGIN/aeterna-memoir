"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

export type AutoSelectResult =
  | { ok: true; selectedCount: number }
  | { ok: false; error: string }

const TOP_N = 15

/**
 * 마감된 이벤트에 대해 좋아요 상위 15장을 AI Film Candidate(is_selected)로 자동 선발.
 * 이미 마감된 경우에만 실행되며, idempotent.
 */
export async function autoSelectTop20ByLikesAction(
  slug: string
): Promise<AutoSelectResult> {
  const supabase = getSupabaseAdmin()
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, collection_end_at")
    .eq("slug", slug.trim())
    .maybeSingle()

  if (eventErr || !event?.id) {
    return { ok: false, error: "Event not found." }
  }

  const deadlineAt = event.collection_end_at
  if (!deadlineAt) {
    return { ok: false, error: "Event has no deadline." }
  }
  if (new Date(deadlineAt).getTime() > Date.now()) {
    return { ok: false, error: "Event not yet expired." }
  }

  const { data: approved, error: listErr } = await supabase
    .from("stories")
    .select("id")
    .eq("event_id", event.id)
    .eq("is_approved", true)
    .order("likes_count", { ascending: false, nullsFirst: false })
    .limit(TOP_N)

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
