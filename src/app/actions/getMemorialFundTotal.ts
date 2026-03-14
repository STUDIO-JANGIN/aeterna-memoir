"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type MemorialFundTotalResult =
  | { ok: true; totalCents: number; currency: string | null }
  | { ok: false; error: string }

/**
 * Sum completed support_family payments for this event (memorial fund).
 * Used to show "fund has already covered X" near upgrade CTAs.
 */
export async function getMemorialFundTotalBySlugAction(slug: string): Promise<MemorialFundTotalResult> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) return { ok: false, error: "Invalid slug." }

  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slugNorm)
    .maybeSingle()

  if (eventErr || !eventRow?.id) {
    return { ok: false, error: "Event not found." }
  }

  const { data, error } = await supabase
    .from("payments")
    .select("amount_cents, currency")
    .eq("event_id", eventRow.id)
    .eq("purpose", "support_family")
    .eq("status", "completed")

  if (error) {
    return { ok: false, error: error.message }
  }

  const rows = data ?? []
  const totalCents = rows.reduce((sum, row) => sum + (row.amount_cents ?? 0), 0)
  const currency = rows[0]?.currency ?? null

  return { ok: true, totalCents, currency }
}

