"use server"

import { attemptTributeClipGenerationForEvent } from "@/lib/tributeClipPipeline"
import { resolveMemorialOwnerForSlug } from "@/lib/verifyMemorialOwner"

export type RequestFullFilmResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * Premium: request the next ~10s Luma Ray 2 clip (five clips total per purchase).
 * Resolves the memorial the same way as admin (`resolveMemorialOwnerForSlug`: exact slug, then case-insensitive fallback)
 * so URL casing matches never yield "Event not found" while the dashboard loads.
 */
export async function requestFullFilmAction(slug: string): Promise<RequestFullFilmResult> {
  const resolved = await resolveMemorialOwnerForSlug(slug)
  if (!resolved.ok) {
    return { ok: false, error: "Event not found." }
  }

  const result = await attemptTributeClipGenerationForEvent(resolved.eventId, {
    revalidate: true,
    source: "admin",
  })

  if (result.ok) {
    return { ok: true, message: result.message }
  }
  return { ok: false, error: result.error }
}
