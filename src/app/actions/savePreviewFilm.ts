"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

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
