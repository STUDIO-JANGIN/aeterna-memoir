"use server"

import { Buffer } from "node:buffer"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type UploadNewEventBackgroundResult =
  | { ok: true }
  | { ok: false; error: string }

function safeImageFileStem(raw: string): string {
  const base = raw.replace(/[/\\]/g, "").replace(/[^\w.\-()+ ]/g, "").trim() || "background"
  return base.slice(0, 80)
}

function extForMime(mime: string): string {
  const m = mime.toLowerCase()
  if (m.includes("png")) return "png"
  if (m.includes("webp")) return "webp"
  if (m.includes("gif")) return "gif"
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg"
  return "jpg"
}

/**
 * Upload optional memorial page background image after event creation (same pattern as profile).
 * Requires columns `memorial_background_image` and `memorial_background_position` on `events`
 * — apply `supabase-sync-events-optional-columns.sql` (or the individual `supabase-add-memorial-background-*.sql` files) before production use.
 */
export async function uploadNewEventBackgroundAction(
  slug: string,
  formData: FormData
): Promise<UploadNewEventBackgroundResult> {
  const supabase = getSupabaseAdmin()
  const raw = formData.get("memorial_background_image")
  if (raw == null) return { ok: true }
  if (typeof raw === "string") return { ok: true }
  if (!(raw instanceof Blob)) {
    console.error("[uploadNewEventBackground] unexpected field type", typeof raw)
    return { ok: false, error: "Could not read the background image." }
  }
  if (raw.size === 0) return { ok: true }

  const { data: eventRow, error: fetchErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug.trim())
    .maybeSingle()

  if (fetchErr || !eventRow?.id) {
    return { ok: false, error: "Event not found." }
  }

  const arrayBuffer = await raw.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mime = raw.type && raw.type.length > 0 ? raw.type : "image/jpeg"
  const ext = extForMime(mime)
  const stem =
    raw instanceof File && raw.name?.trim()
      ? safeImageFileStem(raw.name).replace(/\.[^.]+$/, "")
      : "background"
  const path = `memorial-bg/${eventRow.id}/${Date.now()}_${stem}.${ext}`

  const { error: upErr } = await supabase.storage.from("photos").upload(path, buffer, {
    upsert: true,
    contentType: mime,
  })
  if (upErr) {
    console.error("[uploadNewEventBackground]", upErr)
    return { ok: false, error: upErr.message }
  }

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
  const memorial_background_image = urlData.publicUrl

  const posRaw = formData.get("memorial_background_position")
  let memorial_background_position: string | null = null
  if (typeof posRaw === "string") {
    const t = posRaw.trim()
    const m = /^(\d{1,3}),(\d{1,3})$/.exec(t)
    if (m) {
      const x = Math.min(100, Math.max(0, Number(m[1])))
      const y = Math.min(100, Math.max(0, Number(m[2])))
      if (Number.isFinite(x) && Number.isFinite(y)) {
        memorial_background_position = `${Math.round(x)},${Math.round(y)}`
      }
    }
  }

  const { error: updateErr } = await supabase
    .from("events")
    .update({ memorial_background_image, memorial_background_position })
    .eq("id", eventRow.id)

  if (updateErr) {
    console.error("[uploadNewEventBackground] update", updateErr)
    return { ok: false, error: updateErr.message }
  }
  return { ok: true }
}
