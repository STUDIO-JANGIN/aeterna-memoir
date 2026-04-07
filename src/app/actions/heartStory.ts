"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type HeartResult =
  | { ok: true; likesCount: number }
  | { ok: false; error: string }

/** Story heart: increment likes_count by 1 (no duplicate check). */
export async function heartStoryAction(storyId: string): Promise<HeartResult> {
  const supabase = getSupabaseAdmin()
  const { data: row, error: fetchError } = await supabase
    .from("stories")
    .select("likes_count")
    .eq("id", storyId)
    .single()

  if (fetchError || row == null) {
    return { ok: false, error: fetchError?.message ?? "Story not found." }
  }

  const nextCount = (row.likes_count ?? 0) + 1
  const { error: updateError } = await supabase
    .from("stories")
    .update({ likes_count: nextCount })
    .eq("id", storyId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }
  return { ok: true, likesCount: nextCount }
}
