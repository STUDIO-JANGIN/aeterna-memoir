"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type InvitationCardData = {
  name: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
  flower_link: string | null
  bank_info: string | null
  profile_image: string | null
  invitation_bio: string | null
  invitation_contact_phone: string | null
  invite_pdf_url: string | null
  invite_pdf_urls: Record<string, string> | null
}

/**
 * Public memorial fields for the printable 9:16 invitation (service role — no client RLS issues).
 */
export async function getInvitationCardDataAction(slug: string): Promise<InvitationCardData | null> {
  const s = slug?.trim()
  if (!s) return null
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("events")
    .select(
      "name, birth_date, death_date, location, ceremony_time, flower_link, bank_info, profile_image, invitation_bio, invitation_contact_phone, invite_pdf_url, invite_pdf_urls",
    )
    .eq("slug", s)
    .maybeSingle()

  if (error || !data) return null
  return data as InvitationCardData
}
