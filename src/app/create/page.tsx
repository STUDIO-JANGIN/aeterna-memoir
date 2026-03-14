"use client" // 1순위: 클라이언트 컴포넌트 선언이 가장 먼저!
export const dynamic = 'force-dynamic' // 2순위: 그 다음에 빌드 설정 추가

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

function CreateEventForm() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authView, setAuthView] = useState<AuthView>("signin")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSubmitLoading, setAuthSubmitLoading] = useState(false)

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://aeterna.com"
  const guestUrl = createdSlug ? `${baseUrl.replace(/\/$/, "")}/p/${createdSlug}` : ""

  const getInvitationText = () =>
    `${name}님을 기리는 추모 공간입니다. 사진과 추억을 나눠 주세요.\n\n${guestUrl}`

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
    const text = encodeURIComponent(`${name}님 추모 공간 – 사진과 추억을 나눠 주세요`)
    const urlEnc = encodeURIComponent(guestUrl)
    window.open(`https://story.kakao.com/share?url=${urlEnc}&text=${text}`, "_blank", "noopener,noreferrer")
  }

  const shareViaInstagram = () => {
    handleCopyInvitationLink()
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer")
  }

  const shareViaWhatsApp = () => {
    if (typeof window === "undefined" || !guestUrl) return
    const text = encodeURIComponent(`${name}님 추모 공간\n${guestUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
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
      setCreateError(result.error ?? "추모 공간 생성에 실패했습니다.")
    }
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-12 font-serif text-[var(--aeterna-gold-muted)]">
        <p className="text-[11px] uppercase tracking-[0.3em]">로딩 중…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full p-8 rounded-[28px] border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/95">
          <h1 className="text-2xl font-light text-[var(--aeterna-headline)] mb-6 text-center">시작하기</h1>
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
                placeholder="이메일"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)]"
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)]"
                required
              />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit" disabled={authSubmitLoading} className="w-full py-4 rounded-[24px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium">
                {authSubmitLoading ? "로그인 중…" : "로그인"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setAuthSubmitLoading(true)
                setAuthError(null)
                const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
                setAuthSubmitLoading(false)
                if (error) setAuthError(error.message)
              }}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="이메일"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)]"
                required
              />
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)]"
                required
                minLength={6}
              />
              {authError && <p className="text-red-400 text-sm">{authError}</p>}
              <button type="submit" disabled={authSubmitLoading} className="w-full py-4 rounded-[24px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium">
                {authSubmitLoading ? "가입 중…" : "가입"}
              </button>
            </form>
          )}
          <button type="button" onClick={() => setAuthView(authView === "signin" ? "signup" : "signin")} className="mt-4 w-full text-sm text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)]">
            {authView === "signin" ? "계정이 없으신가요? 가입하기" : "이미 계정이 있으신가요? 로그인"}
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
              <h1 className="text-2xl md:text-3xl mb-2 font-light tracking-tight text-[var(--aeterna-headline)]">누구를 위한 추모 공간인가요?</h1>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button type="button" onClick={() => setMemorialType("person")} className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl border-2 border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/80 hover:border-[var(--aeterna-gold)] transition-colors">
                  <span className="text-4xl">🙏</span>
                  <span className="font-serif text-sm uppercase tracking-[0.2em] text-[var(--aeterna-gold)]">인간</span>
                </button>
                <button type="button" onClick={() => setMemorialType("pet")} className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl border-2 border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/80 hover:border-[var(--aeterna-gold)] transition-colors">
                  <span className="text-4xl">🐾</span>
                  <span className="font-serif text-sm uppercase tracking-[0.2em] text-[var(--aeterna-gold)]">동물</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl md:text-3xl font-light text-[var(--aeterna-headline)]">추모 공간 만들기</h1>
                <button type="button" onClick={handleSignOut} className="text-[11px] uppercase tracking-wider text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)]">다른 유형 선택</button>
              </div>
              <form onSubmit={handleCreate} className="space-y-6 text-left mt-6">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">이름 *</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 또는 호칭" className="w-full border-b border-[var(--border-gold-subtle)] py-3 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">프로필 사진 (선택)</label>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => profileInputRef.current?.click()} className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--border-gold-subtle)] flex items-center justify-center overflow-hidden bg-[var(--aeterna-charcoal)]/60 hover:border-[var(--aeterna-gold)] transition-colors">
                      {profilePreview ? <img src={profilePreview} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl text-[var(--aeterna-gold-muted)]">+</span>}
                    </button>
                    <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
                    <span className="text-xs text-[var(--aeterna-gold-muted)]">클릭하여 업로드</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">생년</label>
                    <select value={birthY} onChange={(e) => setBirthY(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">연도</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">월</label>
                    <select value={birthM} onChange={(e) => setBirthM(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">월</option>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">일</label>
                    <select value={birthD} onChange={(e) => setBirthD(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">일</option>
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">몰년</label>
                    <select value={deathY} onChange={(e) => setDeathY(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">연도</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">월</label>
                    <select value={deathM} onChange={(e) => setDeathM(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">월</option>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)] mb-1 block">일</label>
                    <select value={deathD} onChange={(e) => setDeathD(e.target.value)} className="w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                      <option value="">일</option>
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showFuneralInfo} onChange={(e) => setShowFuneralInfo(e.target.checked)} className="rounded border-[var(--border-gold-subtle)]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">장례 정보 (선택)</span>
                  </label>
                  {showFuneralInfo && (
                    <div className="mt-3 space-y-3">
                      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="장소" className="w-full border-b border-[var(--border-gold-subtle)] py-2 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40" />
                      <div className="flex gap-2 items-center">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">시간</span>
                        <select value={ceremonyH} onChange={(e) => setCeremonyH(Number(e.target.value))} className="border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                          {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}시</option>)}
                        </select>
                        <select value={ceremonyM} onChange={(e) => setCeremonyM(e.target.value)} className="border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                          {MINUTES.map((m) => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">사진 수집 기간</label>
                  <select value={collectionPeriod} onChange={(e) => setCollectionPeriod(e.target.value as typeof collectionPeriod)} className="w-full border border-[var(--border-gold-subtle)] py-3 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg">
                    <option value="3">3일</option>
                    <option value="7">7일</option>
                    <option value="14">14일</option>
                    <option value="funeral">장례 일정 기준 (몰일 + 7일)</option>
                    <option value="custom">직접 입력</option>
                  </select>
                  {collectionPeriod === "custom" && (
                    <input type="datetime-local" value={customExpiredAt} onChange={(e) => setCustomExpiredAt(e.target.value)} className="mt-2 w-full border border-[var(--border-gold-subtle)] py-2 bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] rounded-lg" />
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showMemorialFund} onChange={(e) => setShowMemorialFund(e.target.checked)} className="rounded border-[var(--border-gold-subtle)]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">기부금 링크 (선택)</span>
                  </label>
                  {showMemorialFund && (
                    <input value={fundLink} onChange={(e) => setFundLink(e.target.value)} placeholder="https://..." className="mt-2 w-full border-b border-[var(--border-gold-subtle)] py-2 bg-transparent text-[var(--aeterna-headline)] placeholder:text-white/40" />
                  )}
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-2 block">플랜</label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${storagePlan === "free" ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)]/10" : "border-[var(--border-gold-subtle)]"}`}>
                      <input type="radio" name="plan" value="free" checked={storagePlan === "free"} onChange={() => setStoragePlan("free")} className="mt-1" />
                      <div>
                        <span className="font-medium text-[var(--aeterna-headline)]">Free</span>
                        <p className="text-xs text-[var(--aeterna-gold-muted)] mt-0.5">7일 후 삭제, 영상 불가</p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${storagePlan === "plus" ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)]/10" : "border-[var(--border-gold-subtle)]"}`}>
                      <input type="radio" name="plan" value="plus" checked={storagePlan === "plus"} onChange={() => setStoragePlan("plus")} className="mt-1" />
                      <div>
                        <span className="font-medium text-[var(--aeterna-headline)]">Plus $19.99</span>
                        <p className="text-xs text-[var(--aeterna-gold-muted)] mt-0.5">영구 보존, 모든 사진 접근</p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${storagePlan === "premium" ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold-pale)]/10" : "border-[var(--border-gold-subtle)]"}`}>
                      <input type="radio" name="plan" value="premium" checked={storagePlan === "premium"} onChange={() => setStoragePlan("premium")} className="mt-1" />
                      <div>
                        <span className="font-medium text-[var(--aeterna-headline)]">Premium $39.99</span>
                        <p className="text-xs text-[var(--aeterna-gold-muted)] mt-0.5">Plus + Luma AI 헌정 영상 (Top 20장 기반)</p>
                      </div>
                    </label>
                  </div>
                </div>
                {createError && <p className="text-red-400 text-sm">{createError}</p>}
                <motion.button type="submit" disabled={loading} className="w-full py-5 rounded-[24px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold-pale)]/20 transition-colors disabled:opacity-60">
                  {loading ? "생성 중…" : "추모 공간 만들기"}
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
              <h2 className="text-2xl mb-2">{name}님 추모 공간이 만들어졌어요</h2>
              <p className="text-sm text-[var(--aeterna-gold-muted)] mb-6">링크를 공유하고 지인들에게 사진과 추억을 부탁해 보세요.</p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <button type="button" onClick={handleCopyInvitationLink} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  {copied ? "복사됨!" : "링크 복사"}
                </button>
                <button type="button" onClick={shareViaKakao} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  카카오톡
                </button>
                <button type="button" onClick={shareViaWhatsApp} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  WhatsApp
                </button>
                <button type="button" onClick={shareViaInstagram} className="min-h-[44px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors">
                  인스타그램
                </button>
              </div>
              <div className="border-t border-[var(--border-gold-subtle)] pt-6 mt-6">
                <MemorialQRCard slug={createdSlug} title={`${name}님 추모 공간`} description="QR 코드를 스캔하여 접속" downloadName="aeterna-qr" className="mx-auto" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => router.push(`/p/${createdSlug}`)} className="flex-1 min-h-[48px] px-6 py-3 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium hover:bg-[var(--aeterna-gold-light)] transition-colors">
                  추모 공간 보기
                </button>
                <button type="button" onClick={() => { setShowSuccessPopup(false); setCreatedSlug(null); setMemorialType(null); setName(""); setProfileFile(null); setBirthY(""); setBirthM(""); setBirthD(""); setDeathY(""); setDeathM(""); setDeathD(""); setLocation(""); setCeremonyH(10); setCeremonyM("00"); setShowFuneralInfo(false); setShowMemorialFund(false); setFundLink(""); setCollectionPeriod("7"); setCustomExpiredAt(""); setStoragePlan("free"); }} className="min-h-[48px] px-6 py-3 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] transition-colors">
                  새로 만들기
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
    <Suspense fallback={<div className="min-h-screen bg-[var(--aeterna-charcoal)] flex items-center justify-center text-[var(--aeterna-gold-muted)] font-serif uppercase tracking-widest">로딩 중...</div>}>
      <CreateEventForm />
    </Suspense>
  )
}
