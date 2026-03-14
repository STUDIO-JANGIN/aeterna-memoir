"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

export type ApproveResult = { ok: true } | { ok: false; error: string }

/** 관리자: 스토리 공개 승인 (stories.is_approved = true) */
export async function approveStoryAction(storyId: string): Promise<ApproveResult> {
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
