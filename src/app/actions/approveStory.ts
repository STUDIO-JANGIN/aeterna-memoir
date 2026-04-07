"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type ApproveResult = { ok: true } | { ok: false; error: string }

/** Admin: approve story for public display (stories.is_approved = true). */
export async function approveStoryAction(storyId: string): Promise<ApproveResult> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("stories")
    .update({ is_approved: true })
    .eq("id", storyId)

  if (error) {
    console.error("[approveStory]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** Admin: return story to pending (is_approved = false). Clears film selection. */
export async function unapproveStoryAction(storyId: string): Promise<ApproveResult> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("stories")
    .update({ is_approved: false, is_selected: false })
    .eq("id", storyId)

  if (error) {
    console.error("[unapproveStory]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
