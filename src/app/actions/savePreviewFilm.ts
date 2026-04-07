"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"

export type SavePreviewFilmResult =
  | { ok: true; previewFilmUrl: string }
  | { ok: false; error: string }

/**
 * Upload preview video blob and set events.preview_film_url.
 * Called from admin after client-side preview generation.
 */
export async function savePreviewFilmAction(
  slug: string,
  formData: FormData
): Promise<SavePreviewFilmResult> {
  const supabase = getSupabaseAdmin()
  const file = formData.get("file") as File | null
  if (!file || !file.size) {
    return { ok: false, error: "No file provided." }
  }

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single()

  if (eventErr || !event) {
    return { ok: false, error: "Event not found." }
  }

  const path = `previews/${event.id}/${Date.now()}.webm`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await supabase.storage
    .from("photos")
    .upload(path, buf, { cacheControl: "3600", upsert: true, contentType: "video/webm" })

  if (uploadErr) {
    console.error("[savePreviewFilm] upload error", uploadErr)
    return { ok: false, error: uploadErr.message }
  }

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
  const previewFilmUrl = urlData.publicUrl

  const { error: updateErr } = await supabase
    .from("events")
    .update({ preview_film_url: previewFilmUrl })
    .eq("id", event.id)

  if (updateErr) {
    console.error("[savePreviewFilm] update error", updateErr)
    return { ok: false, error: updateErr.message }
  }

  revalidatePath(`/p/${slug}/admin`)
  return { ok: true, previewFilmUrl }
}
