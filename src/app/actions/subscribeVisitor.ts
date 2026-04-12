"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import {
  isMissingVisitorsStoryIdColumn,
  visitorProviderForStoryNotify,
} from "@/lib/visitorStoryNotify"

export type SubscribeVisitorResult =
  | { ok: true }
  | { ok: false; error: string }

export async function subscribeVisitorAction(
  eventId: string,
  email: string,
  provider: string,
  /** When set, ties this signup to a specific story so we can email when that memory is approved. */
  storyId?: string | null
): Promise<SubscribeVisitorResult> {
  const supabase = getSupabaseAdmin()
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  try {
    const sid = storyId?.trim() ?? ""
    const baseRow: Record<string, unknown> = {
      event_id: eventId,
      email: trimmed,
      provider,
    }

    let row: Record<string, unknown> = { ...baseRow }
    if (sid) {
      row.story_id = sid
    }

    let { error } = await supabase
      .from("visitors")
      .upsert(row, { onConflict: "event_id,email", ignoreDuplicates: false })

    if (error && sid && isMissingVisitorsStoryIdColumn(error)) {
      const { story_id: _drop, ...withoutStory } = row
      row = {
        ...withoutStory,
        provider: visitorProviderForStoryNotify(sid),
      }
      const retry = await supabase
        .from("visitors")
        .upsert(row, { onConflict: "event_id,email", ignoreDuplicates: false })
      error = retry.error
    }

    if (error) {
      if (error.code === "23503") {
        return { ok: false, error: "We couldn’t find this memorial album." }
      }
      return { ok: false, error: error.message }
    }

    // Optional: also store in notifications table (ignore duplicates).
    await supabase
      .from("notifications")
      .upsert(
        { event_id: eventId, email: trimmed },
        { onConflict: "event_id,email", ignoreDuplicates: true }
      )

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong while subscribing for updates.",
    }
  }
}

