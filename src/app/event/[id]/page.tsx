"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { RevealSection } from "@/components/RevealSection"

const Button = ({ onClick, children, className = "", type = "button" }: any) => (
  <button
    type={type}
    onClick={onClick}
    className={`cursor-pointer min-h-[52px] px-10 py-4 rounded-[24px] font-serif text-sm md:text-base transition-all hover:opacity-95 active:scale-[0.98] w-full sm:w-auto shadow-[var(--shadow-soft)] ${className}`}
  >
    {children}
  </button>
)

export default function EventTributePage() {
  const params = useParams()
  const eventId = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [donationsOpen, setDonationsOpen] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [supportAmount, setSupportAmount] = useState<number | null>(100)
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportError, setSupportError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!eventId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()
      if (eventError) {
        console.error("Event fetch error:", eventError)
        setEvent(null)
      } else {
        setEvent(eventData)
      }

      const { data: memData } = await supabase
        .from("memories")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
      if (memData) setMemories(memData)
    } catch (err) {
      console.error("Data fetch error:", err)
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [eventId])

  const handleOpenDonations = () => setDonationsOpen(true)
  const handleSupportFamily = () => setSupportModalOpen(true)

  const startSupportCheckout = async () => {
    if (!eventId || !supportAmount || supportAmount <= 0) return
    try {
      setSupportLoading(true)
      setSupportError(null)
      const res = await fetch("/api/support-family", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          amount: supportAmount,
          currency: "usd",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Unable to start checkout")
      }
      window.location.href = data.url as string
    } catch (err: any) {
      console.error("Support checkout error:", err)
      setSupportError("We couldn’t open the payment page. Please try again in a moment.")
    } finally {
      setSupportLoading(false)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const name = formData.get("name")
    const message = formData.get("message")
    const file = formData.get("file") as File
    let imageUrl = null
    if (file && file.size > 0) {
      const filePath = `${eventId}/${Date.now()}_${file.name}`
      const { data } = await supabase.storage.from("photos").upload(filePath, file)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from("photos").getPublicUrl(filePath)
        imageUrl = publicUrl
      }
    }
    const { error } = await supabase.from("memories").insert([
      { event_id: eventId, name, message, image: imageUrl, is_approved: false }
    ])
    if (!error) {
      setDialogOpen(false)
      setShowThankYou(true)
      fetchData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--aeterna-charcoal)] font-serif text-xs tracking-[0.35em] uppercase text-[var(--aeterna-gold-muted)]">
        Preparing the memorial…
      </div>
    )
  }

  if (!eventId || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--aeterna-charcoal)] font-serif px-12 text-center text-white">
        <p className="text-sm tracking-[0.28em] uppercase text-[var(--aeterna-gold)] mb-6">
          Memorial not found
        </p>
        <p className="text-[var(--aeterna-gold-muted)] font-serif text-base max-w-md mb-10">
          This link may be incorrect or the memorial may no longer be available.
        </p>
        <a
          href="/"
          className="min-h-[52px] px-10 py-4 rounded-[24px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-serif text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
        >
          Return home
        </a>
      </div>
    )
  }

  // All values from DB – we only render this when event exists
  const displayName = event.name ?? ""
  const displayBirth = event.birth_date ?? "—"
  const displayDeath = event.death_date ?? "—"
  const displayLocation = event.location ?? "—"
  const displayTime = event.ceremony_time ?? "—"

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] text-white font-serif pb-32 overflow-hidden relative">
      <RevealSection className="max-w-5xl mx-auto pt-20 md:pt-28 pb-20 px-12">
        <div className="rounded-[32px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/80 backdrop-blur-xl px-10 md:px-14 py-12 md:py-16 shadow-[var(--shadow-deep)]">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10 md:gap-14">
            {event.profile_image && (
              <div className="flex flex-col items-center md:items-start">
                <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-[28px] overflow-hidden border border-[var(--border-gold-subtle)] shadow-[var(--shadow-deep)] bg-black/40">
                  <img
                    src={event.profile_image}
                    alt={`${displayName || "Loved one"}'s portrait`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-[var(--aeterna-gold)] mb-4">
                A CELEBRATION OF LIFE
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl mb-4 tracking-[0.18em] leading-relaxed font-light text-white">
                {displayName}
              </h1>
              <p className="text-sm md:text-base text-[var(--aeterna-gold-muted)] italic mb-8 tracking-[0.22em] uppercase">
                {displayBirth} — {displayDeath}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 font-serif text-sm">
                <div className="rounded-[24px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-gold-pale)]/30 backdrop-blur-lg px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--aeterna-gold-muted)] mb-2">
                    Location
                  </p>
                  <p className="font-medium text-white/90">
                    {displayLocation}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-gold-pale)]/30 backdrop-blur-lg px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--aeterna-gold-muted)] mb-2">
                    Service Time
                  </p>
                  <p className="font-medium text-white/90">
                    {displayTime}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-gold-pale)]/30 backdrop-blur-lg px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--aeterna-gold-muted)] mb-2">
                    Flowers &amp; Gifts
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenDonations}
                    className="font-serif text-xs tracking-[0.18em] uppercase text-[var(--aeterna-gold)] underline underline-offset-4 decoration-[var(--aeterna-gold)]/60 hover:text-[var(--aeterna-gold-light)] cursor-pointer"
                  >
                    View recommended options
                  </button>
                </div>
              </div>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={handleSupportFamily}
                  className="w-full flex items-center justify-center gap-3 py-4 px-10 rounded-[999px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-xs md:text-sm tracking-[0.24em] uppercase shadow-[var(--shadow-gold)] hover:bg-[var(--aeterna-gold-light)] transition-colors cursor-pointer"
                >
                  <span className="text-base" aria-hidden>♥</span>
                  Support the Family · Memorial Fund
                </button>
                <p className="font-serif text-[11px] text-[var(--aeterna-gold-muted)] mt-3 text-center md:text-left leading-relaxed">
                  In lieu of flowers, you can contribute toward expenses or a cause they cared about.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-4 sm:gap-6 mb-20 px-12">
        <Button
          onClick={() => setDialogOpen(true)}
          className="border border-[var(--aeterna-gold)]/60 bg-transparent text-[var(--aeterna-gold)] sm:px-10 hover:bg-[var(--aeterna-gold-pale)]"
        >
          Share a Memory
        </Button>
        <Button
          onClick={() => (window.location.href = `/present/${eventId}`)}
          className="border border-[var(--aeterna-gold)]/40 bg-transparent text-[var(--aeterna-gold-muted)] sm:px-10 hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)]"
        >
          Launch Screen
        </Button>
      </RevealSection>

      <RevealSection className="max-w-5xl mx-auto px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {memories.filter(m => m.is_approved).map((mem) => (
          <div
            key={mem.id}
            className="group overflow-hidden rounded-[28px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/60 backdrop-blur-lg p-6 shadow-[var(--shadow-deep)]"
          >
            {mem.image && (
              <div className="relative mb-5 overflow-hidden rounded-[24px]">
                <img
                  src={mem.image}
                  className="w-full h-64 object-cover grayscale-[0.12] group-hover:scale-[1.02] transition-transform duration-500"
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
            )}
            <h3 className="text-2xl mb-2 tracking-tight font-serif text-white">
              {mem.name}
            </h3>
            <p className="text-sm text-[var(--aeterna-gold-muted)] italic font-serif leading-relaxed">
              &ldquo;{mem.message}&rdquo;
            </p>
          </div>
        ))}
      </RevealSection>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
          <div className="rounded-[28px] max-w-md w-full p-12 shadow-[var(--shadow-deep)] border border-[var(--border-luxury)] bg-[var(--cream-warm)] text-[var(--charcoal)]">
            <p className="font-serif text-[11px] uppercase tracking-[0.32em] text-[var(--champagne)] mb-2 text-center">Share a Tribute</p>
            <h2 className="text-2xl md:text-3xl mb-10 text-center font-light text-[var(--charcoal)] tracking-tight">Leave a memory</h2>
            <form onSubmit={handleSubmit} className="space-y-8 font-serif text-[var(--charcoal)]">
              <input name="name" required placeholder="Your Name" className="w-full border-b border-[var(--border-luxury)] py-4 focus:outline-none focus:border-[var(--champagne)] bg-transparent font-serif text-[var(--charcoal)] placeholder:text-[var(--charcoal-muted)] transition-colors" />
              <textarea name="message" required placeholder="Your Message" rows={4} className="w-full border-b border-[var(--border-luxury)] py-4 focus:outline-none focus:border-[var(--champagne)] resize-none bg-transparent font-serif text-[var(--charcoal)] placeholder:text-[var(--charcoal-muted)] transition-colors" />
              <input type="file" name="file" accept="image/*" className="w-full text-sm font-serif text-[var(--charcoal-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-[var(--border-luxury)] file:bg-[var(--champagne-pale)] file:font-serif file:text-[var(--charcoal)]" />
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setDialogOpen(false)} className="flex-1 py-4 rounded-[24px] border border-[var(--border-luxury)] text-[var(--charcoal-muted)] font-serif text-sm hover:bg-[var(--champagne-pale)]/60 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-4 rounded-[24px] bg-[var(--charcoal)] text-[var(--cream)] font-serif text-sm shadow-[var(--shadow-button)] hover:opacity-95 transition-all">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--charcoal)]/50 backdrop-blur-md p-8">
          <div className="luxury-card rounded-[28px] max-w-md w-full p-12 shadow-[var(--shadow-deep)] border border-[var(--border-luxury)] text-center">
            <p className="text-xl md:text-2xl font-serif text-[var(--charcoal)] leading-relaxed">Your tribute means a great deal to the family.<br />Thank you.</p>
            <button type="button" onClick={() => { setShowThankYou(false); setSupportModalOpen(true) }} className="mt-8 w-full min-h-[52px] px-8 py-4 rounded-[24px] bg-[var(--charcoal)] text-[var(--cream)] font-serif text-sm tracking-[0.14em] uppercase shadow-[var(--shadow-button)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-2 border-[var(--charcoal)]">Support the Family · Memorial Fund</button>
            <button type="button" onClick={() => setShowThankYou(false)} className="mt-4 w-full sm:w-auto min-h-[52px] px-10 py-4 rounded-[24px] border-2 border-[var(--charcoal)] text-[var(--charcoal)] font-serif text-sm hover:bg-[var(--charcoal)] hover:text-[var(--cream)] transition-colors cursor-pointer">OK</button>
          </div>
        </div>
      )}

      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--aeterna-charcoal)]/90 backdrop-blur-xl p-8">
          <div className="rounded-[28px] max-w-md w-full p-10 border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-white shadow-[var(--shadow-deep)]">
            <h2 className="text-xl font-serif font-light text-white mb-2">Support the Family</h2>
            <p className="text-sm text-[var(--aeterna-gold-muted)] leading-relaxed mb-4">
              In lieu of flowers, you can make a contribution toward expenses or a cause the family chooses.
            </p>
            <p className="text-xs text-[var(--aeterna-gold-muted)] mb-4">
              A small processing fee (card fees plus about 1% platform fee) helps us host Aeterna for families.
            </p>
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--aeterna-gold-muted)] mb-2">
                Choose an amount (USD)
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {[50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSupportAmount(amt)}
                    className={`cursor-pointer flex-1 min-w-[80px] px-3 py-2 rounded-[999px] border text-sm ${
                      supportAmount === amt
                        ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)] text-[var(--aeterna-gold)]"
                        : "border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] hover:border-[var(--aeterna-gold)]/60"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--aeterna-gold-muted)]">Other:</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={supportAmount ?? ""}
                  onChange={(e) => setSupportAmount(e.target.value ? Number(e.target.value) : null)}
                  className="w-24 px-3 py-1.5 rounded-[999px] bg-[var(--aeterna-charcoal)] border border-[var(--border-gold-subtle)] text-sm text-white focus:outline-none focus:border-[var(--aeterna-gold)]"
                />
              </div>
            </div>
            {supportError && (
              <p className="text-xs text-red-400 mb-3">
                {supportError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={startSupportCheckout}
                disabled={supportLoading || !supportAmount}
                className="flex-1 min-h-[44px] px-6 py-3 rounded-[24px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-sm font-serif tracking-[0.18em] uppercase shadow-[var(--shadow-gold)] hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {supportLoading ? "Opening Checkout…" : "Proceed to Secure Payment"}
              </button>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="flex-1 min-h-[44px] px-6 py-3 rounded-[24px] border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {donationsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full mx-4 p-8 shadow-2xl border border-[#E4D7C7]">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-gray-400 mb-2">Flowers & Gifts</p>
                <h2 className="text-2xl font-light">Thoughtful ways to send flowers</h2>
              </div>
              <button type="button" onClick={() => setDonationsOpen(false)} className="text-xs font-sans text-gray-400 uppercase tracking-[0.2em]">Close</button>
            </div>
            <p className="font-sans text-sm text-gray-600 mb-6">Options for sending flowers or gifts near <span className="font-semibold">{event?.location || "the service location"}</span>.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 font-sans text-sm">
              <div className="border border-[#E4D7C7] rounded-xl p-4 bg-[#FBF7F2]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">Local florists</p>
                <p className="text-gray-700 mb-3">Discover highly-rated florists close to the service.</p>
                <a href={"https://www.google.com/maps/search/florist+near+" + encodeURIComponent(event?.location || "")} target="_blank" rel="noreferrer" className="text-[12px] underline underline-offset-4 decoration-[#D0B898]">Open in Google Maps</a>
              </div>
              <div className="border border-[#E4D7C7] rounded-xl p-4 bg-white">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">Same‑day delivery</p>
                <p className="text-gray-700 mb-3">Nationwide flower delivery for U.S. &amp; Australian addresses.</p>
                <a href="https://www.google.com/search?q=flower+delivery" target="_blank" rel="noreferrer" className="text-[12px] underline underline-offset-4 decoration-[#D0B898]">View online florists</a>
              </div>
              <div className="border border-[#E4D7C7] rounded-xl p-4 bg-white">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">Custom link</p>
                <p className="text-gray-700 mb-3">Family’s preferred link.</p>
                {event?.flower_link ? <a href={event.flower_link} target="_blank" rel="noreferrer" className="text-[12px] underline underline-offset-4 decoration-[#D0B898]">Open family’s link</a> : <span className="text-[12px] text-gray-400">Not provided.</span>}
              </div>
            </div>
            <p className="font-sans text-[11px] text-gray-400">Guests can choose any option or use their own florist.</p>
          </div>
        </div>
      )}
    </div>
  )
}
