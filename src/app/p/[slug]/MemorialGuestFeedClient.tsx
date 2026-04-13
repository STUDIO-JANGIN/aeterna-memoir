"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { supabase } from "@/lib/supabase/browser"
import imageCompression from "browser-image-compression"
import { createStoryAction } from "@/app/actions/createStory"
import { heartStoryAction, unheartStoryAction } from "@/app/actions/heartStory"
import { subscribeNotificationAction } from "@/app/actions/subscribeNotification"
import { subscribeVisitorAction } from "@/app/actions/subscribeVisitor"
import { createCheckoutSessionAction } from "@/app/actions/createCheckoutSession"
import { createDonationCheckoutSessionAction } from "@/app/actions/createDonationCheckoutSession"
import { getDonationStatsAction } from "@/app/actions/getDonationStats"
import { getDonationAmountByLocale } from "@/lib/checkout"
import { formatLongDate } from "@/lib/formatDate"
import { getAppBaseUrl } from "@/lib/appUrl"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { isMemorialOwner } from "@/lib/memorialOwnership"
import { resolveProfileImageUrl } from "@/lib/profileImageUrl"
import {
  getPublicApprovedStoriesForEventAction,
  getPublicMemorialPageDataAction,
  getPublicSelectedTeaserStoriesAction,
} from "@/app/actions/getPublicMemorialPageData"
import { LegalFormCaption } from "@/components/LegalFormCaption"
import { StoryMemoryDrawer } from "@/components/memorial/StoryMemoryDrawer"
import {
  MemorialTrialCountdown,
  type MemorialTrialBannerCopy,
} from "@/components/memorial/MemorialTrialCountdown"
import { buildGlobalShareMessage } from "@/components/MemorialShareActions"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappInvite"
import { coerceIdString, parseUuidString } from "@/lib/uuid"
import { ARTISAN_SPRING, artisanPresence } from "@/lib/artisanMotion"
import { OptimisticImage } from "@/components/Upload"
import { eventRowIsPaidMemorial, PAID_MEMORIAL_DEADLINE_MS } from "@/lib/paidMemorialDeadlines"
import { resolveMemorialBackgroundUrl } from "@/lib/resolveMemorialBackgroundUrl"

function normalizeStoryIdForHearts(raw: string): string {
  return parseUuidString(raw) ?? coerceIdString(raw)
}

type FeedEvent = {
  id: string
  name: string | null
  profile_image: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
  flower_link: string | null
  collection_end_at: string | null
  expired_at: string | null
  is_paid: boolean | null
  created_at: string | null
  film_url: string | null
  /** Luma AI full tribute (preferred when set) */
  full_film_url: string | null
  /** Five ~10s clips when set */
  tribute_film_urls?: (string | null)[] | null
  creator_email: string | null
  creator_user_id: string | null
  photo_deadline: string | null
  status: string | null
  is_premium: boolean | null
  tier: string | null
  bank_info: string | null
  invite_pdf_url: string | null
  invite_pdf_urls?: Record<string, string> | null
  invitation_bio: string | null
  memorial_background_image: string | null
}

// Deadline time: prefer expired_at, then collection_end_at, else created_at + 7 days.
function getDeadlineMs(e: FeedEvent): number {
  if (eventRowIsPaidMemorial(e)) return PAID_MEMORIAL_DEADLINE_MS
  if (e.expired_at) return new Date(e.expired_at).getTime()
  if (e.collection_end_at) return new Date(e.collection_end_at).getTime()
  const created = e.created_at ? new Date(e.created_at).getTime() : Date.now()
  return created + 7 * 24 * 60 * 60 * 1000
}

// Photo submission deadline: prefer photo_deadline, fallback collection_end_at.
function getPhotoDeadlineMs(e: FeedEvent): number {
  if (eventRowIsPaidMemorial(e)) return PAID_MEMORIAL_DEADLINE_MS
  if (e.photo_deadline) return new Date(e.photo_deadline).getTime()
  return getDeadlineMs(e)
}

type Story = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  thumb_url?: string | null
  likes_count: number | null
  created_at: string
}

type TeaserStory = { id: string; image_url: string | null }

type PageProps = {
  params: Promise<{ slug: string }>
}

const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true"

const DONATION_STORAGE_KEY = (s: string) => `aeterna_donation_${s}`

export default function GuestFeedPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug
  const router = useRouter()
  const searchParams = useSearchParams()

  const [event, setEvent] = useState<FeedEvent | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  /** True while polling after first miss (e.g. post-Stripe webhook delay). */
  const [loadSyncing, setLoadSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  /** 1 = name, 2 = photo, 3 = story */
  const [shareStep, setShareStep] = useState(1)
  const [memoryAuthorName, setMemoryAuthorName] = useState("")
  const [memoryStoryText, setMemoryStoryText] = useState("")
  const [memoryPhotoFile, setMemoryPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  /** Set after createStory succeeds — swaps optimistic blob for Supabase CDN URL. */
  const [photoPermanentUrl, setPhotoPermanentUrl] = useState<string | null>(null)
  const memoryFileInputRef = useRef<HTMLInputElement>(null)
  const adminForbiddenHandledRef = useRef(false)
  const shareFormOpenedRef = useRef(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set())
  const [heartBusyId, setHeartBusyId] = useState<string | null>(null)
  const heartedStorageKey = slug ? `aeterna_hearts_${slug}` : null
  const [likesMap, setLikesMap] = useState<Record<string, number>>({})
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [selectedStories, setSelectedStories] = useState<TeaserStory[]>([])
  const [teaserIndex, setTeaserIndex] = useState(0)
  const [teaserCycle, setTeaserCycle] = useState(0)
  const [notificationSubmitted, setNotificationSubmitted] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [showPaymentComingSoon, setShowPaymentComingSoon] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [viewerStory, setViewerStory] = useState<Story | null>(null)
  /** Signed-in user for owner-only UI (admin link). */
  const [sessionUser, setSessionUser] = useState<{ id: string; email: string | null } | null>(null)
  const [showPremiumBlurPopup, setShowPremiumBlurPopup] = useState(false)
  const [hasDonatedForBank, setHasDonatedForBank] = useState(false)
  const [revealedBankWithoutDonation, setRevealedBankWithoutDonation] = useState(false)
  const [donationCheckoutLoading, setDonationCheckoutLoading] = useState(false)
  const [showDonationThankYou, setShowDonationThankYou] = useState(false)
  const [platformTipChecked, setPlatformTipChecked] = useState(true)
  const { app: tx, locale: appLocale } = useLandingLocale()
  const memorialTrialBannerCopy = useMemo<MemorialTrialBannerCopy>(
    () => ({
      preserveLegacyHeader: tx.memorial.preserveLegacyHeader,
      trialGatheringTimerLabel: tx.memorial.trialGatheringTimerLabel,
      trialCountdownFromMs: tx.memorial.trialCountdownFromMs,
      trialUpgradePart1: tx.memorial.trialUpgradePart1,
      trialUpgradeLinkLabel: tx.memorial.trialUpgradeLinkLabel,
      trialUpgradePart2: tx.memorial.trialUpgradePart2,
    }),
    [tx.memorial],
  )
  /** Donation checkout uses KRW only for Korean; other app locales use USD path. */
  const donationLocale: "ko" | "en" = appLocale === "ko" ? "ko" : "en"
  const [showUploadSuccessToast, setShowUploadSuccessToast] = useState(false)
  const [showAfterUploadEmailField, setShowAfterUploadEmailField] = useState(false)
  const uploadSuccessAutoCloseRef = useRef<number | null>(null)
  const [showAdminForbiddenToast, setShowAdminForbiddenToast] = useState(false)
  const [afterUploadEmail, setAfterUploadEmail] = useState("")
  const [afterUploadLoading, setAfterUploadLoading] = useState(false)
  const [afterUploadError, setAfterUploadError] = useState<string | null>(null)
  const [afterUploadDone, setAfterUploadDone] = useState(false)
  /** Story id from the upload just completed — passed to visitor email signup so we can notify when approved. */
  const [pendingVisitorStoryId, setPendingVisitorStoryId] = useState<string | null>(null)
  const [donationStats, setDonationStats] = useState<{ count: number; list: { displayLabel: string }[]; recentCount1h: number } | null>(null)
  const donationAmountLabel = useMemo(() => {
    const { currency, unit_amount } = getDonationAmountByLocale(donationLocale)
    return currency === "krw"
      ? `₩${unit_amount.toLocaleString("en-US")}`
      : `US$${(unit_amount / 100).toFixed(2)}`
  }, [donationLocale])

  const dualRouteShareText = useMemo(() => {
    if (!event) return ""
    const base = typeof window !== "undefined" ? window.location.origin : getAppBaseUrl()
    const name = event.name?.trim() || "our loved one"
    const guestUrl = `${base}/p/${encodeURIComponent(slug)}`
    return buildGlobalShareMessage(name, guestUrl)
  }, [event, slug])

  const [shareModalOpen, setShareModalOpen] = useState(false)

  const closeShareModal = useCallback(() => {
    setShareModalOpen(false)
  }, [])

  useEffect(() => {
    if (!shareModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [shareModalOpen])

  useEffect(() => {
    if (!shareModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShareModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shareModalOpen, closeShareModal])

  const handleRankShareWhatsApp = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      const text =
        dualRouteShareText || (typeof window !== "undefined" ? window.location.href : "")
      openWhatsAppWithPrefilledText(text)
      closeShareModal()
    },
    [dualRouteShareText, closeShareModal],
  )

  const handleRankShareMessage = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      const text = dualRouteShareText || (typeof window !== "undefined" ? window.location.href : "")
      window.location.href = `sms:?&body=${encodeURIComponent(text)}`
      closeShareModal()
    },
    [dualRouteShareText, closeShareModal],
  )

  const handleRankShareCopy = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      const url = typeof window !== "undefined" ? window.location.href : ""
      void navigator.clipboard.writeText(url).then(() => {
        if (typeof window !== "undefined") window.alert(tx.memorial.linkCopied)
        closeShareModal()
      })
    },
    [closeShareModal, tx.memorial.linkCopied],
  )

  /** WhatsApp / Message / Copy in the share modal. */
  const shareChannelBtnBase =
    "inline-flex min-h-[40px] w-full min-w-0 items-center justify-center rounded-full px-1.5 text-[10px] font-medium tracking-wide touch-manipulation active:scale-[0.98] sm:min-h-[36px]"

  const [photoDeadlineRemainingMs, setPhotoDeadlineRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    if (!event) return
    const deadline = getDeadlineMs(event)
    const tick = () => {
      const left = deadline - Date.now()
      setRemainingMs(left <= 0 ? 0 : left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [event])

  useEffect(() => {
    if (!event) return
    const deadline = getPhotoDeadlineMs(event)
    const tick = () => {
      const left = deadline - Date.now()
      setPhotoDeadlineRemainingMs(left <= 0 ? 0 : left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [event])

  const isClosed = event !== null && remainingMs !== null && remainingMs <= 0
  const isPhotoDeadlinePassed = event !== null && photoDeadlineRemainingMs !== null && photoDeadlineRemainingMs <= 0
  const isExpired = isPhotoDeadlinePassed
  const isPaidMemorial = event ? eventRowIsPaidMemorial(event) : false
  const isPremiumTier = (event?.tier ?? "").trim().toLowerCase() === "premium"
  const showBlurByDeadline = isExpired && !isPaidMemorial
  const tributeFilmUrlsList =
    (event?.tribute_film_urls ?? []).filter((u): u is string => typeof u === "string" && u.length > 0)
  const tributeFilmUrl =
    tributeFilmUrlsList[0] ??
    (event?.full_film_url && event.full_film_url.length > 0 ? event.full_film_url : null) ??
    event?.film_url ??
    null
  const tributeClipsToPlay =
    tributeFilmUrlsList.length > 0
      ? tributeFilmUrlsList
      : tributeFilmUrl
        ? [tributeFilmUrl]
        : []
  // Show cinematic film when URL exists: Premium can view as soon as Luma finishes; others when collection closed.
  const filmReleased = tributeClipsToPlay.length > 0 && (isClosed || isPremiumTier)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      setSessionUser(u ? { id: u.id, email: u.email ?? null } : null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user
      setSessionUser(u ? { id: u.id, email: u.email ?? null } : null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return
    try {
      setRevealedBankWithoutDonation(sessionStorage.getItem(`aeterna_reveal_no_donate_${slug}`) === "1")
    } catch {
      // ignore
    }
  }, [slug])

  useEffect(() => {
    adminForbiddenHandledRef.current = false
    shareFormOpenedRef.current = false
  }, [slug])

  // Admin access denied: server redirects here with ?admin_forbidden=1
  useEffect(() => {
    if (typeof window === "undefined" || !slug || adminForbiddenHandledRef.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("admin_forbidden") !== "1") return
    adminForbiddenHandledRef.current = true
    setShowAdminForbiddenToast(true)
    const hide = window.setTimeout(() => setShowAdminForbiddenToast(false), 6000)
    router.replace(`/p/${encodeURIComponent(slug)}`, { scroll: false })
    return () => window.clearTimeout(hide)
  }, [slug, router])

  // Donation success return flow: check URL/localStorage and immediately unlock with a toast.
  useEffect(() => {
    if (typeof window === "undefined" || !slug) return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("donation") === "success"
    const fromStorage = localStorage.getItem(DONATION_STORAGE_KEY(slug)) === "1"
    if (fromUrl || fromStorage) {
      setHasDonatedForBank(true)
      if (fromUrl) {
        try {
          localStorage.setItem(DONATION_STORAGE_KEY(slug), "1")
        } catch {
          // ignore
        }
        setShowDonationThankYou(true)
        const t = setTimeout(() => setShowDonationThankYou(false), 4000)
        router.replace(`/p/${encodeURIComponent(slug)}`, { scroll: false })
        return () => clearTimeout(t)
      }
    }
  }, [slug, router])

  // Prevent duplicate hearts: restore already-hearted story IDs from localStorage.
  useEffect(() => {
    if (!heartedStorageKey || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(heartedStorageKey)
      if (!raw) return
      const ids = JSON.parse(raw) as string[]
      if (Array.isArray(ids)) {
        setHeartedIds(new Set(ids.map((id) => normalizeStoryIdForHearts(String(id))).filter(Boolean)))
      }
    } catch {
      // ignore
    }
  }, [heartedStorageKey])

  useEffect(() => {
    let cancelled = false
    const POLL_MS = 450
    const POLL_TOTAL_MS = 3200

    const getMemorial = async (id: string) => {
      try {
        const data = await getPublicMemorialPageDataAction(id)
        if (!data || !data.ok) {
          return null
        }
        return data
      } catch (e) {
        console.error("Memorial load error:", e)
        return null
      }
    }

    const fetchData = async () => {
      if (!slug) return
      const slugTrim = slug.trim()
      setLoading(true)
      setLoadSyncing(false)
      setError(null)

      const applyResult = (eventData: {
        id: string
        name: string | null
        profile_image: string | null
        birth_date: string | null
        death_date: string | null
        location?: string | null
        ceremony_time?: string | null
        flower_link?: string | null
        collection_end_at: string | null
        expired_at?: string | null
        is_paid: boolean | null
        created_at: string | null
        film_url: string | null
        full_film_url: string | null
        tribute_film_urls?: (string | null)[] | null
        creator_email: string | null
        creator_user_id: string | null
        photo_deadline: string | null
        status: string | null
        is_premium: boolean | null
        tier: string | null
        bank_info: string | null
        invite_pdf_url?: string | null
        invite_pdf_urls?: Record<string, string> | null
        invitation_bio?: string | null
        memorial_background_image?: string | null
      }, list: Story[]) => {
        setEvent({
          id: eventData.id,
          name: eventData.name ?? null,
          profile_image: eventData.profile_image ?? null,
          birth_date: eventData.birth_date ?? null,
          death_date: eventData.death_date ?? null,
          location: eventData.location ?? null,
          ceremony_time: eventData.ceremony_time ?? null,
          flower_link: eventData.flower_link ?? null,
          collection_end_at: eventData.collection_end_at ?? null,
          expired_at: eventData.expired_at ?? eventData.collection_end_at ?? null,
          is_paid: eventData.is_paid === true,
          created_at: eventData.created_at ?? null,
          film_url: eventData.film_url ?? null,
          full_film_url: eventData.full_film_url ?? null,
          tribute_film_urls: eventData.tribute_film_urls ?? null,
          creator_email: eventData.creator_email ?? null,
          creator_user_id: eventData.creator_user_id ?? null,
          photo_deadline: eventData.photo_deadline ?? null,
          status: eventData.status ?? null,
          is_premium: eventData.is_premium ?? false,
          tier: eventData.tier ?? null,
          bank_info: eventData.bank_info ?? null,
          invite_pdf_url: eventData.invite_pdf_url ?? null,
          invite_pdf_urls: eventData.invite_pdf_urls ?? null,
          invitation_bio: eventData.invitation_bio ?? null,
          memorial_background_image: eventData.memorial_background_image ?? null,
        })
        const storiesNormalized: Story[] = list.map((s) => ({
          ...s,
          id: coerceIdString(s.id),
          created_at:
            typeof s.created_at === "string" ? s.created_at : String(s.created_at ?? ""),
        }))
        setStories(storiesNormalized)
        const map: Record<string, number> = {}
        storiesNormalized.forEach((s) => {
          const k = normalizeStoryIdForHearts(s.id)
          if (k) map[k] = s.likes_count ?? 0
        })
        setLikesMap(map)
      }

      try {
        const deadline = Date.now() + POLL_TOTAL_MS
        let attempt = 0

        while (!cancelled && Date.now() < deadline) {
          attempt += 1
          const result = await getMemorial(slugTrim)
          if (cancelled) return

          if (result && result.ok) {
            applyResult(result.event, result.stories as Story[])
            setLoading(false)
            setLoadSyncing(false)
            return
          }

          if (attempt === 1) setLoadSyncing(true)

          const wait = Math.min(POLL_MS, deadline - Date.now())
          if (wait <= 0) break
          await new Promise((r) => setTimeout(r, wait))
        }

        if (cancelled) return
        setError(tx.memorial.errors.memorialNotFound)
        setEvent(null)
        setStories([])
        setLoading(false)
        setLoadSyncing(false)
      } catch (e) {
        console.error("CRITICAL DB ERROR (fetchData outer):", e)
        if (cancelled) return
        setError(tx.memorial.errors.loadFailed)
        setEvent(null)
        setStories([])
        setLoading(false)
        setLoadSyncing(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [slug, tx.memorial.errors])

  // When collection is closed, fetch Final Selection for teaser (3–5 images)
  useEffect(() => {
    if (!event?.id || !isClosed) return
    const loadSelected = async () => {
      const rows = await getPublicSelectedTeaserStoriesAction(event.id)
      setSelectedStories(rows as TeaserStory[])
    }
    loadSelected()
  }, [event?.id, isClosed])

  // Teaser carousel: advance every 5s, bump cycle so animation re-runs
  useEffect(() => {
    if (selectedStories.length <= 1) return
    const id = setInterval(() => {
      setTeaserIndex((i) => (i + 1) % selectedStories.length)
      setTeaserCycle((c) => c + 1)
    }, 5000)
    return () => clearInterval(id)
  }, [selectedStories.length])

  // Donation social proof (completed platform_tip payments only)
  useEffect(() => {
    if (!slug) return
    getDonationStatsAction(slug).then((res) => {
      if (res.ok) setDonationStats({ count: res.count, list: res.list, recentCount1h: res.recentCount1h })
    })
  }, [slug])

  const handleOpenForm = () => {
    setShareStep(1)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setShareStep(1)
    setMemoryAuthorName("")
    setMemoryStoryText("")
    setMemoryPhotoFile(null)
    setPhotoPermanentUrl(null)
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setSubmitError(null)
  }

  // Open upload flow when shared link includes ?share=1 (matches Message / Copy share text).
  useEffect(() => {
    if (typeof window === "undefined" || !slug || shareFormOpenedRef.current) return
    if (searchParams.get("share") !== "1") return
    shareFormOpenedRef.current = true
    setShareStep(1)
    setFormOpen(true)
    router.replace(`/p/${encodeURIComponent(slug)}`, { scroll: false })
  }, [slug, searchParams, router])

  const handleMemoryPhotoChange = (file: File | null) => {
    setPhotoPermanentUrl(null)
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    if (!file) {
      setMemoryPhotoFile(null)
      return
    }
    setMemoryPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  const goShareNext = () => {
    setSubmitError(null)
    if (shareStep === 1) {
      if (!memoryAuthorName.trim()) {
        setSubmitError(tx.memorial.errors.nameRequired)
        return
      }
      setShareStep(2)
      return
    }
    if (shareStep === 2) {
      if (!memoryPhotoFile) {
        setSubmitError(tx.memorial.errors.photoRequired)
        return
      }
      setShareStep(3)
    }
  }

  const goShareBack = () => {
    setSubmitError(null)
    setShareStep((s) => Math.max(1, s - 1))
  }

  const dismissUploadSuccessToast = useCallback(() => {
    if (uploadSuccessAutoCloseRef.current) {
      clearTimeout(uploadSuccessAutoCloseRef.current)
      uploadSuccessAutoCloseRef.current = null
    }
    setShowUploadSuccessToast(false)
    setShowAfterUploadEmailField(false)
    setAfterUploadEmail("")
    setAfterUploadError(null)
    setAfterUploadDone(false)
    setPendingVisitorStoryId(null)
  }, [])

  /** Auto-close the success toast, but never while the guest is entering an email (mobile keyboard / slow typists). */
  useEffect(() => {
    if (!showUploadSuccessToast) return
    if (uploadSuccessAutoCloseRef.current) {
      clearTimeout(uploadSuccessAutoCloseRef.current)
      uploadSuccessAutoCloseRef.current = null
    }
    if (showAfterUploadEmailField && !afterUploadDone) {
      return
    }
    const delayMs = afterUploadDone ? 12_000 : 14_000
    uploadSuccessAutoCloseRef.current = window.setTimeout(() => {
      uploadSuccessAutoCloseRef.current = null
      dismissUploadSuccessToast()
    }, delayMs)
    return () => {
      if (uploadSuccessAutoCloseRef.current) {
        clearTimeout(uploadSuccessAutoCloseRef.current)
        uploadSuccessAutoCloseRef.current = null
      }
    }
  }, [showUploadSuccessToast, showAfterUploadEmailField, afterUploadDone, dismissUploadSuccessToast])

  const handleAfterUploadSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setAfterUploadLoading(true)
    setAfterUploadError(null)
    try {
      const result = await subscribeVisitorAction(event.id, afterUploadEmail, "email", pendingVisitorStoryId)
      setAfterUploadLoading(false)
      if (result.ok) {
        setAfterUploadDone(true)
      } else {
        setAfterUploadError(result.error)
      }
    } catch (err) {
      setAfterUploadLoading(false)
      setAfterUploadError(err instanceof Error ? err.message : tx.memorial.errors.subscribeFailed)
    }
  }

  const handleSubmitStory = async () => {
    if (!event) return
    if (!memoryPhotoFile) {
      setSubmitError(tx.memorial.errors.photoRequired)
      return
    }
    if (!memoryAuthorName.trim() || !memoryStoryText.trim()) {
      setSubmitError(tx.memorial.errors.storyRequired)
      return
    }

    setSubmitLoading(true)
    setSubmitError(null)
    try {
      const mainOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp" as const,
      }
      const thumbOptions = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 320,
        useWebWorker: true,
        fileType: "image/webp" as const,
      }

      const compressedMain = await imageCompression(memoryPhotoFile, mainOptions)
      const compressedThumb = await imageCompression(memoryPhotoFile, thumbOptions)

      const payload = new FormData()
      payload.set("slug", slug)
      payload.set("eventId", event.id)
      payload.set("author_name", memoryAuthorName.trim())
      payload.set("story_text", memoryStoryText.trim())
      payload.set("image", new File([compressedMain], "photo.webp", { type: "image/webp" }))
      payload.set("thumb", new File([compressedThumb], "photo-thumb.webp", { type: "image/webp" }))

      const result = await createStoryAction(payload)
      if (result?.ok && result?.storyId && typeof window !== "undefined") {
        if (result.imageUrl) {
          setPhotoPermanentUrl(result.imageUrl)
          setPhotoPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
        }
        try {
          const stored: Record<string, string> = {}
          const raw = localStorage.getItem("aeterna_my_stories")
          if (raw) {
            const parsed = JSON.parse(raw) as Record<string, string>
            Object.assign(stored, parsed)
          }
          stored[event.id] = result.storyId
          localStorage.setItem("aeterna_my_stories", JSON.stringify(stored))
        } catch {
          // ignore
        }
        setAfterUploadEmail("")
        setAfterUploadError(null)
        setAfterUploadDone(false)
        setShowAfterUploadEmailField(false)
        setPendingVisitorStoryId(result.storyId ?? null)
        setShowUploadSuccessToast(true)
      }
      handleCloseForm()
      const refreshed = await getPublicApprovedStoriesForEventAction(event.id)
      setStories(refreshed as Story[])
      const map: Record<string, number> = {}
      refreshed.forEach((s: Story) => {
        const k = normalizeStoryIdForHearts(s.id)
        if (k) map[k] = s.likes_count ?? 0
      })
      setLikesMap((prev) => ({ ...prev, ...map }))
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : tx.memorial.errors.submitFailed)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleNotifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!event) return
    setNotificationLoading(true)
    setNotificationError(null)
    const form = e.currentTarget
    const email = (form.querySelector('input[name="notify_email"]') as HTMLInputElement)?.value?.trim()
    if (!email) {
      setNotificationError(tx.memorial.errors.emailRequired)
      setNotificationLoading(false)
      return
    }
    const result = await subscribeNotificationAction(event.id, email)
    setNotificationLoading(false)
    if (result.ok) {
      setNotificationSubmitted(true)
    } else {
      setNotificationError(result.error ?? tx.memorial.errors.subscribeFailed)
    }
  }

  const handleDownloadFilm = async () => {
    if (!event || !slug || checkoutLoading) return
    if (!PAYMENT_ENABLED) {
      setShowPaymentComingSoon(true)
      return
    }
    setCheckoutLoading(true)
    setCheckoutError(null)
    const result = (await createCheckoutSessionAction(event.id, slug, appLocale)) as any
    setCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setCheckoutError(result.error ?? tx.memorial.errors.checkoutFailed)
    }
  }

  const isLocked = isClosed && (!event || !eventRowIsPaidMemorial(event))
  /** Rare edge case: collection closed but photo window not expired (mismatched deadlines). */
  const paywallThreshold = 20
  const legacyPaywallLockedCount =
    isLocked && stories.length > paywallThreshold ? stories.length - paywallThreshold : 0
  const showUnlockUpsell =
    (showBlurByDeadline && stories.length > 0) ||
    (!showBlurByDeadline && isLocked && legacyPaywallLockedCount > 0)

  const handleUnlockMemories = async () => {
    if (!event || !slug || checkoutLoading) return
    if (!PAYMENT_ENABLED) {
      setShowPaymentComingSoon(true)
      return
    }
    setCheckoutLoading(true)
    setCheckoutError(null)
    const result = (await createCheckoutSessionAction(event.id, slug, appLocale)) as any
    setCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setCheckoutError(result.error ?? tx.memorial.errors.checkoutFailed)
    }
  }

  const handleDonationToRevealBank = async () => {
    if (!event || !slug || donationCheckoutLoading) return
    if (!platformTipChecked) {
      // Require checkbox before proceeding.
      return
    }
    if (!PAYMENT_ENABLED) {
      setShowPaymentComingSoon(true)
      return
    }
    setDonationCheckoutLoading(true)
    setCheckoutError(null)
    const result = (await createDonationCheckoutSessionAction(event.id, slug, donationLocale)) as any
    setDonationCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setCheckoutError(result.error ?? tx.memorial.errors.donationCheckoutFailed)
    }
  }

  const handleHeart = async (storyId: string) => {
    const id = normalizeStoryIdForHearts(storyId)
    if (!id || heartBusyId) return
    setHeartBusyId(id)
    try {
      const removing = heartedIds.has(id)
      const result = removing ? await unheartStoryAction(id) : await heartStoryAction(id)
      if (result.ok) {
        const next = new Set(heartedIds)
        if (removing) next.delete(id)
        else next.add(id)
        setHeartedIds(next)
        setLikesMap((prev) => ({ ...prev, [id]: result.likesCount }))
        if (heartedStorageKey && typeof window !== "undefined") {
          try {
            localStorage.setItem(heartedStorageKey, JSON.stringify([...next]))
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setHeartBusyId(null)
    }
  }

  const memorialBackdropUrl = useMemo(() => {
    if (!event) return null
    return resolveMemorialBackgroundUrl(event, stories)
  }, [event, stories])

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 font-sans text-[var(--landing-text-muted)] text-sm label-uppercase tracking-widest uppercase px-6 text-center">
        <span>{loadSyncing ? tx.memorial.loadSyncing : tx.memorial.loadLoading}</span>
        {loadSyncing ? (
          <span className="text-[11px] normal-case tracking-wide text-[var(--landing-text-body)] max-w-sm">
            {tx.memorial.syncHint}
          </span>
        ) : null}
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center font-serif px-6 text-center text-[var(--landing-text-hero)]">
        <p className="text-sm label-uppercase tracking-widest uppercase text-[var(--landing-text-body)] mb-4">
          {error ?? tx.memorial.notFound}
        </p>
        <motion.a
          href="/"
          className="inline-block text-[var(--aeterna-gold)] hover:underline text-sm tracking-wide"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={ARTISAN_SPRING}
        >
          {tx.memorial.returnHome}
        </motion.a>
      </div>
    )
  }

  const birth = formatLongDate(event.birth_date)
  const death = formatLongDate(event.death_date)
  const profileSrc = resolveProfileImageUrl(event.profile_image)
  const isOwner =
    !!sessionUser &&
    isMemorialOwner(sessionUser, {
      creator_user_id: event.creator_user_id,
      creator_email: event.creator_email,
    })

  const showAddStoryCta =
    !filmReleased && !isClosed && photoDeadlineRemainingMs !== null && photoDeadlineRemainingMs > 0

  const addStoryLabel = tx.memorial.addMemory

  return (
    <LayoutGroup>
    <div
      className={`relative min-h-dvh text-[var(--landing-text-hero)] font-sans ${
        filmReleased || (isLocked && showUnlockUpsell && !filmReleased) ? "pb-28 md:pb-0" : ""
      }`}
    >
      {memorialBackdropUrl ? (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <img
            src={memorialBackdropUrl}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-[0.35] blur-md"
          />
          <div className="absolute inset-0 bg-landing/85" />
        </div>
      ) : null}
      <div className="relative z-[1]">
      <AnimatePresence>
        {showPremiumBlurPopup && (
          <motion.div
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030303]/60 backdrop-blur-sm"
            onClick={() => setShowPremiumBlurPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={ARTISAN_SPRING}
              className="rounded-2xl bg-[var(--aeterna-charcoal)] border border-[var(--aeterna-gold-pale)] shadow-xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[var(--aeterna-headline)] font-serif text-lg mb-4">
                {tx.memorial.premiumRestoreTitle}
              </p>
              <p className="text-[var(--aeterna-body)] text-sm mb-6">
                {tx.memorial.premiumRestoreBody}
              </p>
              <div className="flex flex-col gap-2">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowPremiumBlurPopup(false)
                    void handleUnlockMemories()
                  }}
                  disabled={checkoutLoading}
                  className="min-h-[44px] w-full rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors disabled:opacity-60"
                  whileHover={{ scale: checkoutLoading ? 1 : 1.02 }}
                  whileTap={{ scale: checkoutLoading ? 1 : 0.98 }}
                  transition={ARTISAN_SPRING}
                >
                  {checkoutLoading ? tx.common.redirecting : tx.memorial.unlockMemories}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowPremiumBlurPopup(false)}
                  className="min-h-[44px] w-full rounded-xl border border-white/15 text-[var(--aeterna-headline)] text-sm hover:bg-white/[0.06] transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={ARTISAN_SPRING}
                >
                  {tx.common.ok}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaymentComingSoon && (
          <motion.div
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030303]/60 backdrop-blur-sm"
            onClick={() => setShowPaymentComingSoon(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={ARTISAN_SPRING}
              className="rounded-2xl bg-[var(--aeterna-charcoal)] border border-[var(--aeterna-gold-pale)] shadow-xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[var(--aeterna-headline)] font-serif text-lg mb-4">
                {tx.memorial.paymentsSoonTitle}
              </p>
              <p className="text-[var(--aeterna-body)] text-sm mb-6">
                {tx.memorial.paymentsSoonBody}
              </p>
              <motion.button
                type="button"
                onClick={() => setShowPaymentComingSoon(false)}
                className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={ARTISAN_SPRING}
              >
                {tx.common.ok}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAdminForbiddenToast && (
          <motion.div
            role="alert"
            aria-live="assertive"
            className="fixed left-1/2 top-[max(0.85rem,env(safe-area-inset-top))] z-[60] w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 px-4"
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
          >
            <div className="rounded-2xl border border-[var(--border-gold)] bg-[#1e1e1e]/95 px-4 py-3 text-center shadow-[var(--landing-shadow-deep)] backdrop-blur-md">
              <p className="text-[13px] leading-snug text-[var(--landing-text-body)]">
                {tx.memorial.adminForbidden}
              </p>
            </div>
          </motion.div>
        )}
        {showDonationThankYou && (
          <motion.div
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] max-w-sm px-6 py-4 rounded-2xl border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-center shadow-xl"
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
          >
            <p className="text-[var(--aeterna-gold)] font-serif text-sm leading-relaxed">
              {tx.memorial.donationThankYou}
            </p>
          </motion.div>
        )}
        {showUploadSuccessToast && (
          <motion.div
            role="status"
            aria-live="polite"
            className={
              showAfterUploadEmailField && !afterUploadDone
                ? "fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[60] w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 px-4 max-h-[min(90dvh,560px)] overflow-y-auto"
                : "fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 px-4"
            }
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
          >
            <div className="rounded-2xl border border-white/[0.12] bg-[#030303]/80 px-5 py-4 text-center shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <p className="font-[var(--font-serif)] text-[16px] font-medium tracking-tight text-white">
                {tx.memorial.memoryReceivedTitle}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/75">
                {tx.memorial.memoryReceivedBody}
              </p>
              {!afterUploadDone && !showAfterUploadEmailField ? (
                <button
                  type="button"
                  onClick={() => setShowAfterUploadEmailField(true)}
                  className="mt-3 block w-full text-center text-[12px] text-[var(--aeterna-gold)]/95 underline-offset-2 hover:underline"
                >
                  {tx.memorial.emailWhenLive}
                </button>
              ) : null}
              {showAfterUploadEmailField && !afterUploadDone ? (
                <form
                  onSubmit={handleAfterUploadSubscribe}
                  className="mt-3 flex flex-col gap-2 text-left"
                >
                  <input
                    type="email"
                    value={afterUploadEmail}
                    onChange={(e) => setAfterUploadEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    placeholder={tx.memorial.emailPlaceholder}
                    className="min-h-[44px] w-full rounded-xl border border-white/[0.14] bg-white/[0.06] px-3 text-[13px] text-white placeholder:text-white/38 focus:outline-none focus:ring-1 focus:ring-[var(--aeterna-gold)]/40"
                  />
                  <button
                    type="submit"
                    disabled={afterUploadLoading}
                    className="min-h-[38px] w-full rounded-lg border border-[var(--aeterna-gold)]/40 bg-[var(--aeterna-gold)]/12 px-3 text-[12px] font-medium text-[var(--aeterna-gold)] transition-colors hover:bg-[var(--aeterna-gold)]/18 disabled:opacity-50"
                  >
                    {afterUploadLoading ? tx.memorial.saving : tx.common.save}
                  </button>
                  <LegalFormCaption className="mt-2" />
                </form>
              ) : null}
              {afterUploadError ? (
                <p className="mt-2 text-[11px] text-[var(--aeterna-gold-muted)]" role="alert">
                  {afterUploadError}
                </p>
              ) : null}
              {afterUploadDone ? (
                <p className="mt-3 text-[13px] leading-relaxed text-[var(--aeterna-gold)]">
                  {tx.memorial.afterUploadDone}
                </p>
              ) : null}
              <button
                type="button"
                onClick={dismissUploadSuccessToast}
                className="mt-4 w-full min-h-[40px] rounded-xl border border-white/[0.12] bg-white/[0.06] text-[12px] font-medium tracking-wide text-white/90 transition-colors hover:bg-white/[0.1]"
              >
                {tx.memorial.close}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {shareModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="memorial-share-title"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
            onClick={closeShareModal}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-white/[0.12] bg-[#0a0a0a]/96 px-5 py-5 text-center shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              <p id="memorial-share-title" className="text-[13px] font-medium leading-relaxed text-white">
                {tx.memorial.shareModalTitle}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/70">
                {tx.memorial.shareModalBody}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleRankShareWhatsApp}
                  className={`${shareChannelBtnBase} border border-[var(--border-gold)] bg-[#030303]/30 text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold)]/10`}
                >
                  {tx.memorial.whatsApp}
                </button>
                <button
                  type="button"
                  onClick={handleRankShareMessage}
                  className={`${shareChannelBtnBase} border border-[var(--border-gold)] bg-[#030303]/35 text-[var(--landing-text-hero)] hover:border-[var(--aeterna-gold-light)] hover:bg-[var(--aeterna-gold)]/10`}
                >
                  {tx.memorial.message}
                </button>
                <button
                  type="button"
                  onClick={handleRankShareCopy}
                  className={`${shareChannelBtnBase} border border-white/20 bg-white/[0.06] text-[var(--landing-text-body)] hover:bg-white/10`}
                >
                  {tx.memorial.copyLink}
                </button>
              </div>
              <button
                type="button"
                onClick={closeShareModal}
                className="mt-4 w-full min-h-[40px] rounded-full border border-white/15 text-[11px] font-medium tracking-wide text-white/80 hover:bg-white/[0.06] transition-colors"
              >
                {tx.memorial.close}
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Free tier: preservation banner — full width at top (safe area for notched phones) */}
      {event &&
        !isPaidMemorial &&
        photoDeadlineRemainingMs !== null &&
        photoDeadlineRemainingMs > 0 &&
        !isPhotoDeadlinePassed && (
          <div className="w-full pt-[max(0.35rem,env(safe-area-inset-top))]">
            <MemorialTrialCountdown
              variant="banner"
              remainingMs={photoDeadlineRemainingMs}
              upgradeHref={`/p/${encodeURIComponent(slug)}#memorial-preserve-upgrade`}
              copy={memorialTrialBannerCopy}
            />
          </div>
        )}

      <header className="relative w-full px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <div className="mb-6 aspect-square w-[min(76vw,20rem)] max-w-[85vw] sm:w-[min(82vw,22rem)] sm:max-w-[90vw] shrink-0 overflow-hidden rounded-full border border-[var(--aeterna-gold)]/22 bg-gradient-to-b from-[#f4f1ea]/[0.1] via-[#3a342c] to-[#252018] shadow-[0_22px_56px_-18px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.07)]">
            {profileSrc ? (
              <img src={profileSrc} alt="" className="memorial-thumbnail h-full w-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f4f1ea]/[0.06] font-serif text-[clamp(2.5rem,18vw,4rem)] text-[var(--landing-text-muted)]">
                {(event.name ?? "?").charAt(0)}
              </div>
            )}
          </div>
          <h1 className="font-heading max-w-[22ch] font-serif text-2xl font-semibold leading-tight tracking-tight text-[var(--landing-text-hero)] sm:text-3xl">
            {event.name}
          </h1>
          <p className="mt-2 text-base font-medium tabular-nums text-[var(--landing-text-body)] sm:text-lg">
            {birth} — {death}
          </p>
        </div>

        {event.invitation_bio?.trim() ? (
          <p className="mx-auto mt-6 w-full max-w-4xl whitespace-pre-wrap px-2 text-center font-['Times_New_Roman',Times,serif] text-[1.05rem] italic leading-[1.75] text-[var(--landing-text-body)] sm:px-6 sm:text-[1.125rem] sm:leading-[1.8]">
            {event.invitation_bio.trim()}
          </p>
        ) : null}

        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          {event ? (
            <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3 px-1">
              {showAddStoryCta ? (
                <motion.button
                  type="button"
                  onClick={handleOpenForm}
                  className="inline-flex min-h-[52px] max-w-[min(100%,20rem)] items-center justify-center gap-2 rounded-full bg-[var(--aeterna-gold)] px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-charcoal)] shadow-[0_8px_28px_-8px_rgba(197,160,89,0.45)] transition-colors hover:bg-[var(--aeterna-gold-light)]"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={ARTISAN_SPRING}
                >
                  <span aria-hidden className="text-lg font-light leading-none">
                    +
                  </span>
                  {addStoryLabel}
                </motion.button>
              ) : null}
              <motion.button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--aeterna-gold)]/55 bg-[#030303]/40 px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-gold)] shadow-[0_4px_20px_-6px_rgba(197,160,89,0.25)] transition-colors hover:bg-[var(--aeterna-gold)]/10"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={ARTISAN_SPRING}
              >
                {tx.memorial.share}
              </motion.button>
              {isOwner ? (
                <Link
                  href={`/p/${encodeURIComponent(slug)}/admin`}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--aeterna-gold)] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-charcoal)] shadow-[0_8px_28px_-8px_rgba(197,160,89,0.45)] transition-colors hover:bg-[var(--aeterna-gold-light)]"
                >
                  {tx.memorial.admin}
                </Link>
              ) : null}
            </div>
          ) : null}

          {photoDeadlineRemainingMs !== null &&
          photoDeadlineRemainingMs > 0 &&
          !isPhotoDeadlinePassed &&
          !isPaidMemorial ? (
            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">
              {tx.memorial.photoWindow}{" "}
              <span className="font-mono tabular-nums text-[var(--aeterna-gold)]">
                {tx.memorial.trialCountdownFromMs(photoDeadlineRemainingMs)}
              </span>
            </p>
          ) : null}
        </div>
      </header>

      {/* Trial banner “upgrade” link scrolls here — same checkout as unlock / preserve */}
      {event &&
        !isPaidMemorial &&
        photoDeadlineRemainingMs !== null &&
        photoDeadlineRemainingMs > 0 &&
        !isPhotoDeadlinePassed && (
          <section
            id="memorial-preserve-upgrade"
            tabIndex={-1}
            className="scroll-mt-[max(5.5rem,env(safe-area-inset-top))] mx-auto w-full max-w-lg px-4 pb-6 pt-1"
          >
            <div className="rounded-2xl border border-[var(--border-gold-subtle)]/45 bg-[#030303]/30 px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-sm leading-relaxed text-[var(--landing-text-body)] mb-4">
                {tx.memorial.memorialUpgradeAnchorIntro}
              </p>
              <motion.button
                type="button"
                onClick={() => {
                  if (!PAYMENT_ENABLED) {
                    setShowPaymentComingSoon(true)
                    return
                  }
                  void handleUnlockMemories()
                }}
                disabled={checkoutLoading}
                className="inline-flex min-h-[48px] w-full max-w-sm items-center justify-center rounded-xl bg-[var(--aeterna-gold)] px-6 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-charcoal)] shadow-[0_8px_28px_-8px_rgba(197,160,89,0.45)] transition-colors hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60"
                whileHover={{ scale: checkoutLoading ? 1 : 1.02 }}
                whileTap={{ scale: checkoutLoading ? 1 : 0.98 }}
                transition={ARTISAN_SPRING}
              >
                {checkoutLoading ? tx.common.redirecting : tx.memorial.upgradePremiumCta}
              </motion.button>
            </div>
          </section>
        )}

      {/* Full screen cinematic section (when film_url exists) */}
      {filmReleased && (
        <section
          className="w-full bg-landing py-8 md:py-12 animate-[theaterEntrance_1.8s_ease-out_forwards] animate-[fadeInUp_0.85s_ease-out_both]"
          aria-label={tx.memorial.filmAria}
        >
          {/* Soft gold glow behind video */}
          <div className="relative w-full flex justify-center px-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[70vh] max-h-[720px] pointer-events-none rounded-lg animate-[goldGlowPulse_5s_ease-in-out_infinite]"
              style={{
                background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(197,160,89,0.14) 0%, transparent 65%)",
              }}
            />
            {/* Video region: w-full, h-[70vh], object-cover */}
            <div className="relative w-full h-[70vh] max-h-[720px] max-w-6xl mx-auto overflow-hidden rounded-lg">
              <div className="absolute inset-0 rounded-lg shadow-[0_0_80px_rgba(197,160,89,0.12)] pointer-events-none" />
              {tributeClipsToPlay.length > 0 ? (
                <div className="w-full h-full flex flex-col gap-4 overflow-y-auto md:flex-row md:gap-3 md:overflow-hidden">
                  {tributeClipsToPlay.map((url, i) => (
                    <video
                      key={`${url}-${i}`}
                      src={url}
                      controls
                      playsInline
                      className="w-full md:flex-1 min-h-0 h-[min(50vh,420px)] md:h-full object-cover rounded-lg"
                    >
                      {tx.memorial.videoUnsupported}
                    </video>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full bg-[var(--aeterna-charcoal-muted)] flex items-center justify-center rounded-lg">
                  <span className="text-[var(--aeterna-gold-muted)] text-sm tracking-[0.2em] uppercase">{tx.memorial.filmLabel}</span>
                </div>
              )}
            </div>
          </div>
          {/* Download high-quality film — Premium tier */}
          {isPremiumTier && (
            <>
              <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex flex-col items-center gap-3">
                <motion.button
                  type="button"
                  onClick={handleDownloadFilm}
                  disabled={checkoutLoading}
                  className="gold-btn-shimmer hidden md:inline-flex min-h-[52px] px-8 py-3.5 rounded-[var(--radius-button)] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-[var(--font-serif)] text-sm tracking-[0.2em] uppercase hover:bg-[var(--aeterna-gold-pale)] disabled:opacity-60"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={ARTISAN_SPRING}
                >
                  {checkoutLoading ? tx.memorial.redirectCheckout : tx.memorial.downloadFilm}
                </motion.button>
                {checkoutError && (
                  <p className="text-[var(--aeterna-gold-muted)] text-sm text-center">{checkoutError}</p>
                )}
              </div>
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-gold-subtle)]/40 bg-landing/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <motion.button
                  type="button"
                  onClick={handleDownloadFilm}
                  disabled={checkoutLoading}
                  className="gold-btn-shimmer w-full min-h-[52px] px-6 py-3.5 rounded-[var(--radius-button)] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-[var(--font-serif)] text-sm tracking-[0.18em] uppercase hover:bg-[var(--aeterna-gold-pale)] disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                  transition={ARTISAN_SPRING}
                >
                  {checkoutLoading ? tx.common.redirecting : tx.memorial.downloadFilm}
                </motion.button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Share a Memory / AI Film Preview crafting (when closed, film not yet released) */}
      {!filmReleased && (
        <div className="max-w-4xl mx-auto px-4 mb-10 animate-[fadeInUp_0.85s_ease-out_both]">
          {isClosed ? (
            <section
              className="relative rounded-2xl overflow-hidden border border-[var(--border-gold-subtle)] bg-[#1e1e1e]/95 shadow-[var(--shadow-deep)]"
              aria-label={isPremiumTier ? tx.memorial.filmAria : tx.memorial.collectionClosed}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--landing-bg)] via-[#141414] to-[color:var(--landing-bg)] pointer-events-none" />

              <div className="relative px-6 py-10 md:py-14">
                <p className="text-center font-heading font-serif text-[var(--aeterna-headline)] text-lg md:text-xl label-uppercase tracking-widest uppercase mb-2">
                  {isPremiumTier ? tx.memorial.filmCraftedTitle : tx.memorial.collectionClosed}
                </p>
                <p className="text-center text-[var(--aeterna-gold-muted)] text-sm label-uppercase tracking-widest mb-8">
                  {isPremiumTier ? tx.memorial.filmCraftedSubtitle : tx.memorial.collectionClosedGalleryNote}
                </p>

                {isPremiumTier && (
                <div className="max-w-md mx-auto h-1 rounded-full bg-[var(--aeterna-charcoal-muted)] overflow-hidden mb-12">
                  <div
                    className="h-full w-1/3 min-w-[80px] rounded-full bg-gradient-to-r from-transparent via-[#C5A059] to-transparent shadow-[0_0_12px_rgba(197,160,89,0.6)] animate-[goldLoad_2s_ease-in-out_infinite]"
                  />
                </div>
                )}

                {selectedStories.length > 0 && (
                  <div className="mb-12 rounded-xl overflow-hidden aspect-[16/10] max-h-[280px] bg-[var(--aeterna-charcoal-muted)] relative">
                    {selectedStories.map((story, i) => (
                      <div
                        key={i === teaserIndex ? `${story.id}-${teaserCycle}` : story.id}
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                          opacity: i === teaserIndex ? 1 : 0,
                          zIndex: i === teaserIndex ? 1 : 0,
                        }}
                      >
                        {story.image_url ? (
                          <img
                            src={story.image_url}
                            alt=""
                            className="memorial-thumbnail w-full h-full object-cover"
                            style={i === teaserIndex ? { animation: "teaserReveal 5s ease-in-out" } : undefined}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--aeterna-body)] text-sm">
                            Memory
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isPremiumTier ? (
                <div className="max-w-sm mx-auto">
                  <p className="text-center text-[var(--aeterna-headline)] text-sm tracking-[0.1em] mb-4">
                    {tx.memorial.notifyFilmTitle}
                  </p>
                  {notificationSubmitted ? (
                    <p className="text-center text-[var(--aeterna-gold)] text-sm tracking-wide py-3">
                      {tx.memorial.notifyFilmThanks}
                    </p>
                  ) : (
                    <form onSubmit={handleNotifySubmit} className="flex flex-col gap-2">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="email"
                          name="notify_email"
                          required
                          placeholder={tx.memorial.notifyPlaceholder}
                          className="flex-1 min-h-[44px] px-4 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)] text-sm"
                        />
                        <motion.button
                          type="submit"
                          disabled={notificationLoading}
                          className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-[var(--font-serif)] text-sm tracking-[0.12em] uppercase disabled:opacity-60 hover:bg-[var(--aeterna-gold-light)]"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={ARTISAN_SPRING}
                        >
                          {notificationLoading ? tx.memorial.saving : tx.memorial.notifyMe}
                        </motion.button>
                      </div>
                      <LegalFormCaption />
                    </form>
                  )}
                  {notificationError && (
                    <p className="mt-2 text-center text-[var(--aeterna-gold-muted)] text-sm">{notificationError}</p>
                  )}
                </div>
                ) : (
                  <p className="text-center text-sm text-[var(--aeterna-gold-muted)] max-w-md mx-auto">
                    <Link href="/create?plan=film&new=1" className="text-[var(--aeterna-gold)] underline underline-offset-2 hover:text-[var(--aeterna-gold-light)]">
                      {tx.memorial.upgradePremiumCta}
                    </Link>{" "}
                    {tx.memorial.upgradePremiumTail}
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* Memory grid — flat gallery */}
      <main className="animate-[fadeInUp_0.85s_ease-out_both] border-t border-white/[0.06] pb-[max(6.5rem,env(safe-area-inset-bottom))] pt-1 [animation-delay:0.18s]">
        {stories.length === 0 ? (
          <div className="mx-auto max-w-xl bg-landing px-4 py-10">
            <p className="text-center text-sm tracking-wide text-[var(--landing-text-muted)]">{tx.memorial.noMemoriesYet}</p>
          </div>
        ) : (
          <>
            {showUnlockUpsell && (
              <>
                <div className="max-w-4xl mx-auto px-4 pb-4 flex flex-col items-center gap-3">
                  <p className="text-sm text-[var(--aeterna-headline)] text-center">
                    {showBlurByDeadline ? (
                      <>
                        There are <strong className="text-[var(--aeterna-gold)]">{stories.length}</strong> memories in
                        this memorial — upgrade to view the full gallery.
                      </>
                    ) : (
                      <>
                        There are <strong className="text-[var(--aeterna-gold)]">{legacyPaywallLockedCount}</strong> more
                        memories from family and friends.
                      </>
                    )}
                  </p>
                  <motion.button
                    type="button"
                    onClick={handleUnlockMemories}
                    disabled={checkoutLoading}
                    className={`min-h-[48px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm font-medium tracking-[0.12em] uppercase hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors ${
                      filmReleased ? "inline-flex" : "hidden md:inline-flex"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={ARTISAN_SPRING}
                  >
                    {checkoutLoading ? tx.common.redirecting : tx.memorial.unlockMemories}
                  </motion.button>
                  {checkoutError && (
                    <p className={`text-[var(--aeterna-gold-muted)] text-xs ${filmReleased ? "block" : "hidden md:block"}`}>{checkoutError}</p>
                  )}
                </div>
                {!filmReleased && (
                  <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-gold-subtle)]/40 bg-landing/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <motion.button
                      type="button"
                      onClick={handleUnlockMemories}
                      disabled={checkoutLoading}
                      className="w-full min-h-[52px] rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm font-medium tracking-[0.12em] uppercase hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
                      whileTap={{ scale: 0.98 }}
                      transition={ARTISAN_SPRING}
                    >
                      {checkoutLoading ? tx.common.redirecting : tx.memorial.unlockMemories}
                    </motion.button>
                    {checkoutError && <p className="text-[var(--aeterna-gold-muted)] text-xs text-center mt-2">{checkoutError}</p>}
                  </div>
                )}
              </>
            )}
            <ul className="grid grid-cols-3 md:grid-cols-4 gap-[3px] bg-landing">
              {stories.map((story, index) => {
                const isBlurredByPaywall = isLocked && index >= paywallThreshold
                const isBlurred = showBlurByDeadline || isBlurredByPaywall
                return (
                  <motion.li
                    key={story.id}
                    className="relative aspect-square cursor-pointer bg-landing"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...ARTISAN_SPRING, delay: 0.04 * Math.min(index, 12) }}
                  >
                    <motion.button
                      type="button"
                      className={`absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aeterna-gold)]/50 ${isBlurredByPaywall && !showBlurByDeadline ? "cursor-default" : ""}`}
                      onClick={() => {
                        if (showBlurByDeadline) setShowPremiumBlurPopup(true)
                        else if (!isBlurredByPaywall) setViewerStory(story)
                      }}
                      aria-label={
                        isBlurred
                          ? showBlurByDeadline
                            ? tx.memorial.restorePremium
                            : tx.memorial.locked
                          : tx.memorial.viewStoryAria
                      }
                      disabled={!showBlurByDeadline && isBlurredByPaywall}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {story.image_url ? (
                        <motion.img
                          layoutId={isBlurred ? undefined : `story-img-${story.id}`}
                          src={story.thumb_url ?? story.image_url}
                          alt=""
                          className={`memorial-thumbnail h-full w-full object-cover ${isBlurred ? "blur-[12px] select-none" : ""}`}
                          style={{ opacity: viewerStory?.id === story.id ? 0 : 1 }}
                          transition={ARTISAN_SPRING}
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--aeterna-body)] text-xs">
                          Memory
                        </div>
                      )}
                    </motion.button>
                    {isBlurred && (
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#030303]/35">
                        <svg className="h-7 w-7 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-white/90">
                          {showBlurByDeadline ? tx.memorial.premium : tx.memorial.locked}
                        </span>
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          </>
        )}

        {/* Condolence gift section: card/Apple Pay/Google Pay with 1% platform support note */}
        {event.bank_info && (
          <section className="max-w-4xl mx-auto px-4 py-10 md:py-12 border-t border-[var(--border-gold-subtle)]/50 mt-12">
            <h2 className="text-sm font-serif text-[var(--aeterna-gold)] tracking-[0.2em] uppercase mb-1">
              Condolence Gift
            </h2>
            <p className="text-[10px] text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-4">Card · Apple Pay · Google Pay</p>
            {hasDonatedForBank || revealedBankWithoutDonation ? (
              <div className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[#1e1e1e]/80 p-6">
                {hasDonatedForBank && (
                  <p className="text-[var(--aeterna-gold-muted)] text-xs leading-relaxed mb-4">
                    Your support helps Aeterna preserve memories for longer.
                  </p>
                )}
                <p className="text-[var(--aeterna-headline)] whitespace-pre-line font-sans text-sm leading-relaxed">
                  {event.bank_info}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[#1e1e1e]/80 p-6 md:p-8">
                <div className="relative">
                  <p className="text-[var(--aeterna-headline)] whitespace-pre-line font-sans text-sm leading-relaxed blur-md select-none min-h-[80px]">
                    {event.bank_info}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#1e1e1e]/95 rounded-xl py-6 px-4">
                    <p className="text-[var(--aeterna-body)] text-sm text-center px-2">
                      To view the condolence account details, please unlock with a small support payment.
                    </p>
                    <p className="text-sm text-[var(--aeterna-gold-muted)] mb-2">
                      Please help cover the 1% platform fee so families can receive the full gift amount.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer text-left max-w-md px-2">
                      <input
                        type="checkbox"
                        checked={platformTipChecked}
                        onChange={(e) => setPlatformTipChecked(e.target.checked)}
                        className="mt-1 rounded border-[var(--border-gold-subtle)] text-[var(--aeterna-gold)] focus:ring-[var(--aeterna-gold)]"
                      />
                      <span className="text-sm text-[var(--aeterna-body)]">
                        Would you like to add a small platform support payment so the family receives 100% of the condolence gift?
                      </span>
                    </label>
                    <motion.button
                      type="button"
                      onClick={handleDonationToRevealBank}
                      disabled={donationCheckoutLoading || !platformTipChecked}
                      className="min-h-[48px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm font-medium tracking-[0.12em] uppercase hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
                      whileHover={platformTipChecked && !donationCheckoutLoading ? { scale: 1.02 } : undefined}
                      whileTap={platformTipChecked && !donationCheckoutLoading ? { scale: 0.98 } : undefined}
                      transition={ARTISAN_SPRING}
                    >
                      {donationCheckoutLoading
                        ? tx.memorial.redirectCheckout
                        : `${donationAmountLabel} ${tx.memorial.donationSupportCta}`}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.setItem(`aeterna_reveal_no_donate_${slug}`, "1")
                        } catch {
                          // ignore
                        }
                        setRevealedBankWithoutDonation(true)
                      }}
                      className="text-[10px] text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] underline underline-offset-1 mt-1"
                    >
                      Continue without support
                    </button>
                    <p className="text-[10px] text-[var(--aeterna-gold-muted)] mt-3" aria-label="Recent Support">
                      Recent Support · In the last hour, <strong className="text-[var(--aeterna-gold-muted)]">{donationStats?.recentCount1h != null && donationStats.recentCount1h > 0 ? donationStats.recentCount1h : 3}</strong> people have contributed support.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {checkoutError && (
              <p className="mt-3 text-[var(--aeterna-gold-muted)] text-sm text-center">{checkoutError}</p>
            )}
          </section>
        )}

        {/* Donation status (social proof) — only when there are records */}
        {event && donationStats && donationStats.count > 0 && (
          <section
            aria-label={tx.memorial.donationStatusAria}
            className="mt-10 pt-8 border-t border-[var(--border-gold-subtle)]/50"
          >
            <h2 className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-3">
              {tx.memorial.donationStatus}
            </h2>
            <p className="text-[var(--aeterna-headline)] text-sm mb-4">
              {tx.memorial.donationSoFar(donationStats.count)}
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--aeterna-body)]">
              {donationStats.list.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[var(--aeterna-gold-muted)]" aria-hidden>
                    ·
                  </span>
                  {item.displayLabel}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Memory detail: bottom sheet (mobile) / modal (desktop) + tributes */}
      <AnimatePresence mode="wait">
        {viewerStory && event?.id && (
          <StoryMemoryDrawer
            key={`story-viewer-${coerceIdString(viewerStory.id)}`}
            story={viewerStory}
            eventId={coerceIdString(event.id)}
            sessionUser={sessionUser}
            likesCount={
              likesMap[normalizeStoryIdForHearts(viewerStory.id)] ?? viewerStory.likes_count ?? 0
            }
            isHearted={heartedIds.has(normalizeStoryIdForHearts(viewerStory.id))}
            heartBusy={heartBusyId === normalizeStoryIdForHearts(viewerStory.id)}
            onClose={() => setViewerStory(null)}
            onHeart={() => handleHeart(viewerStory.id)}
            showAiFilmMessaging={isPremiumTier}
            nameStorageKey={slug}
          />
        )}
      </AnimatePresence>

      {/* Share a Memory — one question per screen */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030303]/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-title"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-[var(--border-gold-subtle)] bg-[#1e1e1e] shadow-[var(--shadow-deep)] overflow-hidden"
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
          >
            <div className="relative h-[3px] w-full bg-[var(--aeterna-charcoal-muted)]/90">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-r-full bg-[var(--aeterna-gold)]"
                initial={false}
                animate={{ width: `${(shareStep / 3) * 100}%` }}
                transition={ARTISAN_SPRING}
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2
                    id="form-title"
                    className="text-[11px] font-sans font-normal text-[var(--aeterna-gold-muted)] tracking-[0.28em] uppercase"
                  >
                    {tx.memorial.shareMemoryTitle}
                  </h2>
                  <p className="mt-1.5 text-[10px] font-sans text-[var(--aeterna-gold-muted)]/90 tracking-[0.2em] uppercase tabular-nums">
                    {tx.memorial.stepCounter(shareStep)}
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleCloseForm}
                  className="shrink-0 p-2 text-[var(--landing-text-body)] hover:text-[var(--landing-text-hero)] rounded-lg"
                  aria-label={tx.memorial.close}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={ARTISAN_SPRING}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={shareStep}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={ARTISAN_SPRING}
                  className="min-h-[200px] flex flex-col"
                >
                  {shareStep === 1 && (
                    <>
                      <h3 className="font-heading font-serif text-xl md:text-[1.35rem] text-[var(--aeterna-headline)] text-center leading-snug mb-8 mt-2">
                        {tx.memorial.formNameTitle}
                      </h3>
                      <input
                        type="text"
                        value={memoryAuthorName}
                        onChange={(e) => setMemoryAuthorName(e.target.value)}
                        autoComplete="name"
                        autoFocus
                        placeholder={tx.memorial.formNamePh}
                        className="w-full min-h-[52px] px-4 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] font-sans text-base text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] placeholder:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)]/70"
                      />
                    </>
                  )}

                  {shareStep === 2 && (
                    <>
                      <h3 className="font-heading font-serif text-xl md:text-[1.35rem] text-[var(--aeterna-headline)] text-center leading-snug mb-6 mt-2">
                        {tx.memorial.formPhotoTitle}
                      </h3>
                      <input
                        ref={memoryFileInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleMemoryPhotoChange(e.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        onClick={() => memoryFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const f = e.dataTransfer.files?.[0]
                          if (f?.type.startsWith("image/")) handleMemoryPhotoChange(f)
                        }}
                        className="group flex min-h-[168px] w-full flex-col items-center justify-center gap-3 rounded-[32px] border border-dashed border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/50 px-4 py-8 text-center font-sans transition-[colors,transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[var(--aeterna-gold-muted)]/60 hover:bg-[var(--aeterna-charcoal-soft)]/40"
                      >
                        <span className="text-sm text-[var(--aeterna-headline)]">
                          {memoryPhotoFile ? tx.memorial.changePhoto : tx.memorial.tapAddMemory}
                        </span>
                        <span className="text-xs text-[var(--aeterna-gold-muted)]">{tx.memorial.dragHere}</span>
                      </button>
                      {(photoPermanentUrl || photoPreviewUrl) && (
                        <div className="mt-5 overflow-hidden rounded-[32px] border-[0.5px] border-[rgba(255,255,255,0.1)]">
                          <OptimisticImage
                            src={(photoPermanentUrl ?? photoPreviewUrl)!}
                            resolved={Boolean(photoPermanentUrl)}
                            alt=""
                            className="max-h-52 w-full object-cover rounded-[32px]"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {shareStep === 3 && (
                    <>
                      <h3 className="font-heading font-serif text-xl md:text-[1.35rem] text-[var(--aeterna-headline)] text-center leading-snug mb-6 mt-2">
                        {tx.memorial.formStoryTitle}
                      </h3>
                      <textarea
                        value={memoryStoryText}
                        onChange={(e) => setMemoryStoryText(e.target.value)}
                        autoFocus
                        rows={5}
                        placeholder={tx.memorial.formStoryPh}
                        className="w-full resize-none rounded-[32px] border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[var(--aeterna-charcoal)] px-4 py-3.5 font-sans text-base leading-relaxed text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] placeholder:opacity-75 focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)]/70"
                      />
                      <p className="mt-6 text-center font-sans text-sm leading-relaxed text-[var(--aeterna-body)] text-balance">
                        {isPremiumTier ? tx.memorial.formStoryPremium : tx.memorial.formStoryFree}
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {submitError && (
                <p className="mt-5 text-center font-sans text-sm text-[var(--aeterna-gold-muted)]" role="alert">
                  {submitError}
                </p>
              )}

              <LegalFormCaption className="mt-6" />

              <div className="mt-6 flex gap-3">
                {shareStep > 1 ? (
                  <motion.button
                    type="button"
                    onClick={goShareBack}
                    disabled={submitLoading}
                    className="min-h-[52px] flex-1 rounded-[32px] border border-[var(--border-gold-subtle)] font-sans text-sm text-[var(--landing-text-body)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/5 disabled:opacity-50"
                    whileHover={{ scale: submitLoading ? 1 : 1.01 }}
                    whileTap={{ scale: submitLoading ? 1 : 0.99 }}
                    transition={ARTISAN_SPRING}
                  >
                    {tx.common.back}
                  </motion.button>
                ) : null}
                {shareStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={goShareNext}
                    className="min-h-[52px] flex-1 rounded-[32px] bg-[var(--aeterna-gold)] font-sans text-sm font-medium text-[var(--aeterna-charcoal)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--aeterna-gold-light)]"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98, boxShadow: "0 0 36px rgba(197, 160, 89, 0.42)" }}
                    transition={ARTISAN_SPRING}
                  >
                    {tx.memorial.continueTheStoryBtn}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleSubmitStory}
                    disabled={submitLoading}
                    className="min-h-[52px] flex-1 rounded-[32px] bg-[var(--aeterna-gold)] font-sans text-sm font-medium text-[var(--aeterna-charcoal)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60"
                    whileHover={{ scale: submitLoading ? 1 : 1.01 }}
                    whileTap={{ scale: submitLoading ? 1 : 0.99 }}
                    transition={ARTISAN_SPRING}
                  >
                    {submitLoading ? tx.memorial.sending : tx.memorial.shareThisMemory}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </div>

    </LayoutGroup>
  )
}
