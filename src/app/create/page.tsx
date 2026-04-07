"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useRef, Suspense } from "react"
import { Flower2, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase/browser"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
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

/** URL `plan=` → internal tier. Legacy: `basic` = Plus; marketing: `forever` = Plus, `film` = Premium. */
function parsePlanQueryParam(param: string | null): StoragePlan | null {
  if (!param) return null
  const p = param.trim().toLowerCase()
  if (p === "basic" || p === "forever") return "plus"
  if (p === "premium" || p === "film") return "premium"
  if (p === "free") return "free"
  return null
}

const WIZARD_STEPS_FULL = 10

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
    title: "Sacred week",
    price: "$0",
    tagline: "A gentle window to gather what matters.",
    benefits: [
      "Seven days for family and friends to add photos and stories",
      "Upgrade anytime to keep their space forever",
    ],
  },
  plus: {
    title: "Forever",
    price: "$19.99",
    tagline: "Their memories stay with you — always.",
    benefits: ["Every photo and story preserved for good", "A permanent, shareable memorial home"],
  },
  premium: {
    title: "Film",
    price: "$39.99",
    tagline: "Forever storage plus a cinematic tribute.",
    benefits: ["Everything in Forever", "One AI tribute film woven from the moments you love most"],
  },
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ["00", "15", "30", "45"]

const inputBase =
  "w-full rounded-2xl bg-white/[0.04] px-5 py-4 text-lg text-[var(--landing-text-hero)] placeholder:text-white/35 outline-none transition-colors focus:bg-white/[0.07] focus:ring-1 focus:ring-[var(--aeterna-gold)]/30"

const selectBase =
  "w-full min-h-[52px] rounded-2xl bg-white/[0.04] px-4 py-3 text-base text-[var(--landing-text-hero)] outline-none transition-colors focus:bg-white/[0.07] focus:ring-1 focus:ring-[var(--aeterna-gold)]/30 appearance-none"

/** Memorial details: minimal border, landing-aligned */
const fieldLabelClass = "block text-[10px] tracking-[0.22em] uppercase text-white/40 mb-2"
const inputMemorial =
  "w-full rounded-xl bg-white/[0.035] px-4 py-3.5 text-base text-[#f4f1ea] placeholder:text-white/32 outline-none transition-colors focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--aeterna-gold)]/22 border border-white/[0.07]"
const inputMemorialDate =
  `${inputMemorial} [color-scheme:dark] min-h-[52px]`
const selectMemorial =
  "min-h-[52px] flex-1 min-w-0 rounded-xl bg-white/[0.035] px-3 py-3 text-sm text-[#f4f1ea] outline-none transition-colors focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--aeterna-gold)]/22 border border-white/[0.07] appearance-none"
/** Multiline optional fields — matches memorial inputs, high contrast */
const textareaMemorial =
  "w-full min-h-[100px] rounded-xl bg-white/[0.035] px-4 py-3.5 text-base text-[#f4f1ea] placeholder:text-white/32 outline-none transition-colors focus:bg-white/[0.06] focus:ring-1 focus:ring-[var(--aeterna-gold)]/22 border border-white/[0.07] resize-y"

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

/** Footer-only noise: never block Step 9 (account) or Step 10 (plan) with stale sign-in copy. */
function isMemorialSignInFooterNoise(message: string | null): boolean {
  if (!message) return false
  const m = message.toLowerCase()
  return (
    (m.includes("please sign in") && m.includes("memorial")) ||
    m.includes("sign in with google to create")
  )
}

function getRedirectUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://aeterna.com"
  if (typeof window !== "undefined") {
    const plan = new URLSearchParams(window.location.search).get("plan")
    if (plan) return `${window.location.origin}/create?plan=${encodeURIComponent(plan)}`
    return `${window.location.origin}/create`
  }
  return `${base.replace(/\/$/, "")}/create`
}

const slide = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -22 },
}

function CreateEventForm() {
  const { user, setUser, ready: authReady, refresh: refreshAuthUser } = useSupabaseUser()
  const signedIn = Boolean(user?.id)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [memorialType, setMemorialType] = useState<MemorialType | null>(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [name, setName] = useState("")
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)

  const [birthY, setBirthY] = useState("")
  const [birthM, setBirthM] = useState("")
  const [birthD, setBirthD] = useState("")
  const [deathY, setDeathY] = useState("")
  const [deathM, setDeathM] = useState("")
  const [deathD, setDeathD] = useState("")

  const [location, setLocation] = useState("")
  const [ceremonyDate, setCeremonyDate] = useState("")
  const [ceremonyHour12, setCeremonyHour12] = useState(2)
  const [ceremonyM, setCeremonyM] = useState("00")
  const [ceremonyPeriod, setCeremonyPeriod] = useState<"AM" | "PM">("PM")

  const [fundLink, setFundLink] = useState("")
  /** Printable invitation — words of remembrance */
  const [invitationBio, setInvitationBio] = useState("")
  /** When URL locked a plan, user can open full plan grid to switch. */
  const [showPlanChangeOptions, setShowPlanChangeOptions] = useState(false)

  const [collectionPeriod, setCollectionPeriod] = useState<"3" | "7" | "14" | "custom">("7")
  const [customExpiredAt, setCustomExpiredAt] = useState("")
  const [storagePlan, setStoragePlan] = useState<StoragePlan>("premium")
  const [loading, setLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckoutV1 | null>(null)
  const [showResumeToast, setShowResumeToast] = useState(false)
  const resumeToastAfterAuthRef = useRef(false)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const wizardStepRef = useRef(wizardStep)
  const memorialTypeRef = useRef(memorialType)
  const router = useRouter()
  const searchParams = useSearchParams()

  const planParam = searchParams.get("plan")?.trim().toLowerCase() ?? null
  const planLockedFromUrl = parsePlanQueryParam(planParam) !== null
  const effectiveWizardSteps = WIZARD_STEPS_FULL

  useEffect(() => {
    wizardStepRef.current = wizardStep
  }, [wizardStep])

  useEffect(() => {
    memorialTypeRef.current = memorialType
  }, [memorialType])

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
    const draft = readCreateDraft()
    const params = new URLSearchParams(window.location.search)
    const planQs = params.get("plan")?.trim().toLowerCase() ?? null
    const locked = parsePlanQueryParam(planQs) !== null
    const maxStep = WIZARD_STEPS_FULL

    if (draft?.v === 2) {
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
      {
        const cp = draft.collectionPeriod as "3" | "7" | "14" | "custom" | "funeral"
        setCollectionPeriod(cp === "funeral" ? "7" : cp)
      }
      setCustomExpiredAt(draft.customExpiredAt)
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
      v: 2,
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
      collectionPeriod,
      customExpiredAt,
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
    collectionPeriod,
    customExpiredAt,
    storagePlan,
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
        if (draft?.memorialType && draft.wizardStep === 9) {
          setWizardStep(10)
          writeCreateDraft({ ...draft, wizardStep: 10 })
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

  /** Wizard-level listener: Google popup closes with SIGNED_IN before React state catches up. */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN") return
      if (!session?.user) return
      await refreshAuthUser()
      router.refresh()
      if (memorialTypeRef.current && wizardStepRef.current === 9) {
        setWizardStep(10)
        const d = readCreateDraft()
        if (d?.memorialType) writeCreateDraft({ ...d, wizardStep: 10 })
      }
    })
    return () => subscription.unsubscribe()
  }, [refreshAuthUser, router])

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

  const handleContinueWithGoogle = async () => {
    if (memorialType) {
      const snapshot = buildCreateDraft(wizardStep)
      if (snapshot) writeCreateDraft(snapshot)
    }
    setGoogleLoading(true)
    setCreateError(null)
    const redirectTo = getRedirectUrl()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })
    setGoogleLoading(false)
    if (error) setCreateError(error.message)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearPendingCheckout()
    setPendingCheckout(null)
    setUser(null)
    if (wizardStep > 9) setWizardStep(9)
  }

  const resetFlow = () => {
    setShowSuccessPopup(false)
    setCreatedSlug(null)
    clearCreateDraft()
    clearPendingCheckout()
    setPendingCheckout(null)
    setMemorialType(null)
    setWizardStep(1)
    setName("")
    setProfileFile(null)
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
    setCollectionPeriod("7")
    setCustomExpiredAt("")
    const mapped = parsePlanQueryParam(
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plan") : null
    )
    setStoragePlan(mapped ?? "premium")
    setCreateError(null)
  }

  const pickType = (t: MemorialType) => {
    setMemorialType(t)
    setWizardStep(1)
    setCreateError(null)
  }

  const buildCreateDraft = (stepForDraft: number): CreateDraftV1 | null => {
    if (!memorialType) return null
    return {
      v: 2,
      memorialType,
      wizardStep: stepForDraft,
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
      collectionPeriod,
      customExpiredAt,
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
        return true
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
        return authReady
      case 10:
        return true
      case 4:
        if (collectionPeriod === "custom") return customExpiredAt.trim().length > 0
        return true
      default:
        return false
    }
  }

  const goBack = () => {
    setCreateError(null)
    if (!memorialType) return
    if (wizardStep <= 1) {
      setMemorialType(null)
      return
    }
    const nextStep = wizardStep - 1
    const d = buildCreateDraft(nextStep)
    if (d) writeCreateDraft(d)
    setWizardStep(nextStep)
  }

  const goNext = () => {
    if (!canContinue() || !memorialType) return
    setCreateError(null)
    if (wizardStep < effectiveWizardSteps) {
      const d = buildCreateDraft(wizardStep + 1)
      if (d) writeCreateDraft(d)
      setWizardStep((s) => s + 1)
    }
  }

  /** After Google OAuth, advance from Claim (9) → Plan (10) as soon as the session is confirmed. */
  useEffect(() => {
    if (wizardStep !== 9 || !signedIn || !memorialType || !authReady) return
    setWizardStep(10)
    const d = buildCreateDraft(10)
    if (d) writeCreateDraft(d)
  }, [wizardStep, signedIn, memorialType, authReady])

  const handleCreate = async () => {
    if (memorialType === null || wizardStep !== effectiveWizardSteps) return
    if (!canContinue()) return

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

    let customExpiredIso: string | undefined
    if (collectionPeriod === "custom" && customExpiredAt.trim()) {
      const parsed = new Date(customExpiredAt.trim())
      if (!Number.isNaN(parsed.getTime())) customExpiredIso = parsed.toISOString()
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
      collection_period:
        collectionPeriod === "custom"
          ? "custom"
          : collectionPeriod === "3"
            ? "3"
            : collectionPeriod === "14"
              ? "14"
              : "7",
      custom_expired_at: customExpiredIso,
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
    if (wizardStep === 9 && authReady && !signedIn) {
      void handleContinueWithGoogle()
      return
    }
    if (wizardStep < effectiveWizardSteps) goNext()
    else handleCreate()
  }

  const progress = memorialType ? wizardStep / effectiveWizardSteps : 0

  const isPlanSummaryView =
    memorialType !== null &&
    wizardStep === 10 &&
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
      (wizardStep === 9 || wizardStep === 10 || signedIn)
    )

  return (
    <div className="min-h-dvh bg-landing text-[var(--landing-text-hero)]">
      <AnimatePresence>
        {showResumeToast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="fixed left-4 right-4 z-[60] max-w-lg mx-auto pointer-events-none"
            style={{
              top: "max(0.75rem, calc(env(safe-area-inset-top, 0px) + 3.25rem))",
            }}
          >
            <p className="rounded-2xl border border-white/[0.1] bg-landing/95 px-4 py-3 text-center text-sm text-white/85 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md">
              Resuming from your last entry.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thin progress + step label (fixed so it stays visible while scrolling) */}
      {memorialType !== null && (
        <header className="fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top,0px)]">
          <div className="h-[2px] w-full overflow-hidden bg-white/[0.08]">
            <motion.div
              className="h-full bg-[var(--aeterna-gold)]"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 24 }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-landing/95 px-4 py-2.5 backdrop-blur-md md:px-8">
            <p className="text-[10px] tracking-[0.28em] uppercase text-white/45 tabular-nums">
              Step {wizardStep} of {effectiveWizardSteps}
            </p>
            {signedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="shrink-0 min-h-[36px] px-1 text-[10px] tracking-[0.2em] text-white/35 hover:text-white/55 uppercase transition-colors"
              >
                Sign out
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
            <p className="mb-12 text-base leading-relaxed text-white/45">A quiet space for someone you love.</p>
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => pickType("person")}
                className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-3xl bg-white/[0.03] py-8 transition-transform active:scale-[0.98] md:min-h-[180px] md:hover:bg-white/[0.05]"
              >
                <Sparkles className="h-10 w-10 text-[var(--aeterna-gold)]" strokeWidth={1} aria-hidden />
                <span className="text-sm text-white/80">Someone dear</span>
              </button>
              <button
                type="button"
                onClick={() => pickType("pet")}
                className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-3xl bg-white/[0.03] py-8 transition-transform active:scale-[0.98] md:min-h-[180px] md:hover:bg-white/[0.05]"
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
              <div className="mb-5 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
                <p>
                  Payment wasn&apos;t completed.{" "}
                  <span className="font-medium text-[#f4f1ea]">{pendingCheckout.name}</span> is already saved — use{" "}
                  <span className="text-[var(--aeterna-gold)]">Continue to payment</span> on the last step to try again, or edit
                  details below.
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
            <AnimatePresence mode="wait">
            <motion.div
              key={wizardStep}
              initial={slide.initial}
              animate={slide.animate}
              exit={slide.exit}
              transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full flex-1"
            >
              {wizardStep === 1 && (
                <div className="space-y-3 pt-4">
                  <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Their name</h2>
                  <p className="text-base text-white/45">What did you call them?</p>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Say it here"
                    className={`${inputBase} mt-8 text-2xl md:text-3xl`}
                    autoComplete="off"
                  />
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 pt-4 text-center">
                  <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">A face to remember</h2>
                  <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
                    A gentle portrait helps everyone recognize them in the memorial and enriches the tribute. Tap the circle to add a photograph.
                  </p>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    aria-label="Choose profile photograph"
                    className="group mx-auto mt-10 flex h-48 w-48 items-center justify-center overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-[var(--aeterna-gold)]/28 transition-transform active:scale-[0.98] md:h-56 md:w-56 hover:ring-[var(--aeterna-gold)]/45"
                  >
                    {profilePreview ? (
                      <img src={profilePreview} alt="" className="h-full w-full object-cover" />
                    ) : (
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
                          Eternal light
                        </span>
                      </div>
                    )}
                  </button>
                  <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-10 pt-4">
                  <div>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Their years</h2>
                    <p className="mt-2 text-base text-white/45">Rough is fine. It holds the story.</p>
                  </div>
                  <div className="space-y-6">
                    <p className="text-xs tracking-[0.2em] text-white/35">Born</p>
                    <div className="grid grid-cols-3 gap-3">
                      <select value={birthY} onChange={(e) => setBirthY(e.target.value)} className={selectBase}>
                        <option value="">Year</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <select value={birthM} onChange={(e) => setBirthM(e.target.value)} className={selectBase}>
                        <option value="">Month</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select value={birthD} onChange={(e) => setBirthD(e.target.value)} className={selectBase}>
                        <option value="">Day</option>
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-xs tracking-[0.2em] text-white/35">At rest</p>
                    <div className="grid grid-cols-3 gap-3">
                      <select value={deathY} onChange={(e) => setDeathY(e.target.value)} className={selectBase}>
                        <option value="">Year</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <select value={deathM} onChange={(e) => setDeathM(e.target.value)} className={selectBase}>
                        <option value="">Month</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select value={deathD} onChange={(e) => setDeathD(e.target.value)} className={selectBase}>
                        <option value="">Day</option>
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-6 pt-4">
                  <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Gathering Duration</h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                    {(
                      [
                        { v: "3" as const, n: "3" },
                        { v: "7" as const, n: "7", recommended: true as const },
                        { v: "14" as const, n: "14" },
                        { v: "custom" as const, n: null },
                      ] as const
                    ).map((opt) => {
                      const selected = collectionPeriod === opt.v
                      const isRec = "recommended" in opt && opt.recommended
                      const isCustom = opt.v === "custom"
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setCollectionPeriod(opt.v)}
                          className={`relative flex min-h-[72px] flex-col items-center justify-center rounded-xl px-3 py-3 text-center transition-colors active:scale-[0.98] sm:min-h-[76px] ${
                            selected
                              ? "border border-[var(--aeterna-gold)]/45 bg-[var(--aeterna-gold)]/[0.12] ring-1 ring-[var(--aeterna-gold)]/35"
                              : "border border-white/[0.09] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.05]"
                          }`}
                        >
                          {isRec && (
                            <span className="absolute right-2 top-1.5 rounded bg-[var(--aeterna-gold)]/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--aeterna-gold)]">
                              Recommended
                            </span>
                          )}
                          {isCustom ? (
                            <span className="text-[15px] font-bold leading-tight text-[#f4f1ea] sm:text-base">Custom Date</span>
                          ) : (
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-[1.65rem] font-bold tabular-nums leading-none text-[#f4f1ea] sm:text-[1.85rem]">
                                {opt.n}
                              </span>
                              <span className="text-sm font-semibold text-white/75">Days</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {collectionPeriod === "custom" && (
                    <input
                      type="datetime-local"
                      value={customExpiredAt}
                      onChange={(e) => setCustomExpiredAt(e.target.value)}
                      className={inputBase}
                    />
                  )}
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-6 pt-4">
                  <div>
                    <p className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">Optional</p>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Location &amp; support</h2>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">
                      If it helps, share where people can gather and how they can offer support.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="memorial-location" className={fieldLabelClass}>
                      Memorial location
                    </label>
                    <input
                      id="memorial-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Venue, address, or city"
                      autoComplete="street-address"
                      className={inputMemorial}
                    />
                  </div>
                  <div>
                    <label htmlFor="support-donation" className={fieldLabelClass}>
                      Support / donation link
                    </label>
                    <input
                      id="support-donation"
                      type="text"
                      inputMode="url"
                      value={fundLink}
                      onChange={(e) => setFundLink(e.target.value)}
                      placeholder="GoFundMe, charity page, or other link"
                      autoComplete="off"
                      className={inputMemorial}
                    />
                  </div>
                </div>
              )}

              {wizardStep === 6 && (
                <div className="space-y-6 pt-4">
                  <div>
                    <p className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">Optional</p>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Service date &amp; time</h2>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">
                      When you have a date, add it here — it will appear on the invitation.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="memorial-service-date" className={fieldLabelClass}>
                      Date
                    </label>
                    <input
                      id="memorial-service-date"
                      type="date"
                      value={ceremonyDate}
                      onChange={(e) => setCeremonyDate(e.target.value)}
                      className={inputMemorialDate}
                    />
                  </div>
                  <div>
                    <p className={fieldLabelClass}>Time</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <select
                        value={ceremonyHour12}
                        onChange={(e) => setCeremonyHour12(Number(e.target.value))}
                        className={selectMemorial}
                        aria-label="Hour"
                      >
                        {HOURS_12.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="text-white/35 text-sm">:</span>
                      <select
                        value={ceremonyM}
                        onChange={(e) => setCeremonyM(e.target.value)}
                        className={selectMemorial}
                        aria-label="Minutes"
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 w-full max-w-xs">
                      <p className={`${fieldLabelClass} mb-2`}>AM / PM</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCeremonyPeriod("AM")}
                          className={`min-h-[52px] rounded-xl border text-base font-semibold tracking-wide transition-colors ${
                            ceremonyPeriod === "AM"
                              ? "border-[var(--aeterna-gold)]/50 bg-[var(--aeterna-gold)]/15 text-[#f4f1ea] shadow-[0_0_0_1px_rgba(197,160,89,0.25)]"
                              : "border-white/[0.1] bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white/80"
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setCeremonyPeriod("PM")}
                          className={`min-h-[52px] rounded-xl border text-base font-semibold tracking-wide transition-colors ${
                            ceremonyPeriod === "PM"
                              ? "border-[var(--aeterna-gold)]/50 bg-[var(--aeterna-gold)]/15 text-[#f4f1ea] shadow-[0_0_0_1px_rgba(197,160,89,0.25)]"
                              : "border-white/[0.1] bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white/80"
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 7 && (
                <div className="space-y-6 pt-4">
                  <div>
                    <p className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">Optional</p>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">A life remembered</h2>
                    <p className="mt-3 text-lg text-[#f4f1ea]/90 leading-relaxed">
                      What&apos;s one thing you want the world to know about them?
                    </p>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">
                      This message will be the heart of the printable invitation.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="invitation-bio" className="sr-only">
                      Words of remembrance
                    </label>
                    <textarea
                      id="invitation-bio"
                      value={invitationBio}
                      onChange={(e) => setInvitationBio(e.target.value.slice(0, 2000))}
                      placeholder="Take your time. A sentence or two is enough."
                      rows={8}
                      className={`${textareaMemorial} min-h-[180px] text-base leading-relaxed`}
                    />
                    <p className="mt-2 text-right text-[10px] text-white/30 tabular-nums">{invitationBio.length}/2000</p>
                  </div>
                </div>
              )}

              {wizardStep === 8 && (
                <div className="space-y-6 pt-4">
                  <div>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">Review</h2>
                    <p className="mt-2 text-sm text-white/45 leading-relaxed">
                      Here&apos;s what we&apos;ll place on the invitation. You can always edit details later in your dashboard.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/[0.18] p-5 md:p-6 space-y-5 text-left">
                    <div>
                      <p className={fieldLabelClass}>Memorial location</p>
                      <p className="text-base text-[#e8e4dc] leading-relaxed">{location.trim() || "—"}</p>
                    </div>
                    <div className="border-t border-white/[0.06] pt-5">
                      <p className={fieldLabelClass}>Support / donation</p>
                      <p className="text-base text-[#e8e4dc] leading-relaxed break-all">{fundLink.trim() || "—"}</p>
                    </div>
                    <div className="border-t border-white/[0.06] pt-5">
                      <p className={fieldLabelClass}>Service</p>
                      <p className="text-base text-[#e8e4dc] leading-relaxed">
                        {invitationCeremony || "—"}
                      </p>
                    </div>
                    <div className="border-t border-white/[0.06] pt-5">
                      <p className={fieldLabelClass}>Words of remembrance</p>
                      <p className="text-base text-[#e8e4dc] leading-relaxed whitespace-pre-wrap">
                        {invitationBio.trim() || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 9 && (
                <div className="space-y-8 pt-4 text-center">
                  <div>
                    <p className="text-[10px] tracking-[0.28em] uppercase text-white/40 mb-3">Account</p>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      Claim your memorial
                    </h2>
                    <p className="mt-3 text-base text-white/45 leading-relaxed max-w-sm mx-auto">
                      Create your account to manage and protect this memorial.
                    </p>
                  </div>
                  {signedIn ? (
                    <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] px-5 py-4">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/35 mb-1">Signed in</p>
                      <p className="text-sm text-[#f4f1ea] font-medium truncate">{user?.email ?? user?.id ?? ""}</p>
                      <p className="mt-2 text-xs text-white/40">Continue to choose your plan.</p>
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
                      disabled={googleLoading}
                      className="mx-auto flex min-h-[56px] w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-white/[0.12] bg-black/35 px-6 py-3.5 text-[var(--landing-text-hero)] font-semibold transition-colors hover:border-white/25 hover:bg-white/[0.06] disabled:opacity-50"
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
                      {googleLoading ? "Redirecting…" : "Continue with Google"}
                    </button>
                  )}
                </div>
              )}

              {isPlanSummaryView && (
                <div className="space-y-6 pt-4">
                  <div>
                    <h2 className="font-[var(--font-serif)] text-2xl font-normal text-[#f4f1ea] md:text-3xl">
                      You&apos;re almost there
                    </h2>
                    <p className="mt-2 text-base text-white/45">
                      Review your plan. When you&apos;re ready, we&apos;ll create their space — or continue to secure checkout.
                    </p>
                    <p className="mt-2 text-xs text-white/35">All prices in US dollars (USD).</p>
                  </div>
                  {(() => {
                    const summary = PLAN_SUMMARY[storagePlan]
                    return (
                      <div className="rounded-2xl border border-[var(--aeterna-gold)]/22 bg-gradient-to-b from-black/35 to-[color:var(--landing-bg)] p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_64px_-28px_rgba(0,0,0,0.65)]">
                        <p className="text-[10px] tracking-[0.32em] uppercase text-[var(--aeterna-gold)]/85">Your selected plan</p>
                        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <p className="font-[var(--font-serif)] text-2xl md:text-3xl text-[#f4f1ea] tracking-tight">{summary.title}</p>
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

              {wizardStep === 10 && (!isPlanSummaryView || showPlanChangeOptions) && (
                <div className="space-y-6 pt-4">
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
                        { id: "free" as const, title: "Sacred week", sub: "Seven days to gather. Peaceful start.", price: "$0" },
                        { id: "plus" as const, title: "Forever", sub: "Keep every photo, always.", price: "$19.99" },
                        { id: "premium" as const, title: "Film", sub: "Everything in Forever, plus one AI tribute film.", price: "$39.99" },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setStoragePlan(p.id)}
                        className={`rounded-2xl px-5 py-5 text-left transition-colors ${
                          storagePlan === p.id ? "bg-[var(--aeterna-gold)]/12 ring-1 ring-[var(--aeterna-gold)]/40" : "bg-white/[0.03] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-lg text-[#f4f1ea]">{p.title}</span>
                          <span className="text-[var(--aeterna-gold)] tabular-nums">
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

      {/* Fixed thumb zone */}
      {memorialType !== null && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-landing/95 backdrop-blur-xl px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-lg space-y-3">
            {showFooterCreateError && (
              <p className="text-center text-sm text-red-400/90" role="alert">
                {createError}
              </p>
            )}
            <div className="flex flex-row items-stretch gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="shrink-0 min-h-[52px] min-w-[5.5rem] rounded-2xl border border-white/[0.14] bg-transparent px-4 text-sm font-medium tracking-wide text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white disabled:opacity-40 sm:min-h-[56px]"
              >
                Back
              </button>
              <motion.button
                type="button"
                disabled={loading || !canContinue()}
                onClick={onPrimaryPress}
                className="min-h-[52px] flex-1 rounded-2xl bg-[var(--aeterna-gold)] text-[color:var(--landing-bg)] text-sm font-semibold tracking-wide transition-opacity disabled:opacity-35 sm:min-h-[56px]"
              >
                {loading
                  ? "Creating…"
                  : wizardStep === 9 && !authReady
                    ? "Checking account…"
                    : wizardStep === 9 && !signedIn
                      ? "Continue with Google"
                      : wizardStep < effectiveWizardSteps
                    ? "Continue"
                    : isPlanSummaryView
                      ? storagePlan === "free"
                        ? "Confirm & create"
                        : "Confirm & launch"
                      : storagePlan === "free"
                        ? "Create memorial"
                        : "Continue to payment"}
              </motion.button>
            </div>
            {wizardStep >= 5 && wizardStep <= 8 && (
              <button
                type="button"
                onClick={() => {
                  setCreateError(null)
                  goNext()
                }}
                disabled={loading}
                className="w-full min-h-[48px] rounded-2xl border border-white/[0.12] bg-transparent px-4 text-sm font-medium tracking-wide text-white/55 transition-colors hover:border-white/[0.2] hover:bg-white/[0.04] hover:text-white/80 disabled:opacity-40"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSuccessPopup && createdSlug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-landing/90 backdrop-blur-xl"
          >
            <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 py-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8">
              <div className="card-landing-airy flex w-full max-w-lg flex-col gap-0 p-6 text-center md:p-10">
                <div className="shrink-0">
                  <p className="text-[10px] tracking-[0.35em] uppercase text-white/40 mb-3">Invitation ready</p>
                  <h2 className="text-landing-section-title mb-3">Memorial for {name} is ready</h2>
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
    <Suspense fallback={<div className="min-h-dvh bg-landing flex items-center justify-center text-landing-label">Loading…</div>}>
      <CreateEventForm />
    </Suspense>
  )
}
