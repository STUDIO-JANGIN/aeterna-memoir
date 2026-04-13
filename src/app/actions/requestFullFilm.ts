"use server"

import { attemptTributeClipGenerationForEvent } from "@/lib/tributeClipPipeline"
import { resolveMemorialOwnerForSlug } from "@/lib/verifyMemorialOwner"

export type RequestFullFilmResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * Premium: request the next ~10s Luma Ray 2 clip (five clips total per purchase).
 * Resolves ownership via `resolveMemorialOwnerForSlug` (same rules as loading admin stories by URL slug).
 */
export async function requestFullFilmAction(slug: string): Promise<RequestFullFilmResult> {
  const resolved = await resolveMemorialOwnerForSlug(slug?.trim() ?? "")
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
