"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export type DeleteStoryResult = { ok: true } | { ok: false; error: string }

/** 관리자: 스토리 삭제 (Pending에서 제거) */
export async function deleteStoryAction(storyId: string): Promise<DeleteStoryResult> {
  const { error } = await supabase.from("stories").delete().eq("id", storyId)

  if (error) {
    console.error("[deleteStory]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
