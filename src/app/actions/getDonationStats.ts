"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type DonationStatsResult =
  | { ok: true; count: number; list: { displayLabel: string }[]; recentCount1h: number }
  | { ok: false; error: string }

const MAX_LIST_SIZE = 30

/**
 * Returns count and list of completed platform_tip (후원) payments for the event.
 * list[].displayLabel is masked for social proof, e.g. "익명의 지인님이 1%의 마음을 보탰습니다".
 */
export async function getDonationStatsAction(slug: string): Promise<DonationStatsResult> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) {
    return { ok: false, error: "Invalid slug." }
  }

  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slugNorm)
    .maybeSingle()

  if (eventErr || !eventRow?.id) {
    return { ok: false, error: "Event not found." }
  }

  const { data: rows, error } = await supabase
    .from("payments")
    .select("id, user_email")
    .eq("event_id", eventRow.id)
    .eq("purpose", "platform_tip")
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(MAX_LIST_SIZE)

  if (error) {
    return { ok: false, error: error.message }
  }

  const list = (rows ?? []).map((r) => {
    const label = maskDonorLabel(r.user_email)
    return { displayLabel: `${label}님이 1%의 마음을 보탰습니다` }
  })

  const { count, error: countErr } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventRow.id)
    .eq("purpose", "platform_tip")
    .eq("status", "completed")

  const totalCount = countErr ? list.length : (count ?? list.length)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount, error: recentErr } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventRow.id)
    .eq("purpose", "platform_tip")
    .eq("status", "completed")
    .gte("updated_at", oneHourAgo)

  const recentCount1h = recentErr ? 0 : (recentCount ?? 0)

  return { ok: true, count: totalCount, list, recentCount1h }
}

function maskDonorLabel(email: string | null): string {
  if (!email || typeof email !== "string") return "익명의 지인"
  const at = email.indexOf("@")
  if (at <= 0) return "익명의 지인"
  const local = email.slice(0, at).trim()
  if (!local) return "익명의 지인"
  const first = local[0]
  return first + "**"
}
