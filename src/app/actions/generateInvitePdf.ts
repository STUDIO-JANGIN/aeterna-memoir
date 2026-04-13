"use server"

import { getAppBaseUrl } from "@/lib/appUrl"
import { renderInvitePdfBytes } from "@/lib/invitePdfLayout"
import type { InvitePdfUrlsMap } from "@/lib/resolveInvitePdfUrl"
import { getEventBySlug } from "@/app/actions/setStorySelected"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { type LandingLocale, LANDING_LOCALES } from "@/lib/landingTranslations"

export type GenerateInvitePdfOptions = {
  locale?: LandingLocale
  allLocales?: boolean
}

export type GenerateInvitePdfResult =
  | { ok: true; url: string; urls?: InvitePdfUrlsMap }
  | { ok: false; error: string }

export async function generateInvitePdfAction(
  slug: string,
  options?: GenerateInvitePdfOptions
): Promise<GenerateInvitePdfResult> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) return { ok: false, error: "Invalid slug." }

  const allLocales = options?.allLocales !== false
  const locales: LandingLocale[] = allLocales
    ? LANDING_LOCALES.map((l) => l.code)
    : [options?.locale ?? "en"]

  const event = await getEventBySlug(slugNorm)
  if (!event?.id) {
    return { ok: false, error: "Event not found." }
  }

  const origin = getAppBaseUrl()
  const slugForGuestUrl = (event.slug ?? slugNorm).trim()
  const guestUrl = `${origin}/p/${encodeURIComponent(slugForGuestUrl)}`

  const existingUrls =
    (event.invite_pdf_urls as InvitePdfUrlsMap | null | undefined) ?? {}

  const newUrls: InvitePdfUrlsMap = { ...existingUrls }

  try {
    for (const locale of locales) {
      const pdfBytes = await renderInvitePdfBytes({
        guestUrl,
        name: (event.name as string | null) ?? null,
        birthDate: (event.birth_date as string | null) ?? null,
        deathDate: (event.death_date as string | null) ?? null,
        location: (event.location as string | null) ?? null,
        ceremonyTime: (event.ceremony_time as string | null) ?? null,
        invitationBio: (event.invitation_bio as string | null) ?? null,
        invitationContactPhone: event.invitation_contact_phone ?? null,
        bankInfo: (event.bank_info as string | null) ?? null,
        profileImageUrl: (event.profile_image as string | null) ?? null,
        locale,
      })

      const path = `invites/${event.id}/invite_${locale}.pdf`
      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(path, Buffer.from(pdfBytes), {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadErr) {
        console.error("[generateInvitePdf] upload error", uploadErr)
        return { ok: false, error: "Failed to upload PDF." }
      }

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
      const pdfUrl = urlData?.publicUrl
      if (!pdfUrl) {
        return { ok: false, error: "Failed to get public URL for PDF." }
      }
      newUrls[locale] = pdfUrl
    }

    const primaryUrl = newUrls.en ?? newUrls[locales[0]] ?? Object.values(newUrls)[0] ?? ""

    await supabase
      .from("events")
      .update({
        invite_pdf_urls: newUrls as Record<string, string>,
        invite_pdf_url: primaryUrl,
      })
      .eq("id", event.id)

    return { ok: true, url: primaryUrl, urls: newUrls }
  } catch (err) {
    console.error("[generateInvitePdf]", err)
    return { ok: false, error: err instanceof Error ? err.message : "Failed to generate PDF." }
  }
}
