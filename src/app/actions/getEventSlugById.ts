"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

/** Resolves a memorial UUID to its public slug (service role — works for redirect pages). */
export async function getEventSlugByIdAction(eventId: string): Promise<string | null> {
  const id = eventId?.trim()
  if (!id) return null
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.from("events").select("slug").eq("id", id).maybeSingle()
  if (error || !data?.slug) return null
  return data.slug
}
