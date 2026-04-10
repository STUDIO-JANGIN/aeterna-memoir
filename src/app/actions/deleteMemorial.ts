"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getEventBySlug } from "@/app/actions/setStorySelected"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { verifyMemorialOwnerBySlug } from "@/lib/verifyMemorialOwner"

export type DeleteMemorialResult = { ok: true } | { ok: false; error: string }

/**
 * Permanently deletes an event row (CASCADE removes related stories, comments, etc. per DB schema).
 * Only the memorial owner may delete.
 */
export async function deleteMemorialAction(slug: string): Promise<DeleteMemorialResult> {
  noStore()

  const norm = slug?.trim()
  if (!norm) {
    return { ok: false, error: "Invalid memorial." }
  }

  const allowed = await verifyMemorialOwnerBySlug(norm)
  if (!allowed) {
    return { ok: false, error: "You don't have permission to delete this memorial." }
  }

  const event = await getEventBySlug(norm)
  if (!event?.id) {
    return { ok: false, error: "Memorial not found." }
  }

  const { error } = await getSupabaseAdmin().from("events").delete().eq("id", event.id)

  if (error) {
    console.error("[deleteMemorialAction]", error.message, { eventId: event.id })
    return { ok: false, error: error.message || "Could not delete this memorial." }
  }

  return { ok: true }
}
