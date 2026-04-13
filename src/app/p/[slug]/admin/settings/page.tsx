"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { getEventBySlugAction, type AdminEvent } from "@/app/actions/setStorySelected"
import { updateEventBySlugAction } from "@/app/actions/updateEventBySlug"
import { generateInvitePdfAction } from "@/app/actions/generateInvitePdf"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { resolveInvitePdfUrl } from "@/lib/resolveInvitePdfUrl"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default function AdminSettingsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : ""
  const router = useRouter()
  const { app: tx, locale } = useLandingLocale()
  const ap = tx.adminProfilePage

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [invitationBio, setInvitationBio] = useState("")
  const [invitationContactPhone, setInvitationContactPhone] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError(tx.adminProfilePage.invalidSlug)
      setLoading(false)
      return
    }
    let cancelled = false
    getEventBySlugAction(slug).then((e) => {
      if (!cancelled) {
        setEvent(e ?? null)
        if (!e) setError(tx.adminProfilePage.eventNotFound)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug, tx])

  useEffect(() => {
    if (event) {
      setInvitationBio(event.invitation_bio ?? "")
      setInvitationContactPhone(event.invitation_contact_phone ?? "")
    }
  }, [event])

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!event || !slug) return
    setSavingProfile(true)
    setProfileError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const name = (formData.get("name") as string)?.trim() ?? event.name ?? ""
    const birth_date = (formData.get("birth_date") as string)?.trim() ?? ""
    const death_date = (formData.get("death_date") as string)?.trim() ?? ""
    const location = (formData.get("location") as string)?.trim() ?? ""
    const ceremony_time = (formData.get("ceremony_time") as string)?.trim() ?? ""
    const bank_info = (formData.get("bank_info") as string)?.trim() || null
    const invitation_bio_raw = invitationBio.trim()
    const invitation_bio = invitation_bio_raw ? invitation_bio_raw.slice(0, 2000) : null
    const invitation_contact_phone_raw = (formData.get("invitation_contact_phone") as string)?.trim() ?? ""
    const invitation_contact_phone = invitation_contact_phone_raw
      ? invitation_contact_phone_raw.slice(0, 40)
      : null
    const file = formData.get("profile_image") as File | null
    let profile_image: string | null = event.profile_image ?? null
    if (file && file.size > 0) {
      const path = `profiles/${event.id}/${Date.now()}_${file.name}`
      const { data: up, error: upErr } = await supabase.storage.from("photos").upload(path, file)
      if (!upErr && up) {
        const { data: url } = supabase.storage.from("photos").getPublicUrl(path)
        profile_image = url.publicUrl
      }
    }
    const result = await updateEventBySlugAction(slug, {
      name,
      birth_date: birth_date || undefined,
      death_date: death_date || undefined,
      location: location || undefined,
      ceremony_time: ceremony_time || undefined,
      bank_info,
      profile_image,
      invitation_bio,
      invitation_contact_phone,
    })
    setSavingProfile(false)
    if (result.ok) {
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              name,
              birth_date: birth_date || null,
              death_date: death_date || null,
              location: location || null,
              ceremony_time: ceremony_time || null,
              bank_info,
              profile_image,
              invitation_bio,
              invitation_contact_phone,
            }
          : null
      )
      router.refresh()
    } else {
      setProfileError(result.error ?? ap.saveFailed)
    }
  }

  const handleGenerateInvite = async () => {
    if (!slug) return
    setInviteLoading(true)
    setInviteError(null)
    try {
      const result = await generateInvitePdfAction(slug)
      if (result.ok) {
        const openUrl = result.urls?.[locale] ?? result.url
        if (typeof window !== "undefined") {
          window.open(openUrl, "_blank")
        }
      } else {
        setInviteError(result.error)
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : ap.generatePdfFailed)
    } finally {
      setInviteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-landing text-landing-label">
        {ap.loading}
      </div>
    )
  }

  const invitePdfHref = event
    ? resolveInvitePdfUrl(event.invite_pdf_urls ?? null, event.invite_pdf_url ?? null, locale)
    : null

  if (!event || error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-landing font-sans px-6 text-center text-white">
        <p className="text-[var(--aeterna-gold-muted)] mb-4">{error ?? ap.memorialNotFound}</p>
        <Link
          href={slug ? `/p/${slug}/admin` : "/"}
          className="inline-flex items-center gap-2 text-sm text-[var(--aeterna-gold)] hover:underline"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {ap.backToAdmin}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-landing text-white font-sans">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-landing/95 backdrop-blur">
        <div className="relative max-w-2xl mx-auto px-4 py-4 flex items-center justify-center min-h-[3.25rem]">
          <Link
            href={`/p/${slug}/admin`}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {ap.backToAdmin}
          </Link>
          <h1 className="text-lg font-medium text-[var(--aeterna-headline)] tracking-[0.02em] text-center px-12">
            {ap.pageTitle}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        <section aria-labelledby="profile-form-heading">
          <h2
            id="profile-form-heading"
            className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-6"
          >
            {ap.editProfileSection}
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/[0.1] bg-[#030303]/50 flex items-center justify-center shrink-0">
                {event.profile_image ? (
                  <img src={event.profile_image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-serif text-[var(--landing-text-muted)]">
                    {(event.name ?? "?").trim().charAt(0) || "?"}
                  </span>
                )}
              </div>
              <input
                id="profile_image"
                name="profile_image"
                type="file"
                accept="image/*"
                className="w-full max-w-sm text-sm text-[var(--aeterna-body)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--aeterna-gold-pale)] file:text-[var(--aeterna-charcoal)]"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
              >
                {ap.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={event.name ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder={ap.namePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="birth_date"
                  className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
                >
                  {ap.birthDateLabel}
                </label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="text"
                  defaultValue={event.birth_date ?? ""}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                  placeholder={ap.birthDatePlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="death_date"
                  className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
                >
                  {ap.dateOfPassingLabel}
                </label>
                <input
                  id="death_date"
                  name="death_date"
                  type="text"
                  defaultValue={event.death_date ?? ""}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                  placeholder={ap.dateOfPassingPlaceholder}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
              >
                {ap.locationLabel}
              </label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue={event.location ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder={ap.locationPlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="ceremony_time"
                className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
              >
                {ap.ceremonyTimeLabel}
              </label>
              <input
                id="ceremony_time"
                name="ceremony_time"
                type="text"
                defaultValue={event.ceremony_time ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder={ap.ceremonyTimePlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="invitation_contact_phone"
                className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
              >
                {ap.invitationContactPhoneLabel}
              </label>
              <input
                id="invitation_contact_phone"
                name="invitation_contact_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={invitationContactPhone}
                onChange={(e) => setInvitationContactPhone(e.target.value)}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder={ap.invitationContactPhonePlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="invitation_bio"
                className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
              >
                {ap.remembranceMessageLabel}
              </label>
              <textarea
                id="invitation_bio"
                name="invitation_bio"
                rows={5}
                value={invitationBio}
                onChange={(e) => setInvitationBio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)] resize-y min-h-[120px]"
                placeholder={ap.remembrancePlaceholder}
              />
              <p className="mt-1.5 text-[11px] text-[var(--aeterna-gold-muted)]">
                {ap.remembranceHint}
              </p>
            </div>
            <div>
              <label
                htmlFor="bank_info"
                className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5"
              >
                {ap.condolenceAccountLabel}
              </label>
              <textarea
                id="bank_info"
                name="bank_info"
                rows={2}
                defaultValue={event.bank_info ?? ""}
                className="w-full max-w-lg px-3 py-2 text-sm rounded-xl bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-hero)] placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)] resize-y min-h-[4.5rem] max-h-32"
                placeholder={ap.condolencePlaceholder}
              />
            </div>
            {profileError && (
              <p className="text-sm text-red-400" role="alert">
                {profileError}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="min-h-[48px] flex-1 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm tracking-[0.04em] hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors sm:max-w-[14rem]"
              >
                {savingProfile ? ap.saving : ap.saveProfile}
              </button>
              <button
                type="button"
                onClick={() => void handleGenerateInvite()}
                disabled={inviteLoading}
                className="min-h-[48px] flex-1 rounded-xl border border-[var(--aeterna-gold)]/40 bg-transparent text-[var(--aeterna-gold)] font-medium text-sm tracking-[0.04em] hover:bg-[var(--aeterna-gold)]/10 disabled:opacity-60 transition-colors sm:max-w-[14rem]"
              >
                {inviteLoading ? ap.generating : ap.generateQrInvitation}
              </button>
            </div>
            {inviteError && (
              <p className="text-sm text-red-400 text-right" role="alert">
                {inviteError}
              </p>
            )}
            {invitePdfHref ? (
              <p className="text-right">
                <a
                  href={invitePdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] underline-offset-2 hover:underline"
                >
                  {ap.openInvitationWithLocale(locale.toUpperCase())}
                </a>
              </p>
            ) : null}
          </form>
        </section>
      </main>
    </div>
  )
}
