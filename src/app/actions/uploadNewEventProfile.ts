"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

export type UploadNewEventProfileResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Upload profile image for a newly created event (by slug). Called from create page after event creation.
 */
export async function uploadNewEventProfileAction(
  slug: string,
  formData: FormData
): Promise<UploadNewEventProfileResult> {
  const file = formData.get("profile_image") as File | null
  if (!file || file.size === 0) return { ok: true }

  const { data: eventRow, error: fetchErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug.trim())
    .maybeSingle()

  if (fetchErr || !eventRow?.id) {
    return { ok: false, error: "Event not found." }
  }

  const path = `profiles/${eventRow.id}/${Date.now()}_${file.name}`
  const { error: upErr } = await supabase.storage.from("photos").upload(path, file, { upsert: true })
  if (upErr) {
    console.error("[uploadNewEventProfile]", upErr)
    return { ok: false, error: upErr.message }
  }

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
  const profile_image = urlData.publicUrl

  const { error: updateErr } = await supabase
    .from("events")
    .update({ profile_image })
    .eq("id", eventRow.id)

  if (updateErr) {
    console.error("[uploadNewEventProfile] update", updateErr)
    return { ok: false, error: updateErr.message }
  }
  return { ok: true }
}
