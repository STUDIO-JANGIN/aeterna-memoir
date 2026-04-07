"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: string }

/** Notify me when the film is released: save email to notifications */
export async function subscribeNotificationAction(
  eventId: string,
  email: string
): Promise<SubscribeResult> {
  const supabase = getSupabaseAdmin()
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  const { error } = await supabase
    .from("notifications")
    .upsert(
      { event_id: eventId, email: trimmed },
      { onConflict: "event_id,email", ignoreDuplicates: true }
    )

  if (error) {
    if (error.code === "23503") return { ok: false, error: "Event not found." }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
