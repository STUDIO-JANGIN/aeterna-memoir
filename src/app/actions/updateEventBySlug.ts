"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

export type UpdateEventBySlugInput = {
  name?: string
  birth_date?: string
  death_date?: string
  location?: string
  ceremony_time?: string
  flower_link?: string | null
  profile_image?: string | null
  music_url?: string | null
  bank_info?: string | null
}

export type UpdateEventBySlugResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateEventBySlugAction(
  slug: string,
  input: UpdateEventBySlugInput
): Promise<UpdateEventBySlugResult> {
  const { data: event, error: fetchErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single()

  if (fetchErr || !event) {
    return { ok: false, error: "Event not found." }
  }

  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.birth_date !== undefined) updates.birth_date = input.birth_date
  if (input.death_date !== undefined) updates.death_date = input.death_date
  if (input.location !== undefined) updates.location = input.location
  if (input.ceremony_time !== undefined) updates.ceremony_time = input.ceremony_time
  if (input.flower_link !== undefined) updates.flower_link = input.flower_link
  if (input.profile_image !== undefined) updates.profile_image = input.profile_image
  if (input.music_url !== undefined) updates.music_url = input.music_url
  if (input.bank_info !== undefined) updates.bank_info = input.bank_info

  if (Object.keys(updates).length === 0) {
    return { ok: true }
  }

  const { error: updateErr } = await supabase
    .from("events")
    .update(updates)
    .eq("id", event.id)

  if (updateErr) {
    console.error("[updateEventBySlug]", updateErr)
    return { ok: false, error: updateErr.message }
  }
  return { ok: true }
}
