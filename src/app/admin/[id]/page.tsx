"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const YEARS = Array.from({ length: 130 }, (_, i) => 1900 + i)
  .filter((y) => y <= new Date().getFullYear() + 1)
  .reverse()

const CEREMONY_DAYS = [
  "",
  "Friday",
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
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

const Button = ({
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
}: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`min-h-[44px] px-5 py-3 rounded-full font-serif text-[11px] md:text-xs uppercase tracking-[0.18em] transition-all hover:scale-[1.02] active:scale-95 border border-black/10 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto ${className}`}
  >
    {children}
  </button>
)

type MemoryAction = "approve" | "hide" | "delete"

export default function AdminDashboardPage() {
  const params = useParams()
  const eventId = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [updatingMemory, setUpdatingMemory] = useState<{ id: string; action: MemoryAction } | null>(null)
  const [premiumModalOpen, setPremiumModalOpen] = useState(false)
  const [lifetimeArchiveModalOpen, setLifetimeArchiveModalOpen] = useState(false)

  const fetchData = async (id: string) => {
    if (!id) return
    try {
      setLoading(true)
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single()
      if (eventError || !eventData) {
        setEvent(null)
        setMemories([])
      } else {
        setEvent(eventData)
        const { data: memData } = await supabase
          .from("memories")
          .select("*")
          .eq("event_id", id)
          .order("created_at", { ascending: false })
        setMemories(memData ?? [])
      }
    } catch (err) {
      console.error("Admin fetch error:", err)
      setEvent(null)
      setMemories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(eventId)
  }, [eventId])

  const handleProfileSubmit = async (e: any) => {
    e.preventDefault()
    if (!event) return

    setSavingProfile(true)
    try {
      const formData = new FormData(e.target)
      const name = formData.get("name") as string
      const birth_date = formData.get("birth_date") as string
      const death_date = formData.get("death_date") as string
      const rawLocation = (formData.get("location") as string) || ""
      const ceremony_day = formData.get("ceremony_day") as string
      const ceremony_date = formData.get("ceremony_date") as string
      const ceremony_time_slot = formData.get("ceremony_time_slot") as string
      const music_url = formData.get("music_url") as string
      const file = formData.get("profile_image") as File

      const ceremonyParts = [ceremony_day, ceremony_date, ceremony_time_slot].filter(Boolean)
      let ceremony_time = event.ceremony_time || ""
      if (ceremonyParts.length > 0) {
        ceremony_time = ceremonyParts.join(" ")
      }

      const location = rawLocation.trim() || event.location || ""
      const rawContribution = (formData.get("contribution_link") as string)?.trim() || ""
      const flower_link = rawContribution
        ? rawContribution
        : location
          ? `https://www.google.com/maps/search/?api=1&query=florist+near+${encodeURIComponent(location)}`
          : event.flower_link || ""

      let profile_image = event.profile_image || null

      if (file && file.size > 0) {
        const filePath = `profiles/${event.id}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, file)

        if (!uploadError && uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("photos").getPublicUrl(filePath)
          profile_image = publicUrl
        }
      }

      await supabase
        .from("events")
        .update({
          name,
          birth_date,
          death_date,
          location,
          ceremony_time,
          music_url,
          flower_link,
          profile_image,
        })
        .eq("id", event.id)

      await fetchData(eventId)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleApprove = async (id: string) => {
    setUpdatingMemory({ id, action: "approve" })
    try {
      await supabase.from("memories").update({ is_approved: true }).eq("id", id)
      await fetchData(eventId)
    } finally {
      setUpdatingMemory(null)
    }
  }

  const handleHide = async (id: string) => {
    setUpdatingMemory({ id, action: "hide" })
    try {
      await supabase
        .from("memories")
        .update({ is_approved: false })
        .eq("id", id)
      await fetchData(eventId)
    } finally {
      setUpdatingMemory(null)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this memory?")
    if (!confirmDelete) return

    setUpdatingMemory({ id, action: "delete" })
    try {
      await supabase.from("memories").delete().eq("id", id)
      await fetchData(eventId)
    } finally {
      setUpdatingMemory(null)
    }
  }

  const approvedMemories = memories.filter((m) => m.is_approved)
  const pendingMemories = memories.filter((m) => !m.is_approved)
  const memoriesWithPhoto = memories.filter((m) => m.image)

  const handlePremiumClick = () => setPremiumModalOpen(true)

  const mapsSearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F6F0E8] via-[#F9F6F1] to-[#F3ECE4] font-serif text-sm tracking-[0.2em] uppercase text-gray-400">
        Loading dashboard…
      </div>
    )
  }

  if (!eventId || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#F6F0E8] via-[#F9F6F1] to-[#F3ECE4] font-serif px-6 text-center">
        <p className="text-sm tracking-[0.2em] uppercase text-gray-400 mb-4">Memorial not found</p>
        <p className="text-[#2D2D2D] font-sans text-base max-w-md mb-8">
          This admin link may be incorrect or the memorial may no longer be available.
        </p>
        <Link
          href="/"
          className="min-h-[44px] px-6 py-3 rounded-full bg-[#1A1A1A] text-white font-sans text-sm inline-flex items-center justify-center"
        >
          Return home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F6F0E8] via-[#F9F6F1] to-[#F3ECE4] text-[#2D2D2D] font-serif pb-24">
      <header className="max-w-5xl mx-auto pt-16 pb-10 px-6 flex flex-col gap-8">
        <div className="flex items-start justify-between gap-8">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Family Dashboard</p>
            <h1 className="text-4xl md:text-5xl tracking-tight font-light">
              In Loving Memory of{" "}
              <span className="underline decoration-gray-300 decoration-[6px] underline-offset-[10px]">
                {event?.name || "Your Loved One"}
              </span>
            </h1>
            <p className="mt-4 text-sm text-gray-500 font-sans">
              This is a private space for family. Review memories from guests and update the profile above.
            </p>
          </div>
          <div className="flex flex-col items-end gap-4 w-full md:w-auto">
            {event?.profile_image && (
              <div className="hidden md:block">
                <img
                  src={event.profile_image}
                  alt={`${event?.name || "Profile"} portrait`}
                  className="w-28 h-28 rounded-full object-cover shadow-md border border-gray-200 bg-gray-100"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => (window.location.href = `/archive?eventId=${eventId}`)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[11px] md:text-[10px] font-sans uppercase tracking-[0.22em] shadow-sm hover:bg-black hover:text-white transition-colors min-h-[44px] w-full md:w-auto"
            >
              End Event &amp; Archive
            </button>
          </div>
        </div>
      </header>

      {/* Profile form */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="bg-white/90 rounded-3xl shadow-[0_26px_90px_rgba(0,0,0,0.06)] border border-[#E4D7C7] p-8 md:p-10">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-light">Event &amp; profile details</h2>
              <p className="mt-1 text-xs font-sans text-gray-500">
                Gently update these details. All changes are saved when you press{" "}
                <span className="font-semibold">Save Profile</span>.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Name
                </label>
                <input
                  name="name"
                  defaultValue={event?.name || ""}
                  placeholder="Full name of your loved one"
                  className="w-full border-b border-gray-200 bg-transparent py-2 focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                    Birth Year
                  </label>
                  <select
                    name="birth_date"
                    defaultValue={event?.birth_date || ""}
                    className="w-full border-b border-gray-200 bg-transparent py-2 focus:outline-none"
                  >
                    <option value="">Select year</option>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                    Passing Year
                  </label>
                  <select
                    name="death_date"
                    defaultValue={event?.death_date || ""}
                    className="w-full border-b border-gray-200 bg-transparent py-2 focus:outline-none"
                  >
                    <option value="">Select year</option>
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Profile Image
                </label>
                <input
                  type="file"
                  name="profile_image"
                  accept="image/*"
                  className="w-full text-[11px] text-gray-500"
                />
                {event?.profile_image && (
                  <p className="mt-1 text-[11px] text-gray-400">A profile image is currently set.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  defaultValue={event?.location || ""}
                  placeholder="Venue, chapel or service location"
                  className="w-full border-b border-gray-200 bg-transparent py-2 focus:outline-none mb-2"
                />
                <a
                  href={mapsSearchUrl(event?.location || "funeral home")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-sans text-[#8A6C43] underline underline-offset-4 decoration-[#D0B898]"
                >
                  Open in Google Maps
                </a>
                <p className="mt-2 text-[11px] font-sans text-gray-500">
                  Use Google Maps to search and confirm the exact venue for the service.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Service Time
                </label>
                <div className="flex gap-3">
                  <select
                    name="ceremony_day"
                    className="flex-1 border-b border-gray-200 bg-transparent py-2 focus:outline-none text-xs"
                    defaultValue=""
                  >
                    <option value="">Select day</option>
                    {CEREMONY_DAYS.map((day) =>
                      day ? (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ) : null
                    )}
                  </select>
                  <select
                    name="ceremony_date"
                    className="flex-1 border-b border-gray-200 bg-transparent py-2 focus:outline-none text-xs"
                    defaultValue=""
                  >
                    <option value="">Date</option>
                    {CEREMONY_DATES.map((date) =>
                      date ? (
                        <option key={date} value={date}>
                          {date}
                        </option>
                      ) : null
                    )}
                  </select>
                  <select
                    name="ceremony_time_slot"
                    className="flex-1 border-b border-gray-200 bg-transparent py-2 focus:outline-none text-xs"
                    defaultValue=""
                  >
                    <option value="">Select time</option>
                    {CEREMONY_TIMES.map((time) =>
                      time ? (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>
                <p className="mt-2 text-[11px] text-gray-400 font-sans">
                  The day and time you choose here will appear on the public page.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Contribution link (optional)
                </label>
                <input
                  type="url"
                  name="contribution_link"
                  defaultValue={event?.flower_link || ""}
                  placeholder="e.g. GoFundMe, PayPal, or bank transfer page"
                  className="w-full border-b border-gray-200 bg-transparent py-2 focus:outline-none"
                />
                <p className="mt-2 text-[11px] text-gray-500 font-sans">
                  Paste a link for the memorial fund. It appears as &quot;Support the Family&quot; on the tribute page so guests can contribute. Leave blank if not ready.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Flowers & Gifts
                </label>
                <a
                  href={mapsSearchUrl(`florist near ${event?.location || ""}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-sans text-[#8A6C43] underline underline-offset-4 decoration-[#D0B898]"
                >
                  Open nearby florists in Google Maps
                </a>
                <p className="mt-2 text-[11px] text-gray-500 font-sans">
                  This will search for florists close to the location above so guests can easily
                  arrange delivery.
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-1">
                  Background music (optional)
                </label>
                <input
                  name="music_url"
                  defaultValue={event?.music_url || ""}
                  placeholder="Paste a YouTube link or audio URL"
                  className="w-full border-b border-gray-200 bg-transparent py-2 focus:outline-none"
                />
                <p className="mt-2 text-[11px] text-gray-500 font-sans">
                  This will play softly in the background on the presentation screen. Most families
                  simply paste a YouTube link to a favourite song or recording.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="bg-black text-white px-6" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save Profile"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Event Analytics */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="bg-white/90 rounded-3xl shadow-[0_26px_90px_rgba(0,0,0,0.06)] border border-[#E4D7C7] p-8 md:p-10">
          <div className="mb-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">
              Event Analytics
            </p>
            <h2 className="text-2xl font-light">Hearts gathered in memory</h2>
            <p className="mt-2 text-sm font-sans text-gray-500">
              So many people came together for {event?.name || "your loved one"}. Here's a simple snapshot.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="rounded-2xl bg-[#FBF7F2] border border-[#E4D7C7] p-5 text-center">
              <p className="text-3xl md:text-4xl font-serif font-light text-[#2D2D2D] tabular-nums">
                {memories.length}
              </p>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-gray-500 mt-1">
                Total tributes
              </p>
            </div>
            <div className="rounded-2xl bg-[#FBF7F2] border border-[#E4D7C7] p-5 text-center">
              <p className="text-3xl md:text-4xl font-serif font-light text-[#2D2D2D] tabular-nums">
                {memoriesWithPhoto.length}
              </p>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-gray-500 mt-1">
                Photos shared
              </p>
            </div>
            <div className="rounded-2xl bg-[#F0F7F0] border border-[#C5E0C5] p-5 text-center">
              <p className="text-3xl md:text-4xl font-serif font-light text-[#2D2D2D] tabular-nums">
                {approvedMemories.length}
              </p>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-gray-600 mt-1">
                Live on tribute page
              </p>
            </div>
            <div className="rounded-2xl bg-[#F5F0E8] border border-[#E4D7C7] p-5 text-center">
              <p className="text-3xl md:text-4xl font-serif font-light text-[#2D2D2D] tabular-nums">
                {pendingMemories.length}
              </p>
              <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-gray-500 mt-1">
                Awaiting review
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Memories management */}
      <main className="max-w-5xl mx-auto px-6 space-y-14">
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">
                Pending
              </p>
              <h2 className="text-2xl font-light">Memories awaiting review</h2>
            </div>
            <p className="font-sans text-xs text-gray-500">
              These memories are not yet visible on the public page. After review, choose Approve, Hide, or Delete.
            </p>
          </div>

          {pendingMemories.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-2xl py-10 px-6 text-center font-sans text-sm text-gray-400 bg-white/40">
              There are no pending memories. When a new tribute arrives, it will appear here first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingMemories.map((mem) => {
                const isUpdating = updatingMemory?.id === mem.id
                return (
                  <div
                    key={mem.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                  >
                    {mem.image && (
                      <img
                        src={mem.image}
                        alt=""
                        className="w-full h-40 object-cover grayscale-[0.25]"
                      />
                    )}
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-sans uppercase tracking-[0.25em] text-gray-400">
                          Pending
                        </p>
                        <span className="text-[11px] font-sans text-gray-400">
                          {mem.created_at
                            ? new Date(mem.created_at).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-semibold">{mem.name}</p>
                        <p className="mt-1 text-sm text-gray-600 font-sans whitespace-pre-line">
                          {mem.message}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleApprove(mem.id)}
                          className="bg-black text-white flex-1"
                          disabled={isUpdating}
                        >
                          {isUpdating && updatingMemory?.action === "approve" ? "Approving…" : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleHide(mem.id)}
                          className="bg-white flex-1"
                          disabled={isUpdating}
                        >
                          {isUpdating && updatingMemory?.action === "hide" ? "Hiding…" : "Hide"}
                        </Button>
                        <Button
                          onClick={() => handleDelete(mem.id)}
                          className="bg-red-50 text-red-600 border-red-200 flex-1"
                          disabled={isUpdating}
                        >
                          {isUpdating && updatingMemory?.action === "delete" ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">
                Approved
              </p>
              <h2 className="text-2xl font-light">Memories currently visible</h2>
            </div>
            <p className="font-sans text-xs text-gray-500">
              These memories are currently visible on the public tribute page. You can hide or delete them at any time.
            </p>
          </div>

          {approvedMemories.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-2xl py-10 px-6 text-center font-sans text-sm text-gray-400 bg-white/40">
              No memories have been approved yet. Once a tribute is approved, it will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedMemories.map((mem) => {
                const isUpdating = updatingMemory?.id === mem.id
                return (
                  <div
                    key={mem.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                  >
                    {mem.image && (
                      <img
                        src={mem.image}
                        alt=""
                        className="w-full h-40 object-cover grayscale-[0.25]"
                      />
                    )}
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-sans uppercase tracking-[0.25em] text-emerald-500">
                          Approved
                        </p>
                        <span className="text-[11px] font-sans text-gray-400">
                          {mem.created_at
                            ? new Date(mem.created_at).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-semibold">{mem.name}</p>
                        <p className="mt-1 text-sm text-gray-600 font-sans whitespace-pre-line">
                          {mem.message}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleHide(mem.id)}
                          className="bg-white flex-1"
                          disabled={isUpdating}
                        >
                          {isUpdating && updatingMemory?.action === "hide" ? "Hiding…" : "Hide"}
                        </Button>
                        <Button
                          onClick={() => handleDelete(mem.id)}
                          className="bg-red-50 text-red-600 border-red-200 flex-1"
                          disabled={isUpdating}
                        >
                          {isUpdating && updatingMemory?.action === "delete" ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Premium Features */}
        <section>
          <div className="mb-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-1">
              Premium
            </p>
            <h2 className="text-2xl font-light">Premium Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={handlePremiumClick}
              className="flex items-center gap-4 p-6 rounded-2xl bg-white/90 border border-[#E4D7C7] shadow-sm text-left hover:border-[#D0B898] hover:shadow-md transition-all min-h-[44px] w-full"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5F0E8] border border-[#E4D7C7] flex items-center justify-center font-sans text-xs text-gray-500">
                📖
              </span>
              <div>
                <p className="font-semibold text-[#2D2D2D]">Download High-Res Tribute Book</p>
                <p className="font-sans text-xs text-gray-500 mt-0.5">
                  Print-ready PDF of all tributes
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={handlePremiumClick}
              className="flex items-center gap-4 p-6 rounded-2xl bg-white/90 border border-[#E4D7C7] shadow-sm text-left hover:border-[#D0B898] hover:shadow-md transition-all min-h-[44px] w-full"
            >
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#F5F0E8] border border-[#E4D7C7] flex items-center justify-center font-sans text-xs text-gray-500">
                ☁️
              </span>
              <div>
                <p className="font-semibold text-[#2D2D2D]">Lifetime Cloud Storage</p>
                <p className="font-sans text-xs text-gray-500 mt-0.5">
                  Keep photos and messages forever
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Event Status */}
        <section className="mb-8">
          <div className="bg-white/90 rounded-3xl shadow-[0_26px_90px_rgba(0,0,0,0.06)] border border-[#E4D7C7] p-8 md:p-10">
            <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3">
              Event Status
            </p>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="font-sans text-sm text-[#2D2D2D]">
                  Your memorial is currently in <strong>LIVE</strong> mode (Free for 7 days).
                </p>
                <button
                  type="button"
                  onClick={() => setLifetimeArchiveModalOpen(true)}
                  className="flex-shrink-0 min-h-[44px] px-6 py-3 rounded-full bg-[#1A1A1A] text-white font-sans text-xs uppercase tracking-[0.18em] hover:bg-[#2D2D2D] transition-colors w-full sm:w-auto"
                >
                  Upgrade to Lifetime Archive
                </button>
              </div>
              <p className="font-sans text-xs text-gray-500 max-w-2xl">
                Our goal is to host Aeterna memorials for many years. With a Lifetime Archive upgrade, we commit to long‑term storage and will always offer a full export of all photos, videos, and messages if the service ever needs to change.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Lifetime Archive coming soon modal */}
      {lifetimeArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#E4D7C7] text-center">
            <p className="text-lg font-serif text-[#2D2D2D] leading-relaxed">
              Coming Soon: Preserve these precious memories forever with our high-quality digital keepsake.
            </p>
            <button
              type="button"
              onClick={() => setLifetimeArchiveModalOpen(false)}
              className="mt-6 min-h-[44px] px-6 py-3 rounded-full bg-[#1A1A1A] text-white font-sans text-sm w-full sm:w-auto hover:bg-[#2D2D2D] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Premium feature modal */}
      {premiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#E4D7C7] text-center">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-gray-400 mb-4">
              Premium
            </p>
            <p className="text-xl font-serif text-[#2D2D2D] mb-2">
              This is a premium feature.
            </p>
            <p className="font-sans text-sm text-gray-600 mb-6">
              Unlock high-resolution downloads and lifetime cloud storage with a one-time upgrade. Your tributes deserve to be kept safe and beautiful.
            </p>
            <button
              type="button"
              onClick={() => setPremiumModalOpen(false)}
              className="min-h-[44px] px-6 py-3 rounded-full bg-[#1A1A1A] text-white font-sans text-sm w-full sm:w-auto"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={() => setPremiumModalOpen(false)}
              className="mt-3 min-h-[44px] px-6 py-3 rounded-full border border-[#1A1A1A] text-[#1A1A1A] font-sans text-sm w-full sm:w-auto hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Upgrade to unlock
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
