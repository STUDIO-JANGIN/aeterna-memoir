"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { AnimatePresence, motion } from "framer-motion"
import { RevealSection } from "@/components/RevealSection"
import { MemorialQRCard } from "@/components/MemorialQRCard"
import { createEventAction } from "@/app/actions/createEvent"
import { uploadNewEventProfileAction } from "@/app/actions/uploadNewEventProfile"

type AuthView = "signin" | "signup"
type MemorialType = "person" | "pet"
type StoragePlan = "free" | "plus" | "premium"

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = ["00", "15", "30", "45"]

function buildDateString(y: string, m: string, d: string): string {
  if (!y) return ""
  if (!m) return y
  if (!d) return `${y}-${String(m).padStart(2, "0")}`
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function buildTimeString(h: number, m: string): string {
  return `${String(h).padStart(2, "0")}:${m}`
}

function getRedirectUrl(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/create`
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://aeterna.com"
}

function CreateEventForm() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authView, setAuthView] = useState<AuthView>("signin")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSubmitLoading, setAuthSubmitLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [memorialType, setMemorialType] = useState<MemorialType | null>(null)
  const [name, setName] = useState("")
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)

  const [birthY, setBirthY] = useState("")
  const [birthM, setBirthM] = useState("")
  const [birthD, setBirthD] = useState("")
  const [deathY, setDeathY] = useState("")
  const [deathM, setDeathM] = useState("")
  const [deathD, setDeathD] = useState("")

  const [showFuneralInfo, setShowFuneralInfo] = useState(false)
  const [location, setLocation] = useState("")
  const [ceremonyH, setCeremonyH] = useState(10)
  const [ceremonyM, setCeremonyM] = useState("00")

  const [showMemorialFund, setShowMemorialFund] = useState(false)
  const [fundLink, setFundLink] = useState("")

  const [collectionPeriod, setCollectionPeriod] = useState<"3" | "7" | "14" | "funeral" | "custom">("7")
  const [customExpiredAt, setCustomExpiredAt] = useState("")
  const [storagePlan, setStoragePlan] = useState<StoragePlan>("free")
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) return
    let cancelled = false
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (cancelled) return
      if (!error && data.session) setUser(data.session.user)
      window.history.replaceState({}, "", "/create")
    })
    return () => { cancelled = true }
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getSession().then((res) => {
      setUser(res.data.session?.user ?? null)
      setAuthLoading(false)
    })
    const sub = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!profileFile) {
      setProfilePreview(null)
      return
    }
    const url = URL.createObjectURL(profileFile)
    setProfilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [profileFile])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://aeterna.com")
  const guestUrl = createdSlug ? `${baseUrl.replace(/\/$/, "")}/p/${createdSlug}` : ""

  const getInvitationText = () =>
    `A space in loving memory of ${name}. Share photos and stories:\n\n${guestUrl}`

  const handleCopyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(getInvitationText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const input = document.createElement("input")
      input.value = getInvitationText()
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const shareViaKakao = () => {
    if (typeof window === "undefined" || !guestUrl) return
    const text = encodeURIComponent(`In memory of ${name}. Share photos and stories.`)
    const urlEnc = encodeURIComponent(guestUrl)
    window.open(`https://story.kakao.com/share?url=${urlEnc}&text=${text}`, "_blank", "noopener,noreferrer")
  }

  const shareViaInstagram = () => {
    handleCopyInvitationLink()
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer")
  }

  const shareViaWhatsApp = () => {
    if (typeof window === "undefined" || !guestUrl) return
    const text = encodeURIComponent(`In memory of ${name}\n${guestUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
  }

  const handleContinueWithGoogle = async () => {
    setGoogleLoading(true)
    setAuthError(null)
    const redirectTo = getRedirectUrl()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })
    setGoogleLoading(false)
    if (error) setAuthError(error.message)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMemorialType(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (memorialType === null) return
    setLoading(true)
    setCreateError(null)
    const birth_date = buildDateString(birthY, birthM, birthD) || "—"
    const death_date = buildDateString(deathY, deathM, deathD) || "—"
    const ceremony_time = showFuneralInfo ? buildTimeString(ceremonyH, ceremonyM) : undefined
    const creatorEmail = user?.email ?? "guest-user@temp.local"

    let customExpiredIso: string | undefined
    if (collectionPeriod === "custom" && customExpiredAt.trim()) {
      const parsed = new Date(customExpiredAt.trim())
      if (!Number.isNaN(parsed.getTime())) customExpiredIso = parsed.toISOString()
    } else if (collectionPeriod === "funeral" && showFuneralInfo && deathY && deathM && deathD) {
      const d = new Date(parseInt(deathY, 10), parseInt(deathM, 10) - 1, parseInt(deathD, 10))
      d.setDate(d.getDate() + 7)
      customExpiredIso = d.toISOString()
    }

    const result = await createEventAction({
      name: name.trim(),
      birth_date,
      death_date,
      location: showFuneralInfo ? location.trim() : "",
      ceremony_time: showFuneralInfo ? (ceremony_time || "Time TBD") : undefined,
      has_fund: showMemorialFund,
      fund_link: showMemorialFund ? fundLink.trim() : undefined,
      creator_email: creatorEmail,
      memorial_type: memorialType,
      collection_period: collectionPeriod === "custom" || collectionPeriod === "funeral" ? "custom" : collectionPeriod === "3" ? "3" : collectionPeriod === "14" ? "14" : "7",
      custom_expired_at: customExpiredIso,
      tier: storagePlan,
    })

    if (result.ok) {
      setCreatedSlug(result.slug)
      if (profileFile && result.slug) {
        const fd = new FormData()
        fd.set("profile_image", profileFile)
        await uploadNewEventProfileAction(result.slug, fd)
      }
      setShowSuccessPopup(true)
    } else {
      setCreateError(result.error ?? "We couldn't create the memorial space. Please try again.")
    }
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-12 font-serif text-[var(--aeterna-gold-muted)]">
        <p className="text-[11px] uppercase tracking-[0.3em]">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full p-8 rounded-[28px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/95">
          <h1 className="text-2xl font-light text-[var(--aeterna-headline)] mb-2 text-center">Welcome</h1>
          <p className="text-sm text-[var(--aeterna-gold-muted)] mb-6 text-center">Sign in to create a memorial space.</p>

          <button
            type="button"
            onClick={handleContinueWithGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 min-h-[52px] py-3 rounded-2xl border-2 border-[var(--border-gold-subtle)] bg-transparent text-[var(--aeterna-headline)] font-medium hover:bg-[var(--aeterna-gold-pale)]/20 hover:border-[var(--aeterna-gold)]/50 transition-colors disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-gold-subtle)]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-[var(--aeterna-gold-muted)]">
              <span className="bg-[var(--aeterna-charcoal-soft)] px-3">or</span>
            </div>
          </div>

          {authView === "signin" ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setAuthSubmitLoading(true)
                setAuthError(null)
                const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
                setAuthSubmitLoading(false)
                if (error) setAuthError(error.message)
              }}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40"
                required
              />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit" disabled={authSubmitLoading} className="w-full py-4 rounded-[24px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium disabled:opacity-60">
                {authSubmitLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setAuthSubmitLoading(true)
                setAuthError(null)
                const { error } = await supabase.auth.signUp({
                  email: authEmail,
                  password: authPassword,
                  options: { emailRedirectTo: getRedirectUrl() },
                })
                setAuthSubmitLoading(false)
                if (error) {
                  setAuthError(error.message)
                  return
                }
                setAuthError(null)
                setAuthView("signin")
                setAuthError("Check your email for the confirmation link.")
              }}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40"
                required
              />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40"
                required
                minLength={6}
              />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit" disabled={authSubmitLoading} className="w-full py-4 rounded-[24px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium disabled:opacity-60">
                {authSubmitLoading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => { setAuthView(authView === "signin" ? "signup" : "signin"); setAuthError(null); }}
            className="mt-4 w-full text-sm text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            {authView === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-6 md:p-12 text-center font-serif text-[var(--aeterna-headline)]">
      <RevealSection className="w-full flex items-center justify-center">
        <div className="max-w-lg w-full p-8 md:p-12 rounded-[28px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/95 shadow-[var(--shadow-deep)]">
          {memorialType === null ? (
            <div className="py-4">
              <h1 className="text-2xl md:text-3xl mb-2 font-light tracking-tight text-[var(--aeterna-headline)]">Who is this memorial for?</h1>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button type="button" onClick={() => setMemorialType("person")} className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl border-2 border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/80 hover:border-[var(--aeterna-gold)] transition-colors">
                  <span className="text-4xl">🙏</span>
                  <span className="font-serif text-sm uppercase tracking-[0.2em] text-[var(--aeterna-gold)]">A Loved One</span>
                </button>
                <button type="button" onClick={() => setMemorialType("pet")} className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl border-2 border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/80 hover:border-[var(--aeterna-gold)] transition-colors">
                  <span className="text-4xl">🐾</span>
                  <span className="font-serif text-sm uppercase tracking-[0.2em] text-[var(--aeterna-gold)]">A Cherished Companion</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl md:text-3xl font-light text-[var(--aeterna-headline)]">Create a memorial</h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--aeterna-gold-muted)] hidden sm:inline">{user.email}</span>
                  <button type="button" onClick={handleSignOut} className="text-[11px] uppercase tracking-wider text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)]">Switch type</button>
                </div>
              </div>
              <form onSubmit={handleCreate} className="space-y-6 text-left mt-6">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">Name *</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name or how you called them" className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">Profile photo (optional)</label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => profileInputRef.current?.click()} className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--border-gold-subtle)] flex items-center justify-center overflow-hidden bg-[var(--aeterna-charcoal)]/60 hover:border-[var(--aeterna-gold)] transition-colors">
                      {profilePreview ? <img src={profilePreview} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl text-[var(--aeterna-gold-muted)]">+</span>}
                    </button>
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
                    <span className="text-xs text-[var(--aeterna-gold-muted)]">Click to upload</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">Birth year</label>
                    <select value={birthY} onChange={(e) => setBirthY(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">Year</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">Month</label>
                    <select value={birthM} onChange={(e) => setBirthM(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">Mo</option>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">Day</label>
                    <select value={birthD} onChange={(e) => setBirthD(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">Day</option>
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">Year passed</label>
                    <select value={deathY} onChange={(e) => setDeathY(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">Year</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">Month</label>
                    <select value={deathM} onChange={(e) => setDeathM(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">Mo</option>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">Day</label>
                    <select value={deathD} onChange={(e) => setDeathD(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">Day</option>
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showFuneralInfo} onChange={(e) => setShowFuneralInfo(e.target.checked)} className="rounded border-[var(--border-gold-subtle)]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">Service details (optional)</span>
                  </label>
                  {showFuneralInfo && (
                    <div className="mt-3 space-y-3">
                      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue" className="w-full border-b border-[var(--border-gold-subtle)] py-2 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40" />
                      <div className="flex gap-2 items-center">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">Time</span>
                        <select value={ceremonyH} onChange={(e) => setCeremonyH(Number(e.target.value))} className="border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                          {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}</option>)}
                        </select>
                        <select value={ceremonyM} onChange={(e) => setCeremonyM(e.target.value)} className="border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                          {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">Collection period</label>
                  <select value={collectionPeriod} onChange={(e) => setCollectionPeriod(e.target.value as typeof collectionPeriod)} className="w-full border border-[var(--border-gold-subtle)] py-3 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="funeral">Based on service (7 days after)</option>
                    <option value="custom">Custom date</option>
                  </select>
                  {collectionPeriod === "custom" && (
                    <input type="datetime-local" value={customExpiredAt} onChange={(e) => setCustomExpiredAt(e.target.value)} className="mt-2 w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg" />
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showMemorialFund} onChange={(e) => setShowMemorialFund(e.target.checked)} className="rounded border-[var(--border-gold-subtle)]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">Memorial fund link (optional)</span>
                  </label>
                  {showMemorialFund && (
                    <input value={fundLink} onChange={(e) => setFundLink(e.target.value)} placeholder="https://..." className="mt-2 w-full border-b border-[var(--border-gold-subtle)] py-2 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40" />
                  )}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">Preservation Tiers</label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${storagePlan === "free" ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)]/10" : "border-[var(--border-gold-subtle)]"}`}>
                      <input type="radio" name="plan" value="free" checked={storagePlan === "free"} onChange={() => setStoragePlan("free")} className="mt-1" />
                      <div>
                        <span className="font-medium text-[var(--aeterna-headline)]">Sacred space</span>
                        <p className="text-xs text-[var(--aeterna-gold-muted)] mt-0.5">A sacred space for the first 7 days of remembrance. Preserve their light before the initial archive window closes.</p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${storagePlan === "plus" ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)]/10" : "border-[var(--border-gold-subtle)]"}`}>
                      <input type="radio" name="plan" value="plus" checked={storagePlan === "plus"} onChange={() => setStoragePlan("plus")} className="mt-1" />
                      <div>
                        <span className="font-medium text-[var(--aeterna-headline)]">Plus $19.99</span>
                        <p className="text-xs text-[var(--aeterna-gold-muted)] mt-0.5">Permanent preservation. Full access to all photos.</p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${storagePlan === "premium" ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)]/10" : "border-[var(--border-gold-subtle)]"}`}>
                      <input type="radio" name="plan" value="premium" checked={storagePlan === "premium"} onChange={() => setStoragePlan("premium")} className="mt-1" />
                      <div>
                        <span className="font-medium text-[var(--aeterna-headline)]">Premium $39.99</span>
                        <p className="text-xs text-[var(--aeterna-gold-muted)] mt-0.5">Plus + Luma AI tribute film (Top 20 photos).</p>
                      </div>
                    </label>
                  </div>
                </div>
                {createError && <p className="text-red-400 text-sm">{createError}</p>}
                <motion.button type="submit" disabled={loading} className="w-full py-5 rounded-[24px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold-pale)]/20 transition-colors disabled:opacity-60">
                  {loading ? "Creating…" : "Create memorial"}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </RevealSection>

      <AnimatePresence>
        {showSuccessPopup && createdSlug && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--aeterna-charcoal)]/90 backdrop-blur-xl p-6 overflow-y-auto">
            <div className="bg-[var(--aeterna-charcoal-soft)] p-8 md:p-12 rounded-[32px] border border-[var(--border-gold)] text-center max-w-lg w-full my-8">
              <h2 className="text-2xl mb-2">Memorial for {name} is ready</h2>
              <p className="text-sm text-[var(--aeterna-gold-muted)] mb-6">Share the link and invite loved ones to add photos and stories.</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <button type="button" onClick={handleCopyInvitationLink} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  {copied ? "Copied!" : "Copy link"}
                </button>
                <button type="button" onClick={shareViaKakao} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  Kakao
                </button>
                <button type="button" onClick={shareViaWhatsApp} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  WhatsApp
                </button>
                <button type="button" onClick={shareViaInstagram} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  Instagram
                </button>
              </div>
              <div className="border-t border-[var(--border-gold-subtle)] pt-6 mt-6">
                <MemorialQRCard slug={createdSlug} title={`Memorial for ${name}`} description="Scan to open" downloadName="aeterna-qr" className="mx-auto" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => router.push(`/p/${createdSlug}`)} className="flex-1 min-h-[48px] px-6 py-3 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium hover:bg-[var(--aeterna-gold-light)] transition-colors">
                  View memorial
                </button>
                <button type="button" onClick={() => { setShowSuccessPopup(false); setCreatedSlug(null); setMemorialType(null); setName(""); setProfileFile(null); setBirthY(""); setBirthM(""); setBirthD(""); setDeathY(""); setDeathM(""); setDeathD(""); setLocation(""); setCeremonyH(10); setCeremonyM("00"); setShowFuneralInfo(false); setShowMemorialFund(false); setFundLink(""); setCollectionPeriod("7"); setCustomExpiredAt(""); setStoragePlan("free"); }} className="min-h-[48px] px-6 py-3 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] transition-colors">
                  Create another
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--aeterna-charcoal)] flex items-center justify-center text-[var(--aeterna-gold-muted)] font-serif uppercase tracking-widest">Loading…</div>}>
      <CreateEventForm />
    </Suspense>
  )
}
