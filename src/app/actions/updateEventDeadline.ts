"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

export type UpdateDeadlineResult =
  | { ok: true; collection_end_at: string; expired_at: string }
  | { ok: false; error: string }

/** Extend deadline by 24 hours; if already closed, reopen from now + 24h. */
export async function extendDeadlineAction(
  eventId: string,
  extendHours: number = 24,
  slug?: string
): Promise<UpdateDeadlineResult> {
  const supabase = getSupabaseAdmin()
  const { data: row, error: fetchError } = await supabase
    .from("events")
    .select("collection_end_at, created_at")
    .eq("id", eventId)
    .single()

  if (fetchError || !row) {
    return { ok: false, error: fetchError?.message ?? "Event not found." }
  }

  const now = new Date()
  const base = row.collection_end_at
    ? new Date(row.collection_end_at)
    : new Date(row.created_at || now)
  const baseMs = base.getTime()
  const nowMs = now.getTime()
  const from = baseMs > nowMs ? base : now
  const newEnd = new Date(from.getTime() + extendHours * 60 * 60 * 1000)
  const iso = newEnd.toISOString()

  const { error: updateError } = await supabase
    .from("events")
    .update({ collection_end_at: iso })
    .eq("id", eventId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }
  if (slug) revalidatePath(`/p/${slug}/admin`)
  return { ok: true, collection_end_at: iso, expired_at: iso }
}

/** Close immediately by setting collection_end_at to the current time (past). */
export async function closeDeadlineNowAction(eventId: string, slug?: string): Promise<UpdateDeadlineResult> {
  const supabase = getSupabaseAdmin()
  const iso = new Date().toISOString()
  const { error } = await supabase
    .from("events")
    .update({ collection_end_at: iso })
    .eq("id", eventId)

  if (error) {
    return { ok: false, error: error.message }
  }
  if (slug) revalidatePath(`/p/${slug}/admin`)
  return { ok: true, collection_end_at: iso, expired_at: iso }
}
