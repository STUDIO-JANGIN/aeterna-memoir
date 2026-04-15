"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { parseUuidString } from "@/lib/uuid"

export type HeartCommentResult =
  | { ok: true; likesCount: number }
  | { ok: false; error: string }

/** Increment comment heart count (same pattern as story hearts). */
export async function heartCommentAction(commentId: string): Promise<HeartCommentResult> {
  const id = parseUuidString(commentId)
  if (!id) {
    return { ok: false, error: "Invalid comment id." }
  }
  const supabase = getSupabaseAdmin()
  const { data: row, error: fetchError } = await supabase
    .from("comments")
    .select("likes_count")
    .eq("id", id)
    .single()

  if (fetchError || row == null) {
    return { ok: false, error: fetchError?.message ?? "Comment not found." }
  }

  const nextCount = (row.likes_count ?? 0) + 1
  const { error: updateError } = await supabase
    .from("comments")
    .update({ likes_count: nextCount })
    .eq("id", id)

  if (updateError) {
    if (
      updateError.message?.toLowerCase().includes("likes_count") ||
      updateError.message?.toLowerCase().includes("schema")
    ) {
      return { ok: false, error: "Hearts are not available yet. Ask the site owner to run the latest database migration." }
    }
    return { ok: false, error: updateError.message }
  }
  return { ok: true, likesCount: nextCount }
}

export async function unheartCommentAction(commentId: string): Promise<HeartCommentResult> {
  const id = parseUuidString(commentId)
  if (!id) {
    return { ok: false, error: "Invalid comment id." }
  }
  const supabase = getSupabaseAdmin()
  const { data: row, error: fetchError } = await supabase
    .from("comments")
    .select("likes_count")
    .eq("id", id)
    .single()

  if (fetchError || row == null) {
    return { ok: false, error: fetchError?.message ?? "Comment not found." }
  }

  const current = row.likes_count ?? 0
  const nextCount = Math.max(0, current - 1)
  const { error: updateError } = await supabase
    .from("comments")
    .update({ likes_count: nextCount })
    .eq("id", id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }
  return { ok: true, likesCount: nextCount }
}
