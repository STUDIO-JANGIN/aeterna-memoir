"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { supabase } from "@/lib/supabase/browser"
import imageCompression from "browser-image-compression"
import { createStoryAction } from "@/app/actions/createStory"
import { heartStoryAction } from "@/app/actions/heartStory"
import { subscribeNotificationAction } from "@/app/actions/subscribeNotification"
import { subscribeVisitorAction } from "@/app/actions/subscribeVisitor"
import { createCheckoutSessionAction } from "@/app/actions/createCheckoutSession"
import { createDonationCheckoutSessionAction } from "@/app/actions/createDonationCheckoutSession"
import { getDonationStatsAction } from "@/app/actions/getDonationStats"
import { getDonationAmountByLocale } from "@/lib/checkout"
import { formatLongDate } from "@/lib/formatDate"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getLocaleFromBrowser } from "@/lib/i18n"
import { isMemorialOwner } from "@/lib/memorialOwnership"
import { resolveProfileImageUrl } from "@/lib/profileImageUrl"
import {
  getPublicApprovedStoriesForEventAction,
  getPublicMemorialPageDataAction,
  getPublicSelectedTeaserStoriesAction,
} from "@/app/actions/getPublicMemorialPageData"
import { StoryMemoryDrawer } from "@/components/memorial/StoryMemoryDrawer"
import {
  MemorialTrialCountdown,
  formatMemorialCountdownDisplay,
} from "@/components/memorial/MemorialTrialCountdown"
import { buildGlobalShareMessage } from "@/components/MemorialShareActions"

const spring = { type: "spring" as const, stiffness: 300, damping: 30 }
const springJelly = { type: "spring" as const, stiffness: 400, damping: 22 }

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
  creator_email: string | null
  creator_user_id: string | null
  photo_deadline: string | null
  status: string | null
  is_premium: boolean | null
  tier: string | null
  bank_info: string | null
  invite_pdf_url: string | null
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
  const memoryFileInputRef = useRef<HTMLInputElement>(null)
  const adminForbiddenHandledRef = useRef(false)
  const shareFormOpenedRef = useRef(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set())
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
  const [myStoryId, setMyStoryId] = useState<string | null>(null)
  const [showPremiumBlurPopup, setShowPremiumBlurPopup] = useState(false)
  const [hasDonatedForBank, setHasDonatedForBank] = useState(false)
  const [revealedBankWithoutDonation, setRevealedBankWithoutDonation] = useState(false)
  const [donationCheckoutLoading, setDonationCheckoutLoading] = useState(false)
  const [showDonationThankYou, setShowDonationThankYou] = useState(false)
  const [platformTipChecked, setPlatformTipChecked] = useState(true)
  const [locale, setLocale] = useState<"ko" | "en">("en")
  const [showUploadSuccessToast, setShowUploadSuccessToast] = useState(false)
  const [showAdminForbiddenToast, setShowAdminForbiddenToast] = useState(false)
  const [afterUploadEmail, setAfterUploadEmail] = useState("")
  const [afterUploadLoading, setAfterUploadLoading] = useState(false)
  const [afterUploadError, setAfterUploadError] = useState<string | null>(null)
  const [afterUploadDone, setAfterUploadDone] = useState(false)
  const [donationStats, setDonationStats] = useState<{ count: number; list: { displayLabel: string }[]; recentCount1h: number } | null>(null)
  const donationAmountLabel = useMemo(() => {
    const { currency, unit_amount } = getDonationAmountByLocale(locale)
    return currency === "krw"
      ? `₩${unit_amount.toLocaleString("en-US")}`
      : `US$${(unit_amount / 100).toFixed(2)}`
  }, [locale])

  const dualRouteShareText = useMemo(() => {
    if (!event) return ""
    const base = typeof window !== "undefined" ? window.location.origin : getAppBaseUrl()
    const name = event.name?.trim() || "our loved one"
    const guestUrl = `${base}/p/${encodeURIComponent(slug)}`
    return buildGlobalShareMessage(name, guestUrl)
  }, [event, slug])

  // Deadline time: prefer expired_at, then collection_end_at, else created_at + 7 days.
  const getDeadlineMs = (e: FeedEvent) => {
    if (e.expired_at) return new Date(e.expired_at).getTime()
    if (e.collection_end_at) return new Date(e.collection_end_at).getTime()
    const created = e.created_at ? new Date(e.created_at).getTime() : Date.now()
    return created + 7 * 24 * 60 * 60 * 1000
  }

  // Photo submission deadline: prefer photo_deadline, fallback collection_end_at.
  const getPhotoDeadlineMs = (e: FeedEvent) => {
    if (e.photo_deadline) return new Date(e.photo_deadline).getTime()
    return getDeadlineMs(e)
  }

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
  const isPaidMemorial =
    event?.tier === "plus" || event?.tier === "premium" || event?.is_premium === true || event?.is_paid === true
  const isPremiumTier = event?.tier === "premium"
  const showBlurByDeadline = isExpired && !isPaidMemorial
  const TOP_20_VISIBLE = 20
  const tributeFilmUrl =
    event?.full_film_url && event.full_film_url.length > 0 ? event.full_film_url : event?.film_url ?? null
  // Show cinematic film when URL exists: Premium can view as soon as Luma finishes; others when collection closed.
  const filmReleased = !!tributeFilmUrl && (isClosed || isPremiumTier)
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
    if (typeof navigator !== "undefined") setLocale(getLocaleFromBrowser())
  }, [])

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
    router.replace(`/p/${slug}`, { scroll: false })
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
        router.replace(`/p/${slug}`, { scroll: false })
        return () => clearTimeout(t)
      }
    }
  }, [slug, router])

  useEffect(() => {
    if (!event?.id || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("aeterna_my_stories")
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, string>
      setMyStoryId(parsed[event.id] ?? null)
    } catch {
      setMyStoryId(null)
    }
  }, [event?.id])

  // Prevent duplicate hearts: restore already-hearted story IDs from localStorage.
  useEffect(() => {
    if (!heartedStorageKey || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(heartedStorageKey)
      if (!raw) return
      const ids = JSON.parse(raw) as string[]
      if (Array.isArray(ids)) setHeartedIds(new Set(ids))
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
        is_paid: boolean | null
        created_at: string | null
        film_url: string | null
        full_film_url: string | null
        creator_email: string | null
        creator_user_id: string | null
        photo_deadline: string | null
        status: string | null
        is_premium: boolean | null
        tier: string | null
        bank_info: string | null
        invite_pdf_url?: string | null
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
          expired_at: eventData.collection_end_at ?? null,
          is_paid: eventData.is_paid ?? false,
          created_at: eventData.created_at ?? null,
          film_url: eventData.film_url ?? null,
          full_film_url: eventData.full_film_url ?? null,
          creator_email: eventData.creator_email ?? null,
          creator_user_id: eventData.creator_user_id ?? null,
          photo_deadline: eventData.photo_deadline ?? null,
          status: eventData.status ?? null,
          is_premium: eventData.is_premium ?? false,
          tier: eventData.tier ?? null,
          bank_info: eventData.bank_info ?? null,
          invite_pdf_url: eventData.invite_pdf_url ?? null,
        })
        setStories(list)
        const map: Record<string, number> = {}
        list.forEach((s) => {
          map[s.id] = s.likes_count ?? 0
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
        setError("Memorial not found.")
        setEvent(null)
        setStories([])
        setLoading(false)
        setLoadSyncing(false)
      } catch (e) {
        console.error("CRITICAL DB ERROR (fetchData outer):", e)
        if (cancelled) return
        setError("Something went wrong while loading.")
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
  }, [slug])

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
        setSubmitError("Please share your name.")
        return
      }
      setShareStep(2)
      return
    }
    if (shareStep === 2) {
      if (!memoryPhotoFile) {
        setSubmitError("Please choose a photo.")
        return
      }
      setShareStep(3)
    }
  }

  const goShareBack = () => {
    setSubmitError(null)
    setShareStep((s) => Math.max(1, s - 1))
  }

  const handleAfterUploadSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setAfterUploadLoading(true)
    setAfterUploadError(null)
    try {
      const result = await subscribeVisitorAction(event.id, afterUploadEmail, "email")
      setAfterUploadLoading(false)
      if (result.ok) {
        setAfterUploadDone(true)
      } else {
        setAfterUploadError(result.error)
      }
    } catch (err) {
      setAfterUploadLoading(false)
      setAfterUploadError(
        err instanceof Error ? err.message : "We couldn’t subscribe you just now. Please try again in a moment."
      )
    }
  }

  const handleSubmitStory = async () => {
    if (!event) return
    if (!memoryPhotoFile) {
      setSubmitError("Please choose a photo to upload.")
      return
    }
    if (!memoryAuthorName.trim() || !memoryStoryText.trim()) {
      setSubmitError("Please add your name and the story behind your photo.")
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
        setShowUploadSuccessToast(true)
        setTimeout(() => setShowUploadSuccessToast(false), 6000)
      }
      handleCloseForm()
      const refreshed = await getPublicApprovedStoriesForEventAction(event.id)
      setStories(refreshed as Story[])
      const map: Record<string, number> = {}
      refreshed.forEach((s: Story) => {
        map[s.id] = s.likes_count ?? 0
      })
      setLikesMap((prev) => ({ ...prev, ...map }))
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit.")
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
      setNotificationError("Please enter your email.")
      setNotificationLoading(false)
      return
    }
    const result = await subscribeNotificationAction(event.id, email)
    setNotificationLoading(false)
    if (result.ok) {
      setNotificationSubmitted(true)
    } else {
      setNotificationError(result.error ?? "Something went wrong.")
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
    const result = (await createCheckoutSessionAction(event.id, slug)) as any
    setCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setCheckoutError(result.error ?? "Unable to start checkout.")
    }
  }

  const isLocked = isClosed && !(event?.tier === "plus" || event?.tier === "premium" || event?.is_paid === true)
  const paywallThreshold = TOP_20_VISIBLE
  const lockedCount = isLocked && stories.length > paywallThreshold ? stories.length - paywallThreshold : 0
  const isBlurredByDeadlineOnly = (index: number) => showBlurByDeadline && index >= TOP_20_VISIBLE

  const handleUnlockMemories = async () => {
    if (!event || !slug || checkoutLoading) return
    if (!PAYMENT_ENABLED) {
      setShowPaymentComingSoon(true)
      return
    }
    setCheckoutLoading(true)
    setCheckoutError(null)
    const result = (await createCheckoutSessionAction(event.id, slug)) as any
    setCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setCheckoutError(result.error ?? "Unable to start checkout.")
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
    const result = (await createDonationCheckoutSessionAction(event.id, slug, locale)) as any
    setDonationCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setCheckoutError(result.error ?? "We couldn’t start checkout. Please try again.")
    }
  }

  const handleHeart = async (storyId: string) => {
    if (heartedIds.has(storyId)) return
    const result = await heartStoryAction(storyId)
    if (result.ok) {
      const next = new Set(heartedIds).add(storyId)
      setHeartedIds(next)
      setLikesMap((prev) => ({ ...prev, [storyId]: result.likesCount }))
      if (heartedStorageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(heartedStorageKey, JSON.stringify([...next]))
        } catch {
          // ignore
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-[var(--once-bg)] font-sans text-[var(--once-text-muted)] text-sm label-uppercase tracking-widest uppercase px-6 text-center">
        <span>{loadSyncing ? "Syncing memorial…" : "Loading memorial…"}</span>
        {loadSyncing ? (
          <span className="text-[11px] normal-case tracking-wide text-[var(--once-text-secondary)] max-w-sm">
            Confirming your memorial on our servers. This usually takes a moment after checkout.
          </span>
        ) : null}
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--once-bg)] font-serif px-6 text-center text-[var(--once-text-primary)]">
        <p className="text-sm label-uppercase tracking-widest uppercase text-[var(--once-text-secondary)] mb-4">
          {error ?? "Page not found."}
        </p>
        <motion.a
          href="/"
          className="inline-block text-[var(--aeterna-gold)] hover:underline text-sm tracking-wide"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
        >
          Return home
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

  const locationLine = (() => {
    const t = event.location?.trim() ?? ""
    if (!t || /^location\s*tbd$/i.test(t)) return null
    return t
  })()
  const ceremonyLine = (() => {
    const t = event.ceremony_time?.trim() ?? ""
    if (!t || /^time\s*tbd$/i.test(t)) return null
    return t
  })()
  const supportLine = event.flower_link?.trim() || null
  const hasDetails = !!(locationLine || ceremonyLine || supportLine)

  const showAddStoryCta =
    !filmReleased && !isClosed && photoDeadlineRemainingMs !== null && photoDeadlineRemainingMs > 0

  const addStoryLabel = isPremiumTier ? "Add photo for tribute film" : "Add a photo & story"

  return (
    <LayoutGroup>
    <div
      className={`min-h-dvh bg-[var(--once-bg)] text-[var(--once-text-primary)] font-sans ${
        filmReleased || (isLocked && lockedCount > 0 && !filmReleased) ? "pb-28 md:pb-0" : ""
      }`}
    >
      <AnimatePresence>
        {showPremiumBlurPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPremiumBlurPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="rounded-2xl bg-[var(--aeterna-charcoal)] border border-[var(--aeterna-gold-pale)] shadow-xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[var(--aeterna-headline)] font-serif text-lg mb-4">
                Restore with Premium
              </p>
              <p className="text-[var(--aeterna-body)] text-sm mb-6">
                The photo collection window has closed, so memories are now protected. Upgrade to Premium to restore access.
              </p>
              <motion.button
                type="button"
                onClick={() => setShowPremiumBlurPopup(false)}
                className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaymentComingSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPaymentComingSoon(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={spring}
              className="rounded-2xl bg-[var(--aeterna-charcoal)] border border-[var(--aeterna-gold-pale)] shadow-xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[var(--aeterna-headline)] font-serif text-lg mb-4">
                Payments are almost ready
              </p>
              <p className="text-[var(--aeterna-body)] text-sm mb-6">
                Secure checkout will be available soon to unlock all memories.
              </p>
              <motion.button
                type="button"
                onClick={() => setShowPaymentComingSoon(false)}
                className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                OK
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="rounded-2xl border border-red-500/35 bg-[#1a1512]/95 px-4 py-3 text-center shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md">
              <p className="text-[13px] leading-snug text-[#f5e6e6]">
                You do not have permission to access the admin settings.
              </p>
            </div>
          </motion.div>
        )}
        {showDonationThankYou && (
          <motion.div
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] max-w-sm px-6 py-4 rounded-2xl border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-center shadow-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-[var(--aeterna-gold)] font-serif text-sm leading-relaxed">
              Thank you for your thoughtful support.
            </p>
          </motion.div>
        )}
        {showUploadSuccessToast && (
          <motion.div
            role="status"
            aria-live="polite"
            className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 px-4"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.48, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="rounded-2xl border border-white/[0.12] bg-black/72 px-5 py-4 text-center shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <p className="font-[var(--font-serif)] text-[15px] font-medium tracking-tight text-white">
                Memory shared. <span aria-hidden>✨</span>
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/78">
                We&apos;ll notify you when new stories are added.
              </p>
              <form
                onSubmit={handleAfterUploadSubscribe}
                className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3"
              >
                <input
                  type="email"
                  value={afterUploadEmail}
                  onChange={(e) => setAfterUploadEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Your email"
                  className="min-h-[38px] w-full flex-1 rounded-xl border border-white/[0.14] bg-white/[0.06] px-3 text-[13px] text-white placeholder:text-white/38 focus:outline-none focus:ring-1 focus:ring-[var(--aeterna-gold)]/40 sm:min-w-0"
                />
                <button
                  type="submit"
                  disabled={afterUploadLoading || afterUploadDone}
                  className="shrink-0 min-h-[38px] rounded-lg border border-[var(--aeterna-gold)]/35 bg-transparent px-4 text-[12px] font-medium tracking-wide text-[var(--aeterna-gold)] transition-colors hover:bg-[var(--aeterna-gold)]/10 disabled:opacity-50 sm:min-w-[5.5rem]"
                >
                  {afterUploadDone ? "You’re in" : afterUploadLoading ? "Saving…" : "Notify me"}
                </button>
              </form>
              {afterUploadError && (
                <p className="mt-2 text-[11px] text-red-300/95" role="alert">
                  {afterUploadError}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="relative w-full px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <div className="mb-6 aspect-square w-[min(88vw,22rem)] max-w-[90vw] shrink-0 overflow-hidden rounded-full border border-white/[0.12] bg-black/[0.15] shadow-[0_28px_72px_-24px_rgba(0,0,0,0.65)]">
            {profileSrc ? (
              <img src={profileSrc} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.06] font-serif text-[clamp(2.5rem,18vw,4rem)] text-[var(--once-text-muted)]">
                {(event.name ?? "?").charAt(0)}
              </div>
            )}
          </div>
          <h1 className="font-heading max-w-[22ch] font-serif text-2xl font-semibold leading-tight tracking-tight text-[var(--once-text-primary)] sm:text-3xl">
            {event.name}
          </h1>
          <p className="mt-2 text-base font-medium tabular-nums text-[var(--once-text-secondary)] sm:text-lg">
            {birth} — {death}
          </p>

          {showAddStoryCta || isOwner ? (
            <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3 px-1">
              {showAddStoryCta ? (
                <motion.button
                  type="button"
                  onClick={handleOpenForm}
                  className="inline-flex min-h-[52px] max-w-[min(100%,20rem)] items-center justify-center gap-2 rounded-full bg-[var(--aeterna-gold)] px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-charcoal)] shadow-[0_8px_28px_-8px_rgba(197,160,89,0.45)] transition-colors hover:bg-[var(--aeterna-gold-light)]"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={springJelly}
                >
                  <span aria-hidden className="text-lg font-light leading-none">
                    +
                  </span>
                  {addStoryLabel}
                </motion.button>
              ) : null}
              {isOwner ? (
                <Link
                  href={`/p/${slug}/admin`}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--aeterna-gold)] px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-charcoal)] shadow-[0_8px_28px_-8px_rgba(197,160,89,0.45)] transition-colors hover:bg-[var(--aeterna-gold-light)]"
                >
                  Admin
                </Link>
              ) : null}
            </div>
          ) : null}

          {hasDetails ? (
            <details className="mt-6 w-full max-w-md text-left">
              <summary className="cursor-pointer list-none text-center text-[11px] uppercase tracking-[0.28em] text-[var(--once-text-muted)] transition-colors marker:content-none hover:text-[var(--aeterna-gold-muted)] [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center justify-center gap-2">
                  View details
                  <span className="text-[10px] opacity-60" aria-hidden>
                    ▾
                  </span>
                </span>
              </summary>
              <div className="mt-4 space-y-3 border-t border-white/[0.08] pt-4 text-left text-sm leading-relaxed text-[var(--once-text-secondary)]">
                {locationLine ? (
                  <p>
                    <span className="text-[var(--once-text-muted)]">Location · </span>
                    {locationLine}
                  </p>
                ) : null}
                {ceremonyLine ? (
                  <p>
                    <span className="text-[var(--once-text-muted)]">Gathering · </span>
                    {ceremonyLine}
                  </p>
                ) : null}
                {supportLine ? (
                  <p className="break-words">
                    <span className="text-[var(--once-text-muted)]">Support · </span>
                    {supportLine.startsWith("http") ? (
                      <a
                        href={supportLine}
                        className="text-[var(--aeterna-gold)] underline underline-offset-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {supportLine}
                      </a>
                    ) : (
                      supportLine
                    )}
                  </p>
                ) : null}
              </div>
            </details>
          ) : null}

          {photoDeadlineRemainingMs !== null &&
          photoDeadlineRemainingMs > 0 &&
          !isPhotoDeadlinePassed &&
          isPaidMemorial ? (
            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">
              Photo window ·{" "}
              <span className="font-mono tabular-nums text-[var(--aeterna-gold)]">
                {formatMemorialCountdownDisplay(photoDeadlineRemainingMs)}
              </span>
            </p>
          ) : null}
        </div>
      </header>

      {/* Free tier: live trial countdown (creation-aligned deadline, updates every second in parent state) */}
      {event &&
        !isPaidMemorial &&
        photoDeadlineRemainingMs !== null &&
        photoDeadlineRemainingMs > 0 &&
        !isPhotoDeadlinePassed && (
          <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-1 pb-3 sm:pb-4">
            <MemorialTrialCountdown remainingMs={photoDeadlineRemainingMs} />
          </div>
        )}

      {/* Full screen cinematic section (when film_url exists) */}
      {filmReleased && (
        <section
          className="w-full bg-[var(--once-bg)] py-8 md:py-12 animate-[theaterEntrance_1.8s_ease-out_forwards] animate-[fadeInUp_0.85s_ease-out_both]"
          aria-label="AI Memorial Film"
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
              {tributeFilmUrl ? (
                <video
                  src={tributeFilmUrl}
                  controls
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full bg-[var(--aeterna-charcoal-muted)] flex items-center justify-center rounded-lg">
                  <span className="text-[var(--aeterna-gold-muted)] text-sm tracking-[0.2em] uppercase">Film</span>
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
                  transition={spring}
                >
                  {checkoutLoading ? "Redirecting to checkout…" : "Download High-Quality Film"}
                </motion.button>
                {checkoutError && (
                  <p className="text-red-400/90 text-sm text-center">{checkoutError}</p>
                )}
              </div>
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-gold-subtle)]/40 bg-[var(--once-bg)]/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <motion.button
                  type="button"
                  onClick={handleDownloadFilm}
                  disabled={checkoutLoading}
                  className="gold-btn-shimmer w-full min-h-[52px] px-6 py-3.5 rounded-[var(--radius-button)] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-[var(--font-serif)] text-sm tracking-[0.18em] uppercase hover:bg-[var(--aeterna-gold-pale)] disabled:opacity-60"
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                >
                  {checkoutLoading ? "Redirecting…" : "Download High-Quality Film"}
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
              className="relative rounded-2xl overflow-hidden border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)]/95 shadow-[var(--shadow-deep)]"
              aria-label={isPremiumTier ? "AI Memorial Film" : "Memorial collection closed"}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--once-bg)] via-[var(--once-bg-elevated)] to-[var(--once-bg)] pointer-events-none" />

              <div className="relative px-6 py-10 md:py-14">
                <p className="text-center font-heading font-serif text-[var(--aeterna-headline)] text-lg md:text-xl label-uppercase tracking-widest uppercase mb-2">
                  {isPremiumTier ? "The AI Memorial Film is being crafted" : "Photo submission has closed"}
                </p>
                <p className="text-center text-[var(--aeterna-gold-muted)] text-sm label-uppercase tracking-widest mb-8">
                  {isPremiumTier
                    ? "Your memories are being woven into a lasting tribute"
                    : "Thank you for the memories shared here — family and friends can still view the gallery below."}
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
                            className="w-full h-full object-cover"
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
                    Notify me when the film is released
                  </p>
                  {notificationSubmitted ? (
                    <p className="text-center text-[var(--aeterna-gold)] text-sm tracking-wide py-3">
                      Thank you. We&apos;ll notify you when it&apos;s ready.
                    </p>
                  ) : (
                    <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        name="notify_email"
                        required
                        placeholder="Your email"
                        className="flex-1 min-h-[44px] px-4 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)] text-sm"
                      />
                      <motion.button
                        type="submit"
                        disabled={notificationLoading}
                        className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-[var(--font-serif)] text-sm tracking-[0.12em] uppercase disabled:opacity-60 hover:bg-[var(--aeterna-gold-light)]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                      >
                        {notificationLoading ? "Saving…" : "Notify me"}
                      </motion.button>
                    </form>
                  )}
                  {notificationError && (
                    <p className="mt-2 text-center text-red-400/90 text-sm">{notificationError}</p>
                  )}
                </div>
                ) : (
                  <p className="text-center text-sm text-[var(--aeterna-gold-muted)] max-w-md mx-auto">
                    <Link href="/create?plan=film" className="text-[var(--aeterna-gold)] underline underline-offset-2 hover:text-[var(--aeterna-gold-light)]">
                      Upgrade to Premium
                    </Link>{" "}
                    for an AI tribute film on future memorials.
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
          <div className="mx-auto max-w-xl bg-[var(--once-bg)] px-4 py-10">
            <p className="text-center text-sm tracking-wide text-[var(--once-text-muted)]">No memories shared yet.</p>
          </div>
        ) : (
          <>
            {isLocked && lockedCount > 0 && (
              <>
                <div className="max-w-4xl mx-auto px-4 pb-4 flex flex-col items-center gap-3">
                  <p className="text-sm text-[var(--aeterna-headline)] text-center">
                    There are <strong className="text-[var(--aeterna-gold)]">{lockedCount}</strong> more memories from family and friends.
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
                    transition={spring}
                  >
                    {checkoutLoading ? "Redirecting…" : "Unlock all memories"}
                  </motion.button>
                  {checkoutError && (
                    <p className={`text-red-400/90 text-xs ${filmReleased ? "block" : "hidden md:block"}`}>{checkoutError}</p>
                  )}
                </div>
                {!filmReleased && (
                  <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-gold-subtle)]/40 bg-[var(--once-bg)]/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <motion.button
                      type="button"
                      onClick={handleUnlockMemories}
                      disabled={checkoutLoading}
                      className="w-full min-h-[52px] rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm font-medium tracking-[0.12em] uppercase hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                    >
                      {checkoutLoading ? "Redirecting…" : "Unlock all memories"}
                    </motion.button>
                    {checkoutError && <p className="text-red-400/90 text-xs text-center mt-2">{checkoutError}</p>}
                  </div>
                )}
              </>
            )}
            <ul className="grid grid-cols-3 gap-[3px] bg-[var(--once-bg)]">
              {stories.map((story, index) => {
                const isBlurredByPaywall = isLocked && index >= paywallThreshold
                const isBlurred = isBlurredByDeadlineOnly(index) || isBlurredByPaywall
                return (
                  <motion.li
                    key={story.id}
                    className="relative aspect-square cursor-pointer bg-[var(--once-bg)]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.04 * Math.min(index, 12) }}
                  >
                    <motion.button
                      type="button"
                      className={`absolute inset-0 h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--aeterna-gold)]/50 ${isBlurredByPaywall ? "cursor-default" : ""}`}
                      onClick={() => {
                        if (showBlurByDeadline) setShowPremiumBlurPopup(true)
                        else if (!isBlurredByPaywall) setViewerStory(story)
                      }}
                      aria-label={isBlurred ? (showBlurByDeadline ? "Restore with Premium" : "Locked") : "View story"}
                      disabled={isBlurredByPaywall}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {story.image_url ? (
                        <motion.img
                          layoutId={isBlurred ? undefined : `story-img-${story.id}`}
                          src={story.thumb_url ?? story.image_url}
                          alt=""
                          className={`h-full w-full object-cover ${isBlurred ? "blur-[12px] select-none" : ""}`}
                          style={{ opacity: viewerStory?.id === story.id ? 0 : 1 }}
                          transition={spring}
                          draggable={false}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--aeterna-body)] text-xs">
                          Memory
                        </div>
                      )}
                    </motion.button>
                    {isBlurred && (
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35">
                        <svg className="h-7 w-7 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[10px] font-serif uppercase tracking-wider text-white/90">
                          {showBlurByDeadline ? "Premium" : "Locked"}
                        </span>
                      </div>
                    )}
                    {myStoryId === story.id && (
                      <div className="absolute top-2 left-2 right-2 rounded-lg bg-black/70 backdrop-blur-sm p-2.5 text-center">
                        <p className="text-[10px] text-white font-medium mb-2">
                          Your memory is currently <strong className="text-[var(--aeterna-gold)]">#{index + 1}</strong>. Invite friends to leave a heart.
                        </p>
                        <div className="flex flex-wrap items-stretch justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const text = dualRouteShareText || (typeof window !== "undefined" ? window.location.href : "")
                              window.open(
                                `https://wa.me/?text=${encodeURIComponent(text)}`,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }}
                            className="inline-flex min-h-[40px] min-w-[5.25rem] flex-1 items-center justify-center rounded-xl border border-[#25D366]/70 bg-[#25D366]/18 px-2.5 text-[10px] font-semibold text-[#4ADE80] touch-manipulation shadow-[0_2px_12px_rgba(34,197,94,0.2)] active:scale-[0.98] sm:min-h-[36px]"
                          >
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const text = dualRouteShareText || (typeof window !== "undefined" ? window.location.href : "")
                              window.location.href = `sms:?&body=${encodeURIComponent(text)}`
                            }}
                            className="inline-flex min-h-[44px] min-w-[6.5rem] flex-[1.15] items-center justify-center gap-1 rounded-xl border-2 border-[#0A84FF] bg-gradient-to-b from-[#0A84FF]/25 to-[#0A84FF]/10 px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#7DCBFF] shadow-[0_4px_22px_rgba(10,132,255,0.45)] touch-manipulation active:scale-[0.98] sm:min-h-[40px]"
                          >
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const url = typeof window !== "undefined" ? window.location.href : ""
                              void navigator.clipboard.writeText(url).then(() => {
                                if (typeof window !== "undefined") window.alert("Link copied.")
                              })
                            }}
                            className="inline-flex min-h-[40px] min-w-[5rem] flex-1 items-center justify-center rounded-xl border border-white/45 bg-white/10 px-2.5 text-[10px] font-medium text-white touch-manipulation active:scale-[0.98] sm:min-h-[36px]"
                          >
                            Copy link
                          </button>
                        </div>
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
              <div className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)]/80 p-6">
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
              <div className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)]/80 p-6 md:p-8">
                <div className="relative">
                  <p className="text-[var(--aeterna-headline)] whitespace-pre-line font-sans text-sm leading-relaxed blur-md select-none min-h-[80px]">
                    {event.bank_info}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--once-bg-elevated)]/95 rounded-xl py-6 px-4">
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
                      transition={spring}
                    >
                      {donationCheckoutLoading ? "Redirecting to checkout…" : `${donationAmountLabel} support · view account details`}
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
              <p className="mt-3 text-red-400/90 text-sm text-center">{checkoutError}</p>
            )}
          </section>
        )}

        {/* Donation status (social proof) — only when there are records */}
        {event && donationStats && donationStats.count > 0 && (
          <section
            aria-label="Donation status"
            className="mt-10 pt-8 border-t border-[var(--border-gold-subtle)]/50"
          >
            <h2 className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-3">
              Donation status
            </h2>
            <p className="text-[var(--aeterna-headline)] text-sm mb-4">
              So far, <strong className="text-[var(--aeterna-gold)]">{donationStats.count}</strong> people have shared support for the family.
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

      {/* Sticky pill CTA — follows viewport while scrolling */}
      {!filmReleased && !formOpen && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.2 }}
        >
          <div className="pointer-events-auto max-w-lg w-full flex justify-center">
            {isClosed ? (
              <div className="rounded-full border border-white/15 bg-[var(--once-bg)]/95 px-5 py-2.5 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--once-text-muted)] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
                Submissions closed
              </div>
            ) : showAddStoryCta ? (
              <motion.button
                type="button"
                onClick={handleOpenForm}
                aria-label={addStoryLabel}
                className="inline-flex min-h-[50px] w-full max-w-md items-center justify-center gap-2 rounded-full border border-[var(--aeterna-gold)]/35 bg-[var(--aeterna-gold)] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--aeterna-charcoal)] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)] transition-colors hover:bg-[var(--aeterna-gold-light)] sm:px-8"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={springJelly}
              >
                <span aria-hidden className="text-lg font-light leading-none">
                  +
                </span>
                {addStoryLabel}
              </motion.button>
            ) : null}
          </div>
        </motion.div>
      )}

      {/* Memory detail: bottom sheet (mobile) / modal (desktop) + tributes */}
      <AnimatePresence mode="wait">
        {viewerStory && event?.id && (
          <StoryMemoryDrawer
            key="story-viewer"
            story={viewerStory}
            eventId={event.id}
            sessionUser={sessionUser}
            likesCount={likesMap[viewerStory.id] ?? viewerStory.likes_count ?? 0}
            isHearted={heartedIds.has(viewerStory.id)}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-title"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)] shadow-[var(--shadow-deep)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="relative h-[3px] w-full bg-[var(--aeterna-charcoal-muted)]/90">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-r-full bg-[var(--aeterna-gold)]"
                initial={false}
                animate={{ width: `${(shareStep / 3) * 100}%` }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2
                    id="form-title"
                    className="text-[11px] font-sans font-normal text-[var(--aeterna-gold-muted)] tracking-[0.28em] uppercase"
                  >
                    Share a memory
                  </h2>
                  <p className="mt-1.5 text-[10px] font-sans text-[var(--aeterna-gold-muted)]/90 tracking-[0.2em] uppercase tabular-nums">
                    {shareStep} / 3
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={handleCloseForm}
                  className="shrink-0 p-2 text-[var(--once-text-secondary)] hover:text-[var(--once-text-primary)] rounded-lg"
                  aria-label="Close"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
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
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="min-h-[200px] flex flex-col"
                >
                  {shareStep === 1 && (
                    <>
                      <h3 className="font-heading font-serif text-xl md:text-[1.35rem] text-[var(--aeterna-headline)] text-center leading-snug mb-8 mt-2">
                        What is your name?
                      </h3>
                      <input
                        type="text"
                        value={memoryAuthorName}
                        onChange={(e) => setMemoryAuthorName(e.target.value)}
                        autoComplete="name"
                        autoFocus
                        placeholder="Your name"
                        className="w-full min-h-[52px] px-4 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] font-sans text-base text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] placeholder:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)]/70"
                      />
                    </>
                  )}

                  {shareStep === 2 && (
                    <>
                      <h3 className="font-heading font-serif text-xl md:text-[1.35rem] text-[var(--aeterna-headline)] text-center leading-snug mb-6 mt-2">
                        Upload a photo of your memory.
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
                        className="group flex min-h-[168px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/50 px-4 py-8 text-center font-sans transition-colors hover:border-[var(--aeterna-gold-muted)]/60 hover:bg-[var(--aeterna-charcoal-soft)]/40"
                      >
                        <span className="text-sm text-[var(--aeterna-headline)]">
                          {memoryPhotoFile ? "Change photo" : "Tap to choose a photo"}
                        </span>
                        <span className="text-xs text-[var(--aeterna-gold-muted)]">or drag and drop an image here</span>
                      </button>
                      {photoPreviewUrl && (
                        <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border-gold-subtle)]/60">
                          <img src={photoPreviewUrl} alt="" className="max-h-52 w-full object-cover" />
                        </div>
                      )}
                    </>
                  )}

                  {shareStep === 3 && (
                    <>
                      <h3 className="font-heading font-serif text-xl md:text-[1.35rem] text-[var(--aeterna-headline)] text-center leading-snug mb-6 mt-2">
                        Tell us the story behind this photo.
                      </h3>
                      <textarea
                        value={memoryStoryText}
                        onChange={(e) => setMemoryStoryText(e.target.value)}
                        autoFocus
                        rows={5}
                        placeholder="A favorite trip, a quiet everyday moment, or a smile you’ll always remember…"
                        className="w-full resize-none rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] px-4 py-3.5 font-sans text-base leading-relaxed text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] placeholder:opacity-75 focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)]/70"
                      />
                      <p className="mt-6 text-center font-sans text-sm leading-relaxed text-[var(--aeterna-body)] text-balance">
                        {isPremiumTier
                          ? "Your photo might be featured in the 1-minute AI tribute film."
                          : "Thank you for sharing your precious memory."}
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {submitError && (
                <p className="mt-5 text-center font-sans text-sm text-red-400/95" role="alert">
                  {submitError}
                </p>
              )}

              <div className="mt-8 flex gap-3">
                {shareStep > 1 ? (
                  <motion.button
                    type="button"
                    onClick={goShareBack}
                    disabled={submitLoading}
                    className="min-h-[52px] flex-1 rounded-xl border border-[var(--border-gold-subtle)] font-sans text-sm text-[var(--once-text-secondary)] transition-colors hover:bg-white/5 disabled:opacity-50"
                    whileHover={{ scale: submitLoading ? 1 : 1.01 }}
                    whileTap={{ scale: submitLoading ? 1 : 0.99 }}
                    transition={spring}
                  >
                    Back
                  </motion.button>
                ) : null}
                {shareStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={goShareNext}
                    className="min-h-[52px] flex-1 rounded-xl bg-[var(--aeterna-gold)] font-sans text-sm font-medium text-[var(--aeterna-charcoal)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors hover:bg-[var(--aeterna-gold-light)]"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={spring}
                  >
                    Continue
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleSubmitStory}
                    disabled={submitLoading}
                    className="min-h-[52px] flex-1 rounded-xl bg-[var(--aeterna-gold)] font-sans text-sm font-medium text-[var(--aeterna-charcoal)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-colors hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60"
                    whileHover={{ scale: submitLoading ? 1 : 1.01 }}
                    whileTap={{ scale: submitLoading ? 1 : 0.99 }}
                    transition={spring}
                  >
                    {submitLoading ? "Sending…" : "Share this memory"}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>

    </LayoutGroup>
  )
}
