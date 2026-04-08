"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { Flower2, Sparkles } from "lucide-react"
import { SacredWelcomeLoadingFallback } from "@/components/Auth/LoadingOverlay"
import { supabase } from "@/lib/supabase/browser"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { ARTISAN_SPRING, artisanPresence } from "@/lib/artisanMotion"
import { playShutterClick } from "@/lib/shutterClick"
import { MemorialInvitationCard } from "@/components/MemorialInvitationCard"
import { MemorialShareActions } from "@/components/MemorialShareActions"
import { createEventAction } from "@/app/actions/createEvent"
import { createPlusCheckoutSessionAction } from "@/app/actions/createPlusCheckoutSession"
import { createPremiumTierCheckoutSessionAction } from "@/app/actions/createPremiumTierCheckoutSession"
import { uploadNewEventProfileAction } from "@/app/actions/uploadNewEventProfile"
import {
  type CreateDraftV1,
  type PendingCheckoutV1,
  clearCreateDraft,
  clearPendingCheckout,
  readCreateDraft,
  readPendingCheckout,
  writeCreateDraft,
  writePendingCheckout,
  type MemorialType,
  type StoragePlan,
} from "@/lib/createFlowStorage"
import { useSupabaseUser } from "@/hooks/useSupabaseUser"
import { buildOAuthCallbackRedirectUrl, CANONICAL_SITE_ORIGIN } from "@/lib/appUrl"

/** URL `plan=` → internal tier. Legacy: `basic` = Plus; marketing: `forever` = Plus, `film` = Premium. */
function parsePlanQueryParam(param: string | null): StoragePlan | null {
  if (!param) return null
  const p = param.trim().toLowerCase()
  if (p === "basic" || p === "forever") return "plus"
  if (p === "premium" || p === "film") return "premium"
  if (p === "free") return "free"
  return null
}

const WIZARD_STEPS_FULL = 9

/** Inline pill next to plan titles (e.g. Eternal Film). */
const planStatusTagClass =
  "inline-flex shrink-0 items-center rounded-md border border-[var(--aeterna-gold)]/25 bg-[var(--aeterna-gold)]/[0.08] px-2.5 py-1 text-[7px] font-semibold uppercase leading-snug tracking-[0.18em] text-[#d8c896]"

/** 1 = forward (enter from right), -1 = back (enter from left). Drives X-axis spring slides. */
const WIZARD_STEP_SLIDE_VARIANTS: Variants = {
  initial: (dir: number) => ({
    opacity: 0,
    x: dir === 1 ? 40 : -40,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir === 1 ? -36 : 36,
  }),
}

/** Canonical query for Stripe cancel / return links (matches landing `?plan=`). */
function storagePlanToUrlPlan(p: StoragePlan): "basic" | "premium" | "free" | "forever" | "film" {
  if (p === "plus") return "forever"
  if (p === "premium") return "film"
  return "free"
}

const PLAN_SUMMARY: Record<
  StoragePlan,
  { title: string; price: string; tagline: string; benefits: string[] }
> = {
  free: {
    title: "Sacred Window",
    price: "$0",
    tagline: "7 days to gather memories. A gentle, peaceful start.",
    benefits: [
      "Seven days for family and friends to add photos and stories",
      "Upgrade anytime to preserve the shrine forever",
    ],
  },
  plus: {
    title: "Eternal Legacy",
    price: "$19.99",
    tagline: "Keep every photo and story preserved forever. No expiration.",
    benefits: ["Every photo and story preserved for good", "A permanent, shareable memorial home"],
  },
  premium: {
    title: "The Eternal Film",
    price: "$39.99",
    tagline: "Eternal Legacy + AI Film Pre-Order",
    benefits: [
      "Everything in Eternal Legacy",
      "Priority access to your AI tribute film when V2 launches — pre-order today",
    ],
  },
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ["00", "15", "30", "45"]
/** Memorial service date — past + upcoming years (matches Born/At Rest ghost selects) */
const CEREMONY_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 2 + i)

const inputBase =
  "w-full rounded-[32px] bg-white/[0.04] px-5 py-4 text-lg text-[color:var(--landing-text-hero)] placeholder:text-white/35 shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] outline-none transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus:bg-white/[0.07] focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.28),0_0_0_1px_rgba(197,160,89,0.25)] focus:ring-0"

const selectBase =
  "w-full min-h-[52px] rounded-[32px] bg-white/[0.04] px-4 py-3 text-base text-[var(--landing-text-hero)] outline-none transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus:bg-white/[0.07] focus:ring-1 focus:ring-[var(--aeterna-gold)]/30 appearance-none"

/** Step 3 date rows — ghost selects: hairline bottom, gold edge on focus (Obsidian) */
const ghostDateSelectClass =
  "w-full min-w-0 min-h-[52px] appearance-none cursor-pointer rounded-none border-0 border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-transparent px-1 py-3 text-center text-base font-normal tabular-nums text-[#f4f1ea] outline-none transition-[box-shadow,border-color,color] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-[rgba(212,175,55,0.55)] focus:shadow-[0_1px_0_0_rgba(212,175,55,0.38)] [color-scheme:dark]"

/** Step 4 optional fields — ghost line inputs (match Step 1 DNA) */
const ghostLineInputClass =
  "w-full rounded-none border-0 border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-transparent px-0 py-3.5 text-base text-[#f4f1ea] placeholder:text-white/30 outline-none transition-[box-shadow,border-color] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-[rgba(212,175,55,0.55)] focus:shadow-[0_1px_0_0_rgba(212,175,55,0.38)]"

/** Born / At Rest / Location / Support — compact serif section labels */
const stepSectionTitleClass =
  "font-[var(--font-serif)] text-base font-normal uppercase tracking-[0.15em] text-[#f4f1ea]/50 md:text-lg"

/** Memorial details: minimal border, landing-aligned */
const fieldLabelClass = "block text-[10px] tracking-[0.22em] uppercase text-[#f5f5f7]/60 mb-2"
const inputMemorial =
  "w-full rounded-[32px] bg-white/[0.035] px-4 py-3.5 text-base text-[color:var(--landing-text-hero)] placeholder:text-white/32 outline-none transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--aeterna-gold)]/30 focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.28),0_0_20px_-6px_rgba(197,160,89,0.12)] border border-white/[0.1]"
const inputMemorialDate =
  `${inputMemorial} [color-scheme:dark] min-h-[52px]`
const selectMemorial =
  "min-h-[52px] flex-1 min-w-0 rounded-[32px] bg-white/[0.035] px-3 py-3 text-sm text-[#f4f1ea] outline-none transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--aeterna-gold)]/22 border border-white/[0.1] appearance-none"
/** Multiline optional fields — matches memorial inputs, high contrast */
const textareaMemorial =
  "w-full min-h-[100px] rounded-[32px] bg-white/[0.035] px-4 py-3.5 text-base text-[#f4f1ea] placeholder:text-white/32 outline-none transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--aeterna-gold)]/22 border border-white/[0.1] resize-y"

function buildDateString(y: string, m: string, d: string): string {
  if (!y) return ""
  if (!m) return y
  if (!d) return `${y}-${String(m).padStart(2, "0")}`
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function from24hTo12(h: number): { hour12: number; period: "AM" | "PM" } {
  if (h === 0) return { hour12: 12, period: "AM" }
  if (h < 12) return { hour12: h, period: "AM" }
  if (h === 12) return { hour12: 12, period: "PM" }
  return { hour12: h - 12, period: "PM" }
}

/** Human-readable line for `events.ceremony_time` (date + 12h time). */
function buildCeremonyDisplay(
  dateIso: string,
  hour12: number,
  minute: string,
  period: "AM" | "PM"
): string {
  const timeStr = `${hour12}:${minute} ${period}`
  const d = dateIso.trim()
  if (!d) return timeStr
  const parts = d.split("-").map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return timeStr
  const [y, mo, day] = parts
  const dt = new Date(y, mo - 1, day)
  if (Number.isNaN(dt.getTime())) return timeStr
  const long = dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  return `${long} · ${timeStr}`
}

/** Footer-only noise: never block Step 5 (account) or Step 6 (plan) with stale sign-in copy. */
function isMemorialSignInFooterNoise(message: string | null): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    (m.includes("please sign in") && m.includes("memorial")) ||
    m.includes("sign in with google to create")
  )
}

function focusNextField(el: HTMLElement | null) {
  if (!el) return
  el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  window.setTimeout(() => {
    el.focus({ preventScroll: true })
  }, 300)
}

const stepPresence = artisanPresence

function CreateEventForm() {
  const { user, ready: authReady, refresh: refreshAuthUser } = useSupabaseUser()
  const signedIn = Boolean(user?.id)
  const [googleLoading, setGoogleLoading] = useState(false)
  /** Blocks primary continue until sign-out has fully cleared session (avoids OAuth races). */
  const [signingOut, setSigningOut] = useState(false)
  const oauthStartLockRef = useRef(false)

  const [memorialType, setMemorialType] = useState<MemorialType | null>(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [stepSlideDir, setStepSlideDir] = useState<1 | -1>(1)
  const [name, setName] = useState("")
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  /** Framing inside the circle (CSS object-position %; 50 = center). */
  const [profilePan, setProfilePan] = useState({ x: 50, y: 50 })
  const profileDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const [birthY, setBirthY] = useState("")
  const [birthM, setBirthM] = useState("")
  const [birthD, setBirthD] = useState("")
  const [deathY, setDeathY] = useState("")
  const [deathM, setDeathM] = useState("")
  const [deathD, setDeathD] = useState("")

  const birthComplete = Boolean(birthY && birthM && birthD)
  const atRestRevealRef = useRef(false)

  const [location, setLocation] = useState("")
  const [ceremonyDate, setCeremonyDate] = useState("")
  const [ceremonyHour12, setCeremonyHour12] = useState(2)
  const [ceremonyM, setCeremonyM] = useState("00")
  const [ceremonyPeriod, setCeremonyPeriod] = useState<"AM" | "PM">("PM")

  const [fundLink, setFundLink] = useState("")
  /** Printable invitation — words of remembrance */
  const [invitationBio, setInvitationBio] = useState("")
  /** Step 4: whether they host a service; if false, steps 5–6 are skipped. */
  const [willHostMemorialService, setWillHostMemorialService] = useState<boolean | null>(null)
  /** When URL locked a plan, user can open full plan grid to switch. */
  const [showPlanChangeOptions, setShowPlanChangeOptions] = useState(false)

  const [storagePlan, setStoragePlan] = useState<StoragePlan>("plus")
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckoutV1 | null>(null)
  const [showResumeToast, setShowResumeToast] = useState(false)
  const [welcomeSacredOverlay, setWelcomeSacredOverlay] = useState(false)
  const resumeToastAfterAuthRef = useRef(false)
  const welcomeLastShownAtRef = useRef(0)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const fundInputRef = useRef<HTMLInputElement>(null)
  const invitationBioRef = useRef<HTMLTextAreaElement>(null)
  const birthYRef = useRef<HTMLSelectElement>(null)
  const birthMRef = useRef<HTMLSelectElement>(null)
  const birthDRef = useRef<HTMLSelectElement>(null)
  const deathYRef = useRef<HTMLSelectElement>(null)
  const deathMRef = useRef<HTMLSelectElement>(null)
  const deathDRef = useRef<HTMLSelectElement>(null)
  const ceremonyHour12Ref = useRef<HTMLSelectElement>(null)
  const ceremonyMinuteRef = useRef<HTMLSelectElement>(null)
  const ceremonyPeriodRef = useRef<HTMLSelectElement>(null)
  const ceremonyServiceMRef = useRef<HTMLSelectElement>(null)
  const ceremonyServiceDRef = useRef<HTMLSelectElement>(null)
  const ceremonyServiceYRef = useRef<HTMLSelectElement>(null)
  const wizardStepRef = useRef(wizardStep)
  const memorialTypeRef = useRef(memorialType)
  /** When user taps Back from Plan (8) → Account (7), skip the OAuth auto-advance effect so they can stay on 7. */
  const blockPlanAutoAdvanceRef = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const planParam = searchParams.get("plan")?.trim().toLowerCase() ?? null
  const planLockedFromUrl = parsePlanQueryParam(planParam) !== null
  const serviceStepsSkipped = willHostMemorialService === false
  const stepsForProgress = serviceStepsSkipped ? 7 : 9
  const progressStep = useMemo(() => {
    if (!serviceStepsSkipped) return wizardStep
    if (wizardStep <= 5) return wizardStep
    if (wizardStep >= 8) return wizardStep - 2
    return wizardStep
  }, [wizardStep, serviceStepsSkipped])

  /** Step 6 service date — parse ISO yyyy-mm-dd for MM / DD / YYYY selects */
  const ceremonyServiceParts = useMemo(() => {
    const s = ceremonyDate.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { y: "", m: "", d: "" }
    const [y, mo, da] = s.split("-")
    return { y, m: String(Number(mo)), d: String(Number(da)) }
  }, [ceremonyDate])

  useEffect(() => {
    wizardStepRef.current = wizardStep
  }, [wizardStep])

  useEffect(() => {
    if (!memorialType) return
    const t = window.setTimeout(() => {
      if (wizardStep === 1) nameInputRef.current?.focus()
      if (wizardStep === 4) invitationBioRef.current?.focus()
      if (wizardStep === 6) locationInputRef.current?.focus()
      if (wizardStep === 7) fundInputRef.current?.focus()
    }, 80)
    return () => window.clearTimeout(t)
  }, [wizardStep, memorialType])

  useEffect(() => {
    memorialTypeRef.current = memorialType
  }, [memorialType])

  useEffect(() => {
    if (!birthComplete) {
      atRestRevealRef.current = false
      return
    }
    if (atRestRevealRef.current) return
    atRestRevealRef.current = true
    const t = window.setTimeout(() => {
      deathMRef.current?.focus()
    }, 480)
    return () => window.clearTimeout(t)
  }, [birthComplete])

  useEffect(() => {
    const mapped = parsePlanQueryParam(planParam)
    if (mapped !== null) setStoragePlan(mapped)
  }, [planParam])

  useEffect(() => {
    if (!signedIn || !authReady) return
    setCreateError((prev) => (isMemorialSignInFooterNoise(prev) ? null : prev))
  }, [signedIn, authReady])

  useEffect(() => {
    setShowPlanChangeOptions(false)
  }, [planParam])

  useEffect(() => {
    if (!showSuccessPopup) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setShowSuccessPopup(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showSuccessPopup])

  useEffect(() => {
    const authErr = searchParams.get("auth_error")
    if (!authErr) return
    setCreateError(decodeURIComponent(authErr.replace(/\+/g, " ")))
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href)
      u.searchParams.delete("auth_error")
      window.history.replaceState({}, "", `${u.pathname}${u.search}${u.hash}`)
    }
  }, [searchParams])

  useEffect(() => {
    const draft = readCreateDraft()
    const params = new URLSearchParams(window.location.search)
    const planQs = params.get("plan")?.trim().toLowerCase() ?? null
    const locked = parsePlanQueryParam(planQs) !== null
    const maxStep = WIZARD_STEPS_FULL

    if (draft) {
      setMemorialType(draft.memorialType)
      setWizardStep(Math.min(Math.max(1, draft.wizardStep), maxStep))
      if (draft.memorialType !== null) {
        resumeToastAfterAuthRef.current = true
      }
      setName(draft.name)
      setBirthY(draft.birthY)
      setBirthM(draft.birthM)
      setBirthD(draft.birthD)
      setDeathY(draft.deathY)
      setDeathM(draft.deathM)
      setDeathD(draft.deathD)
      setLocation(draft.location)
      if (
        "ceremonyHour12" in draft &&
        typeof (draft as CreateDraftV1).ceremonyHour12 === "number"
      ) {
        const d = draft as CreateDraftV1
        setCeremonyDate(d.ceremonyDate ?? "")
        setCeremonyHour12(d.ceremonyHour12)
        setCeremonyM(d.ceremonyM ?? "00")
        setCeremonyPeriod(d.ceremonyPeriod ?? "PM")
      } else {
        const legacyH = (draft as { ceremonyH?: number }).ceremonyH
        if (typeof legacyH === "number") {
          const c = from24hTo12(legacyH)
          setCeremonyHour12(c.hour12)
          setCeremonyPeriod(c.period)
        } else {
          setCeremonyHour12(2)
          setCeremonyPeriod("PM")
        }
        setCeremonyDate("")
        setCeremonyM(draft.ceremonyM ?? "00")
      }
      setFundLink(draft.fundLink)
      setInvitationBio(draft.invitationBio ?? "")
      setWillHostMemorialService(
        typeof draft.willHostMemorialService === "boolean" ? draft.willHostMemorialService : null
      )
      if (!locked) setStoragePlan(draft.storagePlan)
    }

    const pending = readPendingCheckout()
    if (pending) setPendingCheckout(pending)
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!resumeToastAfterAuthRef.current) return
    resumeToastAfterAuthRef.current = false
    setShowResumeToast(true)
  }, [authReady])

  useEffect(() => {
    if (!showResumeToast) return
    const t = window.setTimeout(() => setShowResumeToast(false), 4200)
    return () => window.clearTimeout(t)
  }, [showResumeToast])

  useEffect(() => {
    if (!welcomeSacredOverlay) return
    const t = window.setTimeout(() => setWelcomeSacredOverlay(false), 2800)
    return () => window.clearTimeout(t)
  }, [welcomeSacredOverlay])

  useEffect(() => {
    if (!pendingCheckout) return
    if (pendingCheckout.storagePlan !== storagePlan) {
      clearPendingCheckout()
      setPendingCheckout(null)
    }
  }, [storagePlan, pendingCheckout])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!memorialType) return
    const draft: CreateDraftV1 = {
      v: 5,
      memorialType,
      wizardStep,
      willHostMemorialService,
      name,
      birthY,
      birthM,
      birthD,
      deathY,
      deathM,
      deathD,
      location,
      ceremonyDate,
      ceremonyHour12,
      ceremonyM,
      ceremonyPeriod,
      fundLink,
      invitationBio,
      storagePlan,
    }
    const t = window.setTimeout(() => writeCreateDraft(draft), 450)
    return () => window.clearTimeout(t)
  }, [
    memorialType,
    wizardStep,
    name,
    birthY,
    birthM,
    birthD,
    deathY,
    deathM,
    deathD,
    location,
    ceremonyDate,
    ceremonyHour12,
    ceremonyM,
    ceremonyPeriod,
    fundLink,
    invitationBio,
    storagePlan,
    willHostMemorialService,
  ])

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) return
    let cancelled = false
    let fallbackTimer: number | undefined
    const planQs = searchParams.get("plan")

    supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      if (cancelled) return
      if (!error) {
        await refreshAuthUser()
        router.refresh()
        const draft = readCreateDraft()
        if (draft?.memorialType && draft.wizardStep === 8) {
          setStepSlideDir(1)
          setWizardStep(9)
          writeCreateDraft({ ...draft, wizardStep: 9 })
        }
        // If React state lags behind the new session (common right after OAuth), resync once.
        fallbackTimer = window.setTimeout(async () => {
          if (cancelled) return
          const { data: udata } = await supabase.auth.getUser()
          if (udata.user) {
            await refreshAuthUser()
            router.refresh()
          } else {
            window.location.reload()
          }
        }, 2000)
      }
      const path = planQs ? `/create?plan=${encodeURIComponent(planQs)}` : "/create"
      window.history.replaceState({}, "", path)
    })
    return () => {
      cancelled = true
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer)
    }
  }, [searchParams, refreshAuthUser, router])

  /** Welcome overlay + session sync on sign-in. Step 7→8 is handled only by the dedicated effect below (single source of truth). */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN") return
      if (!session?.user) return
      const now = Date.now()
      if (now - welcomeLastShownAtRef.current > 800) {
        welcomeLastShownAtRef.current = now
        setWelcomeSacredOverlay(true)
      }
      await refreshAuthUser()
      router.refresh()
    })
    return () => subscription.unsubscribe()
  }, [refreshAuthUser, router])

  useEffect(() => {
    if (!profileFile) {
      setProfilePreview(null)
      setProfilePan({ x: 50, y: 50 })
      return
    }
    setProfilePan({ x: 50, y: 50 })
    const url = URL.createObjectURL(profileFile)
    setProfilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [profileFile])

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : CANONICAL_SITE_ORIGIN)
  const guestUrl = createdSlug ? `${baseUrl.replace(/\/$/, "")}/p/${createdSlug}` : ""

  const handleContinueWithGoogle = async () => {
    if (signingOut || oauthStartLockRef.current) return
    if (memorialType) {
      const snapshot = buildCreateDraft(wizardStep)
      if (snapshot) writeCreateDraft(snapshot)
    }
    oauthStartLockRef.current = true
    setGoogleLoading(true)
    setCreateError(null)
    const planQs = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plan") : null
    const nextPath = planQs ? `/create?plan=${encodeURIComponent(planQs)}` : "/create"
    /** Must match Supabase Auth → Redirect URLs (`https://aeternamemoir.com/auth/callback`). */
    const redirectTo = buildOAuthCallbackRedirectUrl(nextPath)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (error) {
        setCreateError(error.message)
        setGoogleLoading(false)
        oauthStartLockRef.current = false
        return
      }
      /** Browser navigates to Google; keep loading until unload. */
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Sign-in could not start. Please try again.")
      setGoogleLoading(false)
      oauthStartLockRef.current = false
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    setCreateError(null)
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" })
      if (error) setCreateError(error.message)
      await refreshAuthUser()
      router.refresh()
    } finally {
      setSigningOut(false)
    }
    clearPendingCheckout()
    setPendingCheckout(null)
    if (wizardStep >= 9) {
      setStepSlideDir(1)
      setWizardStep(8)
    }
  }

  const resetFlow = () => {
    setShowSuccessPopup(false)
    setCreatedSlug(null)
    clearCreateDraft()
    clearPendingCheckout()
    setPendingCheckout(null)
    setMemorialType(null)
    setStepSlideDir(1)
    setWizardStep(1)
    setName("")
    setProfileFile(null)
    setProfilePan({ x: 50, y: 50 })
    setBirthY("")
    setBirthM("")
    setBirthD("")
    setDeathY("")
    setDeathM("")
    setDeathD("")
    setLocation("")
    setCeremonyDate("")
    setCeremonyHour12(2)
    setCeremonyM("00")
    setCeremonyPeriod("PM")
    setFundLink("")
    setInvitationBio("")
    setWillHostMemorialService(null)
    const mapped = parsePlanQueryParam(
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plan") : null
    )
    setStoragePlan(mapped ?? "plus")
    setCreateError(null)
  }

  const handleProfilePanPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!profilePreview) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    profileDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: profilePan.x,
      originY: profilePan.y,
    }
  }

  const handleProfilePanPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = profileDragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const w = Math.max(rect.width, 1)
    const h = Math.max(rect.height, 1)
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    const nextX = Math.min(100, Math.max(0, d.originX - (dx / w) * 100))
    const nextY = Math.min(100, Math.max(0, d.originY - (dy / h) * 100))
    setProfilePan({ x: nextX, y: nextY })
  }

  const handleProfilePanPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = profileDragRef.current
    if (!d || e.pointerId !== d.pointerId) return
    profileDragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const pickType = (t: MemorialType) => {
    setMemorialType(t)
    setStepSlideDir(1)
    setWizardStep(1)
    setWillHostMemorialService(null)
    setCreateError(null)
  }

  const buildCreateDraft = (stepForDraft: number): CreateDraftV1 | null => {
    if (!memorialType) return null
    return {
      v: 6,
      memorialType,
      wizardStep: stepForDraft,
      willHostMemorialService,
      name,
      birthY,
      birthM,
      birthD,
      deathY,
      deathM,
      deathD,
      location,
      ceremonyDate,
      ceremonyHour12,
      ceremonyM,
      ceremonyPeriod,
      fundLink,
      invitationBio,
      storagePlan,
    }
  }

  const canContinue = (): boolean => {
    if (!memorialType) return false
    switch (wizardStep) {
      case 1:
        return name.trim().length > 0
      case 2:
      case 3:
      case 4:
      case 6:
      case 7:
        return true
      case 5:
        return willHostMemorialService !== null
      case 8:
        return authReady && !signingOut
      case 9:
        return true
      default:
        return false
    }
  }

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (process.env.NODE_ENV === "development") {
      console.log("Back button triggered at Step:", wizardStep)
    }
    setCreateError(null)
    if (!memorialType) return

    /** Step 9 + URL-locked plan: first Back closes the plan grid and returns to summary. */
    if (wizardStep === 9 && planLockedFromUrl && showPlanChangeOptions) {
      setShowPlanChangeOptions(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (wizardStep > 1) {
      setStepSlideDir(-1)
      let nextStep: number
      if (wizardStep === 9) nextStep = 8
      else if (wizardStep === 8 && serviceStepsSkipped) nextStep = 5
      else nextStep = wizardStep - 1

      if (wizardStep === 9 && nextStep === 8) {
        blockPlanAutoAdvanceRef.current = true
      }
      const d = buildCreateDraft(nextStep)
      if (d) writeCreateDraft(d)
      setWizardStep(nextStep)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setMemorialType(null)
    router.push("/")
  }

  const goNext = () => {
    if (!canContinue() || !memorialType) return
    setCreateError(null)

    if (wizardStep === 5) {
      if (willHostMemorialService !== true && willHostMemorialService !== false) return
      setStepSlideDir(1)
      if (willHostMemorialService === false) {
        setLocation("")
        setCeremonyDate("")
        setCeremonyHour12(2)
        setCeremonyM("00")
        setCeremonyPeriod("PM")
        setFundLink("")
        const next = 8
        const d = buildCreateDraft(next)
        if (d) writeCreateDraft(d)
        setWizardStep(next)
      } else {
        const next = 6
        const d = buildCreateDraft(next)
        if (d) writeCreateDraft(d)
        setWizardStep(next)
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (wizardStep < WIZARD_STEPS_FULL) {
      if (wizardStep === 8) blockPlanAutoAdvanceRef.current = false
      setStepSlideDir(1)
      const d = buildCreateDraft(wizardStep + 1)
      if (d) writeCreateDraft(d)
      setWizardStep((s) => s + 1)
    }
  }

  /** After Google OAuth, advance from Account (8) → Plan (9) as soon as the session is confirmed. */
  useEffect(() => {
    if (wizardStep !== 8 || !signedIn || !memorialType || !authReady) return
    if (blockPlanAutoAdvanceRef.current) return
    setStepSlideDir(1)
    setWizardStep(9)
    const d = buildCreateDraft(9)
    if (d) writeCreateDraft(d)
  }, [wizardStep, signedIn, memorialType, authReady])

  const handleCreate = async () => {
    if (memorialType === null || wizardStep !== WIZARD_STEPS_FULL) return
    if (!canContinue()) return

    playShutterClick()

    const snapshot = buildCreateDraft(wizardStep)
    if (snapshot) writeCreateDraft(snapshot)

    const checkoutOpts = {
      cancelToCreate: true as const,
      planQueryParam: storagePlanToUrlPlan(storagePlan),
    }

    if (pendingCheckout && (storagePlan === "plus" || storagePlan === "premium")) {
      if (pendingCheckout.storagePlan === storagePlan) {
        setLoading(true)
        setCreateError(null)
        const checkout =
          storagePlan === "plus"
            ? await createPlusCheckoutSessionAction(pendingCheckout.eventId, pendingCheckout.slug, checkoutOpts)
            : await createPremiumTierCheckoutSessionAction(pendingCheckout.eventId, pendingCheckout.slug, checkoutOpts)
        setLoading(false)
        if (checkout.ok && checkout.url) {
          window.location.href = checkout.url
          return
        }
        setCreateError(
          (!checkout.ok && checkout.error) || "Checkout couldn’t start. Please try again."
        )
        return
      }
    }

    setLoading(true)
    setCreateError(null)
    const birth_date = buildDateString(birthY, birthM, birthD) || "—"
    const death_date = buildDateString(deathY, deathM, deathD) || "—"
    const ceremony_time =
      ceremonyDate.trim().length > 0
        ? buildCeremonyDisplay(ceremonyDate, ceremonyHour12, ceremonyM, ceremonyPeriod)
        : undefined
    if (!user?.email?.trim()) {
      setLoading(false)
      await refreshAuthUser()
      return
    }

    const result = await createEventAction({
      name: name.trim(),
      birth_date,
      death_date,
      location: location.trim(),
      ceremony_time:
        ceremony_time && ceremony_time.trim().length > 0 ? ceremony_time.trim() : undefined,
      has_fund: fundLink.trim().length > 0,
      fund_link: fundLink.trim() || undefined,
      creator_email: user.email.trim(),
      memorial_type: memorialType,
      collection_period: "7",
      custom_expired_at: undefined,
      invitation_bio: invitationBio.trim() ? invitationBio.trim().slice(0, 2000) : undefined,
    })

    if (result.ok) {
      if (profileFile && result.slug) {
        const fd = new FormData()
        fd.set("profile_image", profileFile)
        await uploadNewEventProfileAction(result.slug, fd)
      }

      if (storagePlan === "plus") {
        writePendingCheckout({
          eventId: result.eventId,
          slug: result.slug,
          storagePlan: "plus",
          name: name.trim(),
        })
        setPendingCheckout({
          v: 1,
          eventId: result.eventId,
          slug: result.slug,
          storagePlan: "plus",
          name: name.trim(),
        })
        const checkout = await createPlusCheckoutSessionAction(result.eventId, result.slug, checkoutOpts)
        setLoading(false)
        if (checkout.ok && checkout.url) {
          window.location.href = checkout.url
          return
        }
        setCreateError(
          (!checkout.ok && checkout.error) ||
            "Checkout couldn’t start. Please try again — your memorial draft is saved when you complete payment from the link we email you, or contact support."
        )
        return
      }

      if (storagePlan === "premium") {
        writePendingCheckout({
          eventId: result.eventId,
          slug: result.slug,
          storagePlan: "premium",
          name: name.trim(),
        })
        setPendingCheckout({
          v: 1,
          eventId: result.eventId,
          slug: result.slug,
          storagePlan: "premium",
          name: name.trim(),
        })
        const checkout = await createPremiumTierCheckoutSessionAction(result.eventId, result.slug, checkoutOpts)
        setLoading(false)
        if (checkout.ok && checkout.url) {
          window.location.href = checkout.url
          return
        }
        setCreateError(
          (!checkout.ok && checkout.error) ||
            "Checkout couldn’t start. Please try again — complete payment to open your memorial."
        )
        return
      }

      clearCreateDraft()
      clearPendingCheckout()
      setPendingCheckout(null)
      setCreatedSlug(result.slug)
      setShowSuccessPopup(true)
    } else {
      const err = result.error ?? "We couldn't create the memorial space. Please try again."
      if (signedIn && isMemorialSignInFooterNoise(err)) {
        setCreateError(null)
      } else {
        setCreateError(err)
      }
    }
    setLoading(false)
  }

  const onPrimaryPress = () => {
    if (!memorialType) return
    if (wizardStep === 8 && authReady && !signedIn) {
      void handleContinueWithGoogle()
      return
    }
    if (wizardStep < WIZARD_STEPS_FULL) goNext()
    else handleCreate()
  }

  const progress = memorialType ? progressStep / stepsForProgress : 0

  const isPlanSummaryView =
    memorialType !== null &&
    wizardStep === 9 &&
    planLockedFromUrl &&
    !showPlanChangeOptions

  const invitationBirth = buildDateString(birthY, birthM, birthD) || ""
  const invitationDeath = buildDateString(deathY, deathM, deathD) || ""
  const invitationCeremony =
    ceremonyDate.trim().length > 0
      ? buildCeremonyDisplay(ceremonyDate, ceremonyHour12, ceremonyM, ceremonyPeriod)
      : ""

  const showFooterCreateError =
    Boolean(createError) &&
      !(
      isMemorialSignInFooterNoise(createError) &&
      (wizardStep === 8 || wizardStep === 9 || signedIn)
    )

  return (
    <div className="min-h-dvh bg-landing text-[var(--landing-text-hero)]">
      <AnimatePresence>
        {showResumeToast && (
          <motion.div
            role="status"
            initial={stepPresence.initial}
            animate={stepPresence.animate}
            exit={stepPresence.exit}
            transition={ARTISAN_SPRING}
            className="fixed left-4 right-4 z-[60] max-w-lg mx-auto pointer-events-none"
            style={{
              top: "max(0.75rem, calc(env(safe-area-inset-top, 0px) + 3.25rem))",
            }}
          >
            <p className="rounded-[32px] border border-white/[0.1] bg-landing/95 px-4 py-3 text-center text-sm text-white/85 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md">
              We saved your place — you can pick up here.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {welcomeSacredOverlay && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={stepPresence.initial}
            animate={stepPresence.animate}
            exit={stepPresence.exit}
            transition={ARTISAN_SPRING}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#030303]/72 backdrop-blur-md px-6"
          >
            <motion.p
              initial={stepPresence.initial}
              animate={stepPresence.animate}
              exit={stepPresence.exit}
              transition={ARTISAN_SPRING}
              className="max-w-md text-center font-[var(--font-serif)] text-2xl font-normal tracking-[0.04em] text-[#f4f1ea] md:text-[1.65rem]"
            >
              Welcome to your sacred space.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thin progress + step label (fixed so it stays visible while scrolling) */}
      {memorialType !== null && (
        <header className="pointer-events-auto fixed top-0 left-0 right-0 z-[50] pt-[env(safe-area-inset-top,0px)]">
          <div className="h-[2px] w-full overflow-hidden bg-white/[0.08]">
            <motion.div
              className="h-full bg-[#D4AF37]"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={ARTISAN_SPRING}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.92)] px-4 py-2.5 backdrop-blur-[20px] md:px-8">
            <p className="text-[10px] tracking-[0.28em] uppercase text-white/45 tabular-nums">
              Step {progressStep} of {stepsForProgress}
            </p>
            {signedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className="shrink-0 min-h-[36px] rounded-full border border-white/20 bg-white/[0.07] px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] text-white/80 uppercase shadow-[0_1px_0_rgba(255,255,255,0.06)] transition-[color,background-color,border-color,box-shadow] duration-300 ease-in-out hover:border-white/30 hover:bg-white/[0.12] hover:text-[#f4f1ea] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.15)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : !authReady ? (
              <span className="shrink-0 min-h-[36px] px-1 text-[10px] tracking-[0.2em] text-white/25 uppercase tabular-nums" aria-live="polite">
                …
              </span>
            ) : (
              <span className="min-h-[36px] w-14 shrink-0" aria-hidden />
            )}
          </div>
        </header>
      )}

      <div
        className={`mx-auto flex w-full max-w-lg flex-1 flex-col px-5 ${
          memorialType !== null
            ? "pb-36 pt-[calc(env(safe-area-inset-top,0px)+3.25rem)] md:pb-32"
            : "items-center justify-center py-16 md:py-24"
        }`}
      >
        {memorialType === null ? (
          <div className="w-full text-center">
            <h1 className="text-landing-hero mb-3 px-2">Who are we honoring?</h1>
            <p className="mb-12 text-base leading-relaxed text-white/45">A calm place to remember someone you love.</p>
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => pickType("person")}
                className="cta-silk flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/10 bg-white/[0.04] py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-white/[0.14] hover:bg-white/[0.07] active:scale-[0.98] md:min-h-[180px]"
              >
                <Sparkles className="h-10 w-10 text-[var(--aeterna-gold)]" strokeWidth={1} aria-hidden />
                <span className="text-sm text-white/80">Someone dear</span>
              </button>
              <button
                type="button"
                onClick={() => pickType("pet")}
                className="cta-silk flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/10 bg-white/[0.04] py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-white/[0.14] hover:bg-white/[0.07] active:scale-[0.98] md:min-h-[180px]"
              >
                <span className="text-4xl" aria-hidden>
                  🐾
                </span>
                <span className="text-sm text-white/80">A companion</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {pendingCheckout && (
              <div className="mb-5 rounded-[32px] border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
                <p>
                  Payment didn&apos;t finish.{" "}
                  <span className="font-medium text-[#f4f1ea]">{pendingCheckout.name}</span> is safe — on the last step, tap{" "}
                  <span className="text-[var(--aeterna-gold)]">Continue the Story</span> to pay, or change anything above first.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearPendingCheckout()
                    setPendingCheckout(null)
                  }}
                  className="mt-2 text-xs text-white/40 underline hover:text-white/60"
                >
                  Dismiss
                </button>
              </div>
            )}
            <AnimatePresence mode="wait" custom={stepSlideDir}>
            <motion.div
              key={wizardStep}
              custom={stepSlideDir}
              variants={WIZARD_STEP_SLIDE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={ARTISAN_SPRING}
              className="flex w-full flex-1 flex-col"
            >
              {wizardStep === 1 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-3 pt-4">
                  <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Their name</h2>
                  <p className="text-base text-white/45">What name should we use?</p>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim()) {
                        e.preventDefault()
                        goNext()
                      }
                    }}
                    placeholder="Their name"
                    className={`${inputBase} mt-8 text-2xl md:text-3xl`}
                    autoComplete="off"
                  />
                </div>
              )}

              {wizardStep === 2 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-4 pt-4 text-center">
                  <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">A face to remember</h2>
                  <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
                    {profilePreview
                      ? "Drag on the photo to adjust how it sits in the circle."
                      : "A photo helps people recognize them. Tap the circle to add one."}
                  </p>
                  {profilePreview ? (
                    <div className="mx-auto mt-10 flex flex-col items-center gap-4">
                      <div
                        role="img"
                        aria-label="Profile preview — drag to reposition"
                        className="touch-none cursor-grab active:cursor-grabbing select-none"
                        onPointerDown={handleProfilePanPointerDown}
                        onPointerMove={handleProfilePanPointerMove}
                        onPointerUp={handleProfilePanPointerEnd}
                        onPointerCancel={handleProfilePanPointerEnd}
                      >
                        <div className="h-48 w-48 overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-[var(--aeterna-gold)]/28 md:h-56 md:w-56">
                          <img
                            src={profilePreview}
                            alt=""
                            className="pointer-events-none h-full w-full object-cover"
                            style={{ objectPosition: `${profilePan.x}% ${profilePan.y}%` }}
                            draggable={false}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        className="text-sm text-white/45 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/70"
                      >
                        Choose a different photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => profileInputRef.current?.click()}
                      aria-label="Add a Spark of Memory"
                      className="group mx-auto mt-10 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-[var(--aeterna-gold)]/28 transition-all duration-300 ease-in-out active:scale-[0.98] md:h-56 md:w-56 hover:ring-[var(--aeterna-gold)]/45"
                    >
                      <div className="relative flex h-full w-full flex-col items-center justify-center gap-3">
                        <div
                          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_32%,rgba(197,160,89,0.22),transparent_58%)]"
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(244,241,234,0.06),transparent_70%)] opacity-90"
                          aria-hidden
                        />
                        <Flower2
                          className="relative z-10 h-[3.25rem] w-[3.25rem] text-[var(--aeterna-gold)]/70 md:h-14 md:w-14"
                          strokeWidth={1.1}
                          aria-hidden
                        />
                        <span className="relative z-10 text-[10px] tracking-[0.22em] uppercase text-white/40">
                          Add a Spark of Memory
                        </span>
                      </div>
                    </button>
                  )}
                  <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
                </div>
              )}

              {wizardStep === 3 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-10 pt-4">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      Honoring Their Journey
                    </h2>
                    <p className="text-base text-white/45 leading-relaxed">
                      Exact dates are lovely; a year alone is fine if that&apos;s what you have.
                    </p>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-6">
                      <h3 className={stepSectionTitleClass}>Born</h3>
                      <div className="grid grid-cols-3 gap-4 md:gap-5">
                        <select
                          ref={birthMRef}
                          value={birthM}
                          onChange={(e) => {
                            setBirthM(e.target.value)
                            if (e.target.value) focusNextField(birthDRef.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Birth month"
                        >
                          <option value="">MM</option>
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          ref={birthDRef}
                          value={birthD}
                          onChange={(e) => {
                            setBirthD(e.target.value)
                            if (e.target.value) focusNextField(birthYRef.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Birth day"
                        >
                          <option value="">DD</option>
                          {DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <select
                          ref={birthYRef}
                          value={birthY}
                          onChange={(e) => {
                            setBirthY(e.target.value)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Birth year"
                        >
                          <option value="">YYYY</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {birthComplete && (
                      <motion.div
                        key="at-rest-block"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={ARTISAN_SPRING}
                        className="w-full space-y-6"
                      >
                        <h3 className={stepSectionTitleClass}>At Rest</h3>
                        <div className="grid grid-cols-3 gap-4 md:gap-5">
                          <select
                            ref={deathMRef}
                            value={deathM}
                            onChange={(e) => {
                              setDeathM(e.target.value)
                              if (e.target.value) focusNextField(deathDRef.current)
                            }}
                            className={ghostDateSelectClass}
                            aria-label="Month of passing"
                          >
                            <option value="">MM</option>
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            ref={deathDRef}
                            value={deathD}
                            onChange={(e) => {
                              setDeathD(e.target.value)
                              if (e.target.value) focusNextField(deathYRef.current)
                            }}
                            className={ghostDateSelectClass}
                            aria-label="Day of passing"
                          >
                            <option value="">DD</option>
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <select
                            ref={deathYRef}
                            value={deathY}
                            onChange={(e) => setDeathY(e.target.value)}
                            className={ghostDateSelectClass}
                            aria-label="Year of passing"
                          >
                            <option value="">YYYY</option>
                            {YEARS.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-10 pt-4">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      A few words about them
                    </h2>
                    <p className="text-base text-white/45 leading-relaxed">
                      Share a short tribute, a memory, or what made them special. This can appear on the printed invitation below their dates — you can edit it later from settings.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="create-invitation-bio" className={fieldLabelClass}>
                      Remembrance
                    </label>
                    <textarea
                      ref={invitationBioRef}
                      id="create-invitation-bio"
                      value={invitationBio}
                      onChange={(e) => setInvitationBio(e.target.value)}
                      placeholder="Optional — a sentence or two, or a longer remembrance."
                      rows={6}
                      maxLength={2000}
                      className={textareaMemorial}
                      aria-label="Words of remembrance for the invitation"
                    />
                    <p className="text-xs text-white/30 tabular-nums">{invitationBio.length} / 2000</p>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-10 pt-4 text-center">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      Will you host a memorial service?
                    </h2>
                    <p className="text-base text-white/45 leading-relaxed max-w-md mx-auto">
                      If yes, you can add location, date, and time next. If not, we&apos;ll move on — you can always add details later from the memorial page.
                    </p>
                  </div>
                  <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setWillHostMemorialService(true)
                        setStepSlideDir(1)
                      }}
                      className={`cta-silk min-h-[52px] flex-1 rounded-[32px] border px-6 text-sm font-medium transition-colors duration-300 ease-in-out sm:min-h-[56px] ${
                        willHostMemorialService === true
                          ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold)]/15 text-[#f4f1ea] ring-1 ring-[var(--aeterna-gold)]/35"
                          : "border-white/[0.14] bg-transparent text-white/75 hover:bg-white/[0.06]"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWillHostMemorialService(false)
                        setStepSlideDir(1)
                      }}
                      className={`cta-silk min-h-[52px] flex-1 rounded-[32px] border px-6 text-sm font-medium transition-colors duration-300 ease-in-out sm:min-h-[56px] ${
                        willHostMemorialService === false
                          ? "border-[var(--aeterna-gold)] bg-[var(--aeterna-gold)]/15 text-[#f4f1ea] ring-1 ring-[var(--aeterna-gold)]/35"
                          : "border-white/[0.14] bg-transparent text-white/75 hover:bg-white/[0.06]"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 6 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-10 pt-4">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      Memorial Service
                    </h2>
                    <p className="text-base text-white/45 leading-relaxed">
                      Please input service details. You can skip and add later.
                    </p>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-6">
                      <h3 className={stepSectionTitleClass}>Location</h3>
                      <input
                        ref={locationInputRef}
                        id="memorial-location-opt"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            goNext()
                          }
                        }}
                        placeholder="Venue, address, or city"
                        autoComplete="off"
                        className={ghostLineInputClass}
                        aria-label="Location"
                      />
                    </div>

                    <div className="space-y-6">
                      <h3 className={stepSectionTitleClass}>Date</h3>
                      <div className="grid grid-cols-3 gap-4 md:gap-5">
                        <select
                          ref={ceremonyServiceMRef}
                          value={ceremonyServiceParts.m}
                          onChange={(e) => {
                            const m = e.target.value
                            const y = ceremonyServiceParts.y || String(CURRENT_YEAR)
                            const d = ceremonyServiceParts.d || "1"
                            setCeremonyDate(buildDateString(y, m, d))
                            if (m) focusNextField(ceremonyServiceDRef.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Service month"
                        >
                          <option value="">MM</option>
                          {MONTHS.map((mo) => (
                            <option key={mo} value={mo}>
                              {mo}
                            </option>
                          ))}
                        </select>
                        <select
                          ref={ceremonyServiceDRef}
                          value={ceremonyServiceParts.d}
                          onChange={(e) => {
                            const d = e.target.value
                            const y = ceremonyServiceParts.y || String(CURRENT_YEAR)
                            const m = ceremonyServiceParts.m || "1"
                            setCeremonyDate(buildDateString(y, m, d))
                            if (d) focusNextField(ceremonyServiceYRef.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Service day"
                        >
                          <option value="">DD</option>
                          {DAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <select
                          ref={ceremonyServiceYRef}
                          value={ceremonyServiceParts.y}
                          onChange={(e) => {
                            const y = e.target.value
                            const m = ceremonyServiceParts.m || "1"
                            const d = ceremonyServiceParts.d || "1"
                            setCeremonyDate(buildDateString(y, m, d))
                            if (y) focusNextField(ceremonyHour12Ref.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Service year"
                        >
                          <option value="">YYYY</option>
                          {CEREMONY_YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className={stepSectionTitleClass}>Time</h3>
                      <div className="grid grid-cols-3 gap-4 md:gap-5">
                        <select
                          ref={ceremonyHour12Ref}
                          value={ceremonyHour12}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            setCeremonyHour12(Number.isFinite(v) ? v : 2)
                            focusNextField(ceremonyMinuteRef.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Service hour"
                        >
                          {HOURS_12.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <select
                          ref={ceremonyMinuteRef}
                          value={ceremonyM}
                          onChange={(e) => {
                            setCeremonyM(e.target.value)
                            focusNextField(ceremonyPeriodRef.current)
                          }}
                          className={ghostDateSelectClass}
                          aria-label="Service minute"
                        >
                          {MINUTES.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          ref={ceremonyPeriodRef}
                          value={ceremonyPeriod}
                          onChange={(e) => setCeremonyPeriod(e.target.value as "AM" | "PM")}
                          className={ghostDateSelectClass}
                          aria-label="AM or PM"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 7 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-10 pt-4">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      Support Family
                    </h2>
                    <p className="text-base text-white/45 leading-relaxed">
                      Please add a support link. You can skip and add later.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <h3 className={stepSectionTitleClass}>Support</h3>
                    <input
                      ref={fundInputRef}
                      id="memorial-support-opt"
                      type="text"
                      inputMode="url"
                      value={fundLink}
                      onChange={(e) => setFundLink(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          goNext()
                        }
                      }}
                      placeholder="Fund or charity link"
                      autoComplete="off"
                      className={ghostLineInputClass}
                      aria-label="Support"
                    />
                  </div>
                </div>
              )}

              {wizardStep === 8 && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-10 pt-4">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      Claim your memorial
                    </h2>
                    <p className="text-base text-white/45 leading-relaxed">
                      Sign in so you can keep this memorial safe and change it anytime.
                    </p>
                  </div>
                  {signedIn ? (
                    <div className="rounded-[32px] border border-white/[0.1] bg-white/[0.04] px-5 py-4">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/35 mb-1">Signed in</p>
                      <p className="text-sm text-[#f4f1ea] font-medium truncate">{user?.email ?? user?.id ?? ""}</p>
                      <p className="mt-2 text-xs text-white/40">Next, choose how you&apos;d like to keep their page.</p>
                    </div>
                  ) : !authReady ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10" aria-live="polite">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[var(--aeterna-gold)]" />
                      <p className="text-sm text-white/45">Checking your account…</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleContinueWithGoogle}
                      disabled={googleLoading || signingOut}
                      className="mx-auto flex min-h-[56px] w-full max-w-sm items-center justify-center gap-3 rounded-[32px] border border-white/10 bg-[#030303]/55 px-6 py-3.5 text-[var(--landing-text-hero)] font-semibold transition-colors duration-300 ease-in-out hover:border-white/25 hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {googleLoading ? "Redirecting…" : "Continue the story"}
                    </button>
                  )}
                </div>
              )}

              {isPlanSummaryView && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-6 pt-4">
                  <div>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      You&apos;re almost there
                    </h2>
                    <p className="mt-2 text-base text-white/45">
                      When you&apos;re ready, we&apos;ll open their page — or go on to pay if you chose a paid plan.
                    </p>
                    <p className="mt-2 text-xs text-white/35">All prices in US dollars (USD).</p>
                  </div>
                  {(() => {
                    const summary = PLAN_SUMMARY[storagePlan]
                    return (
                      <div className="rounded-[32px] border border-white/10 ring-1 ring-[var(--aeterna-gold)]/22 bg-gradient-to-b from-[#030303]/50 to-[color:var(--landing-bg)] p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_64px_-28px_rgba(0,0,0,0.65)]">
                        <p className="text-[10px] tracking-[0.32em] uppercase text-[var(--aeterna-gold)]/85">Your selected plan</p>
                        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-[var(--font-serif)] text-2xl md:text-3xl text-[#f4f1ea] tracking-tight">
                                {summary.title}
                              </p>
                              {storagePlan === "premium" && (
                                <span className={planStatusTagClass}>Coming Soon</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-white/50">{summary.tagline}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-[var(--font-serif)] text-[var(--aeterna-gold)] tabular-nums">{summary.price}</p>
                            <p className="text-[10px] tracking-[0.2em] uppercase text-white/35 mt-1">USD</p>
                          </div>
                        </div>
                        <ul className="mt-6 space-y-3 border-t border-white/[0.08] pt-6">
                          {summary.benefits.map((line) => (
                            <li key={line} className="flex gap-3 text-sm leading-relaxed text-[#d4d0c8]">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--aeterna-gold)]/70" aria-hidden />
                              {line}
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() => setShowPlanChangeOptions(true)}
                          className="mt-8 w-full text-center text-sm text-white/45 underline-offset-4 hover:text-[var(--aeterna-gold)] hover:underline transition-colors"
                        >
                          Want to change your plan?
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )}

              {wizardStep === 9 && (!isPlanSummaryView || showPlanChangeOptions) && (
                <div className="flex min-h-[min(68vh,640px)] flex-col justify-center space-y-6 pt-4">
                  {planLockedFromUrl && showPlanChangeOptions && (
                    <button
                      type="button"
                      onClick={() => setShowPlanChangeOptions(false)}
                      className="text-sm text-white/45 hover:text-[var(--aeterna-gold)] transition-colors"
                    >
                      ← Back to plan summary
                    </button>
                  )}
                  <div>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Keep their light</h2>
                    <p className="mt-2 text-base text-white/45">
                      {planLockedFromUrl && showPlanChangeOptions
                        ? "Choose the plan that fits — you can always adjust later where your account allows."
                        : "One calm choice. Change later if you need."}
                    </p>
                    <p className="mt-2 text-xs text-white/35">All prices in US dollars (USD).</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {(
                      [
                        { id: "free" as const, title: "Sacred Window", sub: "7 days to gather. Gentle start.", price: "$0" },
                        { id: "plus" as const, title: "Eternal Legacy", sub: "Preserved forever. No expiration.", price: "$19.99" },
                        {
                          id: "premium" as const,
                          title: "The Eternal Film",
                          sub: "Eternal Legacy + AI Film Pre-Order",
                          price: "$39.99",
                        },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setStoragePlan(p.id)}
                        className={`rounded-[32px] border border-white/10 px-5 py-5 text-left transition-colors duration-300 ease-in-out ${
                          storagePlan === p.id ? "bg-[var(--aeterna-gold)]/12 ring-1 ring-[var(--aeterna-gold)]/40" : "bg-white/[0.03] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-lg text-[#f4f1ea]">{p.title}</span>
                            {p.id === "premium" ? (
                              <span className={planStatusTagClass}>Coming Soon</span>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-[var(--aeterna-gold)] tabular-nums">
                            {p.price} <span className="text-[10px] font-normal text-white/35">USD</span>
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-white/45">{p.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </>
        )}
      </div>

      {/* Fixed thumb zone — hidden on “Invitation ready” so it doesn’t stack above the success overlay */}
      {memorialType !== null && !showSuccessPopup && (
        <div className="!pointer-events-auto fixed bottom-0 left-0 right-0 !z-[9999] border-t-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.96)] px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-[20px]">
          <div className="mx-auto w-full max-w-lg space-y-3">
            {showFooterCreateError && (
              <p className="text-center text-sm text-red-400/90" role="alert">
                {createError}
              </p>
            )}
            <div className="relative !z-[9999] flex flex-row items-stretch gap-3 !pointer-events-auto">
              <button
                type="button"
                onClick={handleBack}
                className="cta-silk !pointer-events-auto relative !z-[9999] shrink-0 min-h-[52px] min-w-[5.5rem] rounded-[32px] border border-white/[0.14] bg-transparent px-4 text-sm font-medium tracking-wide text-white/65 hover:bg-white/[0.05] hover:text-white sm:min-h-[56px]"
              >
                Back
              </button>
              <motion.button
                type="button"
                disabled={loading || !canContinue()}
                onClick={onPrimaryPress}
                whileTap={{ scale: 0.98, boxShadow: "0 0 36px rgba(197, 160, 89, 0.42)" }}
                transition={ARTISAN_SPRING}
                className="cta-silk btn-tap min-h-[56px] flex-1 rounded-[32px] bg-[var(--aeterna-gold)] text-[color:var(--landing-bg)] text-sm font-semibold tracking-wide shadow-[0_8px_32px_-8px_rgba(197,160,89,0.45)] hover:bg-[var(--aeterna-gold-light)] hover:shadow-[0_12px_40px_-8px_rgba(197,160,89,0.5)] disabled:opacity-35 active:shadow-[0_4px_20px_-6px_rgba(197,160,89,0.35)] sm:min-h-[60px]"
              >
                {loading
                  ? "Creating…"
                  : wizardStep === 8 && !authReady
                    ? "Checking account…"
                    : wizardStep === 8 && !signedIn
                      ? "Continue the story"
                      : wizardStep < WIZARD_STEPS_FULL
                    ? "Continue the Story"
                    : isPlanSummaryView
                      ? storagePlan === "free"
                        ? "Continue the Story"
                        : "Continue the Story"
                      : storagePlan === "free"
                        ? "Continue the Story"
                        : "Continue the Story"}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSuccessPopup && createdSlug && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invitation-ready-title"
            initial={stepPresence.initial}
            animate={stepPresence.animate}
            exit={stepPresence.exit}
            transition={ARTISAN_SPRING}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-landing/90 backdrop-blur-xl"
            onClick={() => setShowSuccessPopup(false)}
          >
            <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 py-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
              <div
                className="card-landing-airy flex w-full max-w-lg flex-col gap-0 p-6 text-center md:p-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="shrink-0">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-white/40 mb-3">Invitation ready</p>
                  <h2 id="invitation-ready-title" className="text-landing-section-title mb-3">
                    Memorial for {name} is ready
                  </h2>
                  <p className="text-landing-body mb-8">
                    Share a thoughtful invitation — family and friends can add photos and stories from any device.
                  </p>
                </div>
                <div className="mx-auto mb-8 w-full max-w-md shrink-0">
                  <MemorialShareActions name={name} guestUrl={guestUrl} />
                </div>
                <div className="border-t border-white/[0.08] pt-8 shrink-0">
                  <MemorialInvitationCard
                    name={name}
                    slug={createdSlug}
                    guestUrl={guestUrl}
                    className="mx-auto w-full"
                    birthDate={invitationBirth}
                    deathDate={invitationDeath}
                    location={location}
                    ceremonyTime={invitationCeremony}
                    fundLink={fundLink}
                    profileImageUrl={profilePreview}
                    profileImagePan={profilePan}
                    remembranceBio={invitationBio.trim() || undefined}
                  />
                </div>
                <div className="mt-8 flex w-full shrink-0 flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/p/${createdSlug}`)}
                    className="btn-landing-gold flex min-h-[52px] w-full items-center justify-center px-6 text-base font-semibold"
                  >
                    View memorial
                  </button>
                </div>
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
    <Suspense fallback={<SacredWelcomeLoadingFallback />}>
      <CreateEventForm />
    </Suspense>
  )
}
