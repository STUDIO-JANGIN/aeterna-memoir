"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

export type UpdateDeadlineResult =
  | { ok: true; collection_end_at: string; expired_at: string }
  | { ok: false; error: string }

/** 마감 24시간 연장: 이미 마감된 경우에는 현재 시각 + 24시간으로 재오픈 */
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

/** 지금 즉시 마감: collection_end_at을 현재 시각(과거)으로 설정 */
export async function closeDeadlineNowAction(eventId: string, slug?: string): Promise<UpdateDeadlineResult> {
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
