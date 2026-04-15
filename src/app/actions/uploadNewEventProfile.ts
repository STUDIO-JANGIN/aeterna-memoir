"use server"

import { Buffer } from "node:buffer"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type UploadNewEventProfileResult =
  | { ok: true }
  | { ok: false; error: string }

function safeImageFileStem(raw: string): string {
  const base = raw.replace(/[/\\]/g, "").replace(/[^\w.\-()+ ]/g, "").trim() || "profile"
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
 * Upload profile image for a newly created event (by slug). Called from create page after event creation.
 * Uses Buffer + explicit content-type so uploads work when FormData yields a Blob (not a live File) on the server.
 * Optional column `profile_image_position` — apply `supabase-sync-events-optional-columns.sql` or `supabase-add-profile-image-position.sql` if missing.
 */
export async function uploadNewEventProfileAction(
  slug: string,
  formData: FormData
): Promise<UploadNewEventProfileResult> {
  const supabase = getSupabaseAdmin()
  const raw = formData.get("profile_image")
  if (raw == null) return { ok: true }
  if (typeof raw === "string") return { ok: true }
  if (!(raw instanceof Blob)) {
    console.error("[uploadNewEventProfile] unexpected profile_image type", typeof raw)
    return { ok: false, error: "Could not read the profile photo. Please try another image or add it later from memorial settings." }
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
      : "profile"
  const path = `profiles/${eventRow.id}/${Date.now()}_${stem}.${ext}`

  const { error: upErr } = await supabase.storage.from("photos").upload(path, buffer, {
    upsert: true,
    contentType: mime,
  })
  if (upErr) {
    console.error("[uploadNewEventProfile]", upErr)
    return { ok: false, error: upErr.message }
  }

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
  const profile_image = urlData.publicUrl

  const posRaw = formData.get("profile_image_position")
  let profile_image_position: string | null = null
  if (typeof posRaw === "string") {
    const t = posRaw.trim()
    const m = /^(\d{1,3}),(\d{1,3})$/.exec(t)
    if (m) {
      const x = Math.min(100, Math.max(0, Number(m[1])))
      const y = Math.min(100, Math.max(0, Number(m[2])))
      if (Number.isFinite(x) && Number.isFinite(y)) {
        profile_image_position = `${Math.round(x)},${Math.round(y)}`
      }
    }
  }

  const payload: { profile_image: string; profile_image_position?: string } = { profile_image }
  if (profile_image_position) payload.profile_image_position = profile_image_position

  let { error: updateErr } = await supabase.from("events").update(payload).eq("id", eventRow.id)

  if (updateErr && profile_image_position && isMissingProfileImagePositionError(updateErr.message)) {
    console.warn(
      "[uploadNewEventProfile] profile_image_position column missing — retrying without it. Apply supabase-add-profile-image-position.sql on Supabase.",
    )
    const retry = await supabase.from("events").update({ profile_image }).eq("id", eventRow.id)
    updateErr = retry.error
  }

  if (updateErr) {
    console.error("[uploadNewEventProfile] update", updateErr)
    return { ok: false, error: updateErr.message }
  }
  return { ok: true }
}

function isMissingProfileImagePositionError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase()
  return (
    m.includes("profile_image_position") &&
    (m.includes("schema cache") || m.includes("could not find") || m.includes("column"))
  )
}
