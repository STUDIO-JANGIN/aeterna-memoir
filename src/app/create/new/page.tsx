"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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
        setFormError("Please enter your loved one’s name.")
        setSaving(false)
        return
      }

      if (!ceremony_month || !ceremony_date || !ceremony_time_slot) {
        setFormError("Please choose the service month, date, and time.")
        setSaving(false)
        return
      }

      const yearForCeremony = Number(death_year) || new Date().getFullYear()
      const monthIndex = MONTH_NAME_TO_INDEX[ceremony_month] ?? 0
      const parsedCeremony = new Date(yearForCeremony, monthIndex, Number(ceremony_date) || 1)
      const weekdayLabel = parsedCeremony.toLocaleDateString(undefined, { weekday: "long" })

      let ceremony_time = `${ceremony_month} ${ceremony_date} ${ceremony_time_slot}`
      if (weekdayLabel) {
        ceremony_time = `${weekdayLabel} ${ceremony_month} ${ceremony_date} ${ceremony_time_slot}`
      }

              const location = rawLocation.trim()
      const flower_link = rawContribution.trim()
        ? rawContribution.trim()
        : location
          ? `https://www.google.com/maps/search/?api=1&query=florist+near+${encodeURIComponent(location)}`
          : ""

      const { data: inserted, error: insertError } = await supabase
        .from("events")
        .insert([
          {
            name: name.trim(),
            creator_email: userEmail,
            birth_date: birth_year || null,
            death_date: death_year || null,
            location,
            ceremony_time,
            music_url: music_url || null,
            flower_link,
            participant_limit: 10,
            photo_limit_per_user: 5,
            media_tier: "free",
          },
        ])
        .select()
        .single()

      if (insertError || !inserted) {
        setFormError("There was a problem creating this memorial. Please try again.")
        return
      }

      const eventId = inserted.id as string

      if (profileImageFile && profileImageFile.size > 0) {
        const filePath = `profiles/${eventId}/${Date.now()}_${profileImageFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, profileImageFile)

        if (!uploadError && uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("photos").getPublicUrl(filePath)
          await supabase
            .from("events")
            .update({ profile_image: publicUrl })
            .eq("id", eventId)
        }
      }

      router.push(`/admin/${eventId}`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating memorial with details", error)
      setFormError("There was a problem creating this memorial. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex items-center justify-center px-6">
        <p className="font-serif text-[11px] uppercase tracking-[0.3em] text-[var(--aeterna-gold-muted)]">
          Preparing your memorial…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center px-6 py-12 text-white font-serif">
      <div className="w-full max-w-3xl rounded-[28px] border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)]/95 shadow-[var(--shadow-deep)] px-6 py-8 md:px-10 md:py-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--aeterna-gold-muted)] mb-2">
          Create new memorial
        </p>
        <h1 className="text-2xl md:text-3xl mb-3 font-light">
          Tell us a few details about your loved one
        </h1>
        <p className="text-sm text-[var(--aeterna-gold-muted)] mb-6">
          This helps us set up the memorial and service information. You can always change these details later
          from the family dashboard.
        </p>

        {formError && (
          <p className="mb-4 text-sm text-white/90 bg-[var(--aeterna-gold-pale)] border border-[var(--border-gold)] rounded-xl px-4 py-3">
            {formError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                Name
              </label>
              <input
                name="name"
                required
                placeholder="Full name of your loved one"
                className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors text-[var(--aeterna-body)]"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                  Date of birth
                </label>
                <input
                  type="date"
                  name="birth_date"
                  className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-2 text-[var(--aeterna-body)] focus:outline-none focus:border-[var(--aeterna-gold)]"
                />
                <p className="mt-1 text-[10px] font-sans text-[var(--aeterna-gold-muted)]">
                  Format: mm/dd/yyyy
                </p>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                  Date of passing
                </label>
                <input
                  type="date"
                  name="death_date"
                  className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-2 text-[var(--aeterna-body)] focus:outline-none focus:border-[var(--aeterna-gold)]"
                />
                <p className="mt-1 text-[10px] font-sans text-[var(--aeterna-gold-muted)]">
                  Format: mm/dd/yyyy
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                Profile image (optional)
              </label>
              <label className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded-full border border-[var(--aeterna-gold)]/60 text-[var(--aeterna-gold)] text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-charcoal)] transition-colors">
                <span>Upload photo</span>
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
              <p className="mt-1 text-[11px] text-[var(--aeterna-gold-muted)]">
                Optional. This appears on the memorial and presentation.
              </p>
              {profileImageSelected && (
                <p className="mt-1 text-[11px] text-[var(--aeterna-gold)]">
                  Selected: <span className="font-semibold">{profileImageSelected}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                Service location
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
                    setLocationError("Suggestions unavailable - please enter manually")
                  } else {
                    setLocationSuggestions(matches)
                  }
                }}
                placeholder="Venue, chapel or service location"
                className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors mb-2 text-[var(--aeterna-body)]"
              />
              {locationLoading && (
                <p className="mt-1 text-[10px] font-sans text-[var(--aeterna-gold-muted)]">
                  Searching nearby places…
                </p>
              )}
              {locationSuggestions.length > 0 && (
                <div className="mt-2 rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/95 shadow-[var(--shadow-deep)] max-h-48 overflow-auto text-left">
                  {locationSuggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => {
                        setLocationQuery(s.description)
                        setLocationSuggestions([])
                      }}
                      className="w-full px-4 py-2 text-xs font-sans text-[var(--aeterna-body)] hover:bg-[var(--aeterna-charcoal-soft)] cursor-pointer text-left"
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
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                Service time
              </label>
              <div className="flex gap-3">
                <select
                  name="ceremony_month"
                  className="flex-1 border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] text-xs transition-colors text-[var(--aeterna-body)]"
                  defaultValue=""
                >
                  <option value="">Month</option>
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
                  className="flex-1 border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] text-xs transition-colors text-[var(--aeterna-body)]"
                  defaultValue=""
                >
                  <option value="">Date</option>
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
                  className="flex-1 border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] text-xs transition-colors text-[var(--aeterna-body)]"
                  defaultValue=""
                >
                  <option value="">Select time</option>
                  {CEREMONY_TIMES.map((time) =>
                    time ? (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ) : null,
                  )}
                </select>
              </div>
              <p className="mt-2 text-[11px] text-[var(--aeterna-gold-muted)] font-sans">
                Guests will see this exactly as written on the memorial page.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                Contribution link (optional)
              </label>
              <input
                type="url"
                name="contribution_link"
                placeholder="e.g. GoFundMe, PayPal, or bank transfer page"
                className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors text-[var(--aeterna-body)]"
              />
              <p className="mt-2 text-[11px] text-[var(--aeterna-gold-muted)] font-sans">
                Optional. Paste any fundraising page; it will appear as &quot;Support the Family&quot; on the memorial.
              </p>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-1">
                Background music (optional)
              </label>
              <input
                name="music_url"
                placeholder="Paste a YouTube link or audio URL"
                className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-2 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors text-[var(--aeterna-body)]"
              />
              <p className="mt-2 text-[11px] text-[var(--aeterna-gold-muted)] font-sans">
                Optional. Many families simply paste a single YouTube link to a favourite song or recording.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[11px] text-[var(--aeterna-gold-muted)] font-sans max-w-md">
              After you create this memorial, we&apos;ll open the family dashboard where you can review tributes and share the link with guests.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-8 py-3 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-xs uppercase tracking-[0.2em] hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Creating…" : "Create memorial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

