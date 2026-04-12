"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { getAppBaseUrl } from "@/lib/appUrl"
import { sendStoryApprovedEmail } from "@/lib/sendStoryApprovedEmail"
import {
  isMissingVisitorsStoryIdColumn,
  visitorProviderForStoryNotify,
} from "@/lib/visitorStoryNotify"

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

  try {
    const emails = new Set<string>()
    const byStory = await supabase
      .from("visitors")
      .select("email")
      .eq("story_id", storyId)
      .not("email", "is", null)

    if (byStory.error && isMissingVisitorsStoryIdColumn(byStory.error)) {
      // DB has no story_id column — only encoded provider rows exist
    } else if (byStory.error) {
      console.error("[approveStory] visitors by story_id", byStory.error)
    } else {
      for (const v of byStory.data ?? []) {
        const to = (v.email as string | null)?.trim()
        if (to) emails.add(to)
      }
    }

    const byProvider = await supabase
      .from("visitors")
      .select("email")
      .eq("provider", visitorProviderForStoryNotify(storyId))
      .not("email", "is", null)

    if (byProvider.error) {
      console.error("[approveStory] visitors by provider", byProvider.error)
    } else {
      for (const v of byProvider.data ?? []) {
        const to = (v.email as string | null)?.trim()
        if (to) emails.add(to)
      }
    }

    const visitors = [...emails].map((email) => ({ email }))
    if (!visitors.length) {
      return { ok: true }
    }

    const { data: storyRow } = await supabase.from("stories").select("event_id").eq("id", storyId).maybeSingle()
    const eventId = storyRow?.event_id as string | undefined
    if (!eventId) return { ok: true }

    const { data: eventRow } = await supabase
      .from("events")
      .select("slug, name")
      .eq("id", eventId)
      .maybeSingle()

    const slug = eventRow?.slug as string | undefined
    const memorialName = (eventRow?.name as string | undefined)?.trim() || "this memorial"
    if (!slug) return { ok: true }

    const base = getAppBaseUrl()
    const memorialUrl = `${base}/p/${encodeURIComponent(slug)}`

    for (const v of visitors) {
      const to = (v.email as string | null)?.trim()
      if (to) {
        await sendStoryApprovedEmail({ to, memorialName, memorialUrl })
      }
    }
  } catch (e) {
    console.error("[approveStory] visitor notify", e)
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
