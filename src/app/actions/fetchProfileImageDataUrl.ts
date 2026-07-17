"use server"

import { Buffer } from "node:buffer"
import { resolveProfileImageUrl } from "@/lib/profileImageUrl"

/**
 * Fetches a memorial profile image server-side (no browser CORS) for canvas/PDF export.
 */
export async function fetchProfileImageDataUrlAction(
  rawUrl: string | null | undefined
): Promise<string | null> {
  const url = resolveProfileImageUrl(rawUrl)
  if (!url || !/^https?:\/\//i.test(url)) return null

  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg"
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) return null
    return `data:${mime};base64,${buf.toString("base64")}`
  } catch (e) {
    console.warn("[fetchProfileImageDataUrl]", e)
    return null
  }
}
