"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { createEventAction } from "@/app/actions/createEvent"
import { uploadNewEventProfileAction } from "@/app/actions/uploadNewEventProfile"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"

const CEREMONY_MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const CEREMONY_DATES = ["", ...Array.from({ length: 31 }, (_, i) => String(i + 1))]

const CEREMONY_TIMES = [
  "",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
]

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
}

const MOCK_LOCATIONS = [
  "123 Memorial Drive, Sydney NSW, Australia",
  "Grace Chapel, 4500 Little Rock, AR, USA",
  "The Grand Hall, 77 Sunset Blvd, Los Angeles, CA",
  "Spring Gardens, 10-12 Victoria St, London, UK",
]

export default function NewMemorialPage() {
  const { app: t } = useLandingLocale()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [locationQuery, setLocationQuery] = useState<string>("")
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{ description: string; place_id: string }>>([])
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImageSelected, setProfileImageSelected] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? null
      if (!email) {
        router.replace("/create")
        return
      }
      setUserEmail(email)
      setLoading(false)
    })
  }, [router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userEmail) return

    setFormError(null)
    setSaving(true)

             try {
      const formData = new FormData(e.currentTarget)
      const name = (formData.get("name") as string | null) || ""
      const birth_year = (formData.get("birth_date") as string | null) || ""
      const death_year = (formData.get("death_date") as string | null) || ""
              const rawLocation = (formData.get("location") as string | null) || ""
      const ceremony_month = (formData.get("ceremony_month") as string | null) || ""
      const ceremony_date = (formData.get("ceremony_date") as string | null) || ""
      const ceremony_time_slot = (formData.get("ceremony_time_slot") as string | null) || ""
      const music_url = (formData.get("music_url") as string | null) || ""
      const rawContribution = (formData.get("contribution_link") as string | null) || ""

      if (!name.trim()) {
        setFormError(t.createNew.errName)
        setSaving(false)
        return
      }

      if (!ceremony_month || !ceremony_date || !ceremony_time_slot) {
        setFormError(t.createNew.errCeremony)
        setSaving(false)
        return
      }

      const yearForCeremony = Number(death_year) || new Date().getFullYear()
      const monthIndex = MONTH_NAME_TO_INDEX[ceremony_month] ?? 0
      const parsedCeremony = new Date(yearForCeremony, monthIndex, Number(ceremony_date) || 1)
      const weekdayLabel = parsedCeremony.toLocaleDateString("en-US", { weekday: "long" })

      let ceremony_time = `${ceremony_month} ${ceremony_date} ${ceremony_time_slot}`
      if (weekdayLabel) {
        ceremony_time = `${weekdayLabel} ${ceremony_month} ${ceremony_date} ${ceremony_time_slot}`
      }

      const location = rawLocation.trim()
      const contributionTrim = rawContribution.trim()
      const fundLinkForCreate =
        contributionTrim ||
        (location
          ? `https://www.google.com/maps/search/?api=1&query=florist+near+${encodeURIComponent(location)}`
          : "")
      const hasFund = !!(contributionTrim || location.trim())

      const created = await createEventAction({
        name: name.trim(),
        birth_date: birth_year || "—",
        death_date: death_year || "—",
        location,
        ceremony_time,
        has_fund: hasFund,
        fund_link: fundLinkForCreate || undefined,
        music_url: music_url || null,
      })

      if (!created.ok) {
        setFormError(created.error || t.createNew.errCreate)
        return
      }

      const { slug } = created

      if (profileImageFile && profileImageFile.size > 0) {
        const fd = new FormData()
        fd.append("profile_image", profileImageFile)
        const up = await uploadNewEventProfileAction(slug, fd)
        if (!up.ok) {
          // eslint-disable-next-line no-console
          console.warn("[create/new] profile upload failed", up.error)
        }
      }

      router.push(`/p/${encodeURIComponent(slug)}/admin`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating memorial with details", error)
      setFormError(t.createNew.errCreate)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-dvh bg-landing flex items-center justify-center px-6">
        <p className="text-landing-label">{t.createNew.preparing}</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh bg-landing flex flex-col items-center justify-center px-6 py-12 md:py-16 text-[var(--landing-text-hero)]">
      <div className="w-full max-w-3xl card-landing-airy px-6 py-8 md:px-10 md:py-12">
        <p className="text-landing-label mb-3">{t.createNew.kicker}</p>
        <h1 className="text-landing-section-title mb-4">{t.createNew.title}</h1>
        <p className="text-landing-body mb-8">{t.createNew.body}</p>

        {formError && (
          <p className="mb-4 text-sm text-[var(--landing-text-hero)] bg-[var(--aeterna-gold-pale)] border border-white/[0.12] rounded-xl px-4 py-3">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                {t.createNew.labelName}
              </label>
              <input
                name="name"
                required
                placeholder={t.createNew.phName}
                className="w-full border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors text-[var(--landing-text-body)]"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                  {t.createNew.labelBirth}
                </label>
                <input
                  type="date"
                  name="birth_date"
                  className="w-full border-b border-white/[0.08] bg-transparent py-2 text-[var(--landing-text-body)] focus:outline-none focus:border-[var(--aeterna-gold)]"
                />
                <p className="mt-1 text-[10px] font-sans text-[var(--landing-text-muted)]">
                  {t.createNew.dateFormatHint}
                </p>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                  {t.createNew.labelDeath}
                </label>
                <input
                  type="date"
                  name="death_date"
                  className="w-full border-b border-white/[0.08] bg-transparent py-2 text-[var(--landing-text-body)] focus:outline-none focus:border-[var(--aeterna-gold)]"
                />
                <p className="mt-1 text-[10px] font-sans text-[var(--landing-text-muted)]">
                  {t.createNew.dateFormatHint}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                {t.createNew.labelPortrait}
              </label>
              <label className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-full border border-[var(--aeterna-gold)]/60 text-[var(--aeterna-gold)] text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-charcoal)] transition-colors">
                <span>{t.createNew.addSpark}</span>
                <input
                  type="file"
                  name="profile_image"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setProfileImageFile(file)
                    setProfileImageSelected(file ? file.name : null)
                  }}
                />
              </label>
              <p className="mt-1 text-[11px] text-[var(--landing-text-muted)] leading-relaxed">
                {t.createNew.portraitHint}
              </p>
              {profileImageSelected && (
                <p className="mt-1 text-[11px] text-[var(--aeterna-gold)]">
                  {t.createNew.selectedFile} <span className="font-semibold">{profileImageSelected}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                {t.createNew.labelLocation}
              </label>
              <input
                name="location"
                value={locationQuery}
                onChange={(e) => {
                  const value = e.target.value
                  setLocationQuery(value)
                  setLocationError(null)
                  if (value.trim().length < 3) {
                    setLocationSuggestions([])
                    return
                  }
                  const lower = value.toLowerCase()
                  const mock = [
                    "123 Memorial Park, New York, NY",
                    "Grace Chapel, Sydney",
                    "Evergreen Rest Gardens, Los Angeles, CA",
                    "Harbourview Crematorium, Melbourne",
                  ]
                  const matches = mock
                    .filter((m) => m.toLowerCase().includes(lower))
                    .map((m, idx) => ({ description: m, place_id: `mock-${idx}` }))
                  if (matches.length === 0) {
                    setLocationSuggestions([])
                    setLocationError(t.createNew.locationMockError)
                  } else {
                    setLocationSuggestions(matches)
                  }
                }}
                placeholder={t.createNew.phLocation}
                className="w-full border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors mb-2 text-[var(--landing-text-body)]"
              />
              {locationLoading && (
                <p className="mt-1 text-[10px] font-sans text-[var(--landing-text-muted)]">
                  {t.createNew.searchingPlaces}
                </p>
              )}
              {locationSuggestions.length > 0 && (
                <div className="mt-2 rounded-2xl border border-white/[0.08] bg-[#030303]/40 shadow-[var(--landing-shadow-deep)] max-h-48 overflow-auto text-left backdrop-blur-sm">
                  {locationSuggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => {
                        setLocationQuery(s.description)
                        setLocationSuggestions([])
                      }}
                      className="w-full px-4 py-2 text-xs font-sans text-[var(--landing-text-body)] hover:bg-white/[0.04] cursor-pointer text-left"
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
              {locationError && (
                <p className="mt-1 text-[10px] font-sans text-red-300">
                  {locationError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                Service time
              </label>
              <div className="flex gap-3">
                <select
                  name="ceremony_month"
                  className="flex-1 border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] text-xs transition-colors text-[var(--landing-text-body)]"
                  defaultValue=""
                >
                  <option value="">{t.createNew.month}</option>
                  {CEREMONY_MONTHS.map((month) =>
                    month ? (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ) : null,
                  )}
                </select>
                <select
                  name="ceremony_date"
                  className="flex-1 border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] text-xs transition-colors text-[var(--landing-text-body)]"
                  defaultValue=""
                >
                  <option value="">{t.createNew.date}</option>
                  {CEREMONY_DATES.map((date) =>
                    date ? (
                      <option key={date} value={date}>
                        {date}
                      </option>
                    ) : null,
                  )}
                </select>
                <select
                  name="ceremony_time_slot"
                  className="flex-1 border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] text-xs transition-colors text-[var(--landing-text-body)]"
                  defaultValue=""
                >
                  <option value="">{t.createNew.selectTime}</option>
                  {CEREMONY_TIMES.map((time) =>
                    time ? (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ) : null,
                  )}
                </select>
              </div>
              <p className="mt-2 text-[11px] text-[var(--landing-text-muted)] font-sans">
                {t.createNew.serviceTimeNote}
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                {t.createNew.labelContribution}
              </label>
              <input
                type="url"
                name="contribution_link"
                placeholder={t.createNew.phContribution}
                className="w-full border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors text-[var(--landing-text-body)]"
              />
              <p className="mt-2 text-[11px] text-[var(--landing-text-muted)] font-sans">
                {t.createNew.contributionHint}
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--landing-text-muted)] mb-1">
                {t.createNew.labelMusic}
              </label>
              <input
                name="music_url"
                placeholder={t.createNew.phMusic}
                className="w-full border-b border-white/[0.08] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors text-[var(--landing-text-body)]"
              />
              <p className="mt-2 text-[11px] text-[var(--landing-text-muted)] font-sans">
                {t.createNew.musicHint}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[11px] text-[var(--landing-text-muted)] font-sans max-w-md">
              {t.createNew.footerNote}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="btn-landing-gold min-h-[48px] px-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? t.createNew.submitting : t.createNew.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

