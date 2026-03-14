"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type DeleteStoryResult = { ok: true } | { ok: false; error: string }

/** 관리자: 스토리 삭제 (Pending에서 제거) */
export async function deleteStoryAction(storyId: string): Promise<DeleteStoryResult> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("stories").delete().eq("id", storyId)

  if (error) {
    console.error("[deleteStory]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
