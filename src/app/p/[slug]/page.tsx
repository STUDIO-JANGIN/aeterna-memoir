"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useMotionValue, useTransform, LayoutGroup } from "framer-motion"
import { supabase } from "@/lib/supabase"
import imageCompression from "browser-image-compression"
import { createStoryAction } from "@/app/actions/createStory"
import { heartStoryAction } from "@/app/actions/heartStory"
import { subscribeNotificationAction } from "@/app/actions/subscribeNotification"
import { subscribeVisitorAction } from "@/app/actions/subscribeVisitor"
import { createCheckoutSessionAction } from "@/app/actions/createCheckoutSession"
import { createDonationCheckoutSessionAction } from "@/app/actions/createDonationCheckoutSession"
import { getDonationStatsAction } from "@/app/actions/getDonationStats"
import { getLocaleFromBrowser, getDonationButtonLabel } from "@/lib/i18n"

const spring = { type: "spring" as const, stiffness: 300, damping: 30 }
const springJelly = { type: "spring" as const, stiffness: 400, damping: 22 }

type FeedEvent = {
  id: string
  name: string | null
  profile_image: string | null
  birth_date: string | null
  death_date: string | null
  collection_end_at: string | null
  expired_at: string | null
  is_paid: boolean | null
  created_at: string | null
  film_url: string | null
  creator_email: string | null
  photo_deadline: string | null
  status: string | null
  is_premium: boolean | null
  tier: string | null
  bank_info: string | null
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

const DRAG_CLOSE_THRESHOLD = 120
const DRAG_VELOCITY_THRESHOLD = 300
const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true"

function StoryViewer({
  story,
  likesCount,
  isHearted,
  onClose,
  onHeart,
  spring,
}: {
  story: Story
  likesCount: number
  isHearted: boolean
  onClose: () => void
  onHeart: () => void
  spring: { type: "spring"; stiffness: number; damping: number }
}) {
  const y = useMotionValue(0)
  const contentOpacity = useTransform(y, [0, DRAG_CLOSE_THRESHOLD], [1, 0.2])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--once-bg)]"
      role="dialog"
      aria-modal="true"
      aria-label="Story"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={spring}
    >
      <motion.button
        type="button"
        onClick={onClose}
        className="absolute right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm text-[var(--once-text-primary)] hover:bg-white/20"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        aria-label="Close"
        whileTap={{ scale: 0.9 }}
        transition={spring}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>

      <motion.div
        className="flex-1 min-h-0 flex flex-col touch-none"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        style={{ y, opacity: contentOpacity }}
        onDragEnd={(_, info) => {
          if (info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > DRAG_VELOCITY_THRESHOLD) {
            onClose()
          }
        }}
      >
        <div
          className="flex-1 min-h-0 flex flex-col"
          onContextMenu={(e) => e.preventDefault()}
        >
          {story.image_url ? (
            <motion.img
              layoutId={`story-img-${story.id}`}
              src={story.thumb_url ?? story.image_url}
              alt=""
              className="w-full flex-1 object-contain bg-[var(--once-bg)] pointer-events-none"
              transition={spring}
              draggable={false}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--aeterna-body)]">
              No image
            </div>
          )}
          <div className="shrink-0 p-6 md:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[var(--once-bg)] to-transparent pointer-events-auto">
            <p className="font-heading font-serif text-lg text-[var(--aeterna-gold)] mb-2">
              {story.author_name ?? "Anonymous"}
            </p>
            <p className="text-sm md:text-base text-[var(--once-text-primary)] leading-relaxed">
              {story.story_text ?? ""}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <motion.button
                type="button"
                onClick={onHeart}
                disabled={isHearted}
                className={`p-2.5 rounded-full ${isHearted ? "text-red-400" : "text-[var(--once-text-secondary)] hover:text-red-400/80"}`}
                aria-label="당신의 사진이 AI 영상에 채택될 수 있습니다"
                title="당신의 사진이 AI 영상에 채택될 수 있습니다"
                whileTap={{ scale: isHearted ? 1 : 1.2 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <svg className="w-6 h-6" fill={isHearted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.button>
              <span className="text-sm text-[var(--once-text-secondary)] tabular-nums">
                ♥ {likesCount}
              </span>
              <span className="text-xs text-[var(--aeterna-gold-muted)] hidden sm:inline">
                당신의 사진이 AI 영상에 채택될 수 있습니다
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

const DONATION_STORAGE_KEY = (s: string) => `aeterna_donation_${s}`

export default function GuestFeedPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug
  const router = useRouter()

  const [event, setEvent] = useState<FeedEvent | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
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
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [myStoryId, setMyStoryId] = useState<string | null>(null)
  const [poppingHeartId, setPoppingHeartId] = useState<string | null>(null)
  const [showPremiumBlurPopup, setShowPremiumBlurPopup] = useState(false)
  const [hasDonatedForBank, setHasDonatedForBank] = useState(false)
  const [revealedBankWithoutDonation, setRevealedBankWithoutDonation] = useState(false)
  const [donationCheckoutLoading, setDonationCheckoutLoading] = useState(false)
  const [showDonationThankYou, setShowDonationThankYou] = useState(false)
  const [platformTipChecked, setPlatformTipChecked] = useState(true)
  const [locale, setLocale] = useState<"ko" | "en">("en")
  const [hasPhotoSelected, setHasPhotoSelected] = useState(false)
  const [showUploadSuccessToast, setShowUploadSuccessToast] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [afterUploadEmail, setAfterUploadEmail] = useState("")
  const [afterUploadLoading, setAfterUploadLoading] = useState(false)
  const [afterUploadError, setAfterUploadError] = useState<string | null>(null)
  const [afterUploadDone, setAfterUploadDone] = useState(false)
  const [donationStats, setDonationStats] = useState<{ count: number; list: { displayLabel: string }[]; recentCount1h: number } | null>(null)

  // 마감 시각: expired_at 우선, 없으면 collection_end_at, 없으면 생성일 + 7일
  const getDeadlineMs = (e: FeedEvent) => {
    if (e.expired_at) return new Date(e.expired_at).getTime()
    if (e.collection_end_at) return new Date(e.collection_end_at).getTime()
    const created = e.created_at ? new Date(e.created_at).getTime() : Date.now()
    return created + 7 * 24 * 60 * 60 * 1000
  }

  // 사진 수집 마감: photo_deadline 우선, 없으면 collection_end_at
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
  const isPremium = event?.tier === "plus" || event?.tier === "premium" || event?.is_premium === true || event?.is_paid === true
  const showBlurByDeadline = isExpired && !isPremium
  const TOP_20_VISIBLE = 20
  // 상태 엔진(Timer): events.photo_deadline 기준 — 수집 중(isExpired=false) / 마감·Blur 단계(isExpired=true). 마감 후 스토리 클릭 시 "Premium 업그레이드 시 복구 가능" 팝업
  const filmReleased = isClosed && !!event?.film_url
  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const s = totalSeconds % 60
    const m = Math.floor(totalSeconds / 60) % 60
    const h = Math.floor(totalSeconds / 3600) % 24
    const d = Math.floor(totalSeconds / 86400)
    return `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserEmail(data.session?.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUserEmail(session?.user?.email ?? null)
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

  // 후원 성공 복귀: URL(donation=success) 또는 localStorage 확인 → 즉시 블러 해제 + 토스트
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

  // 중복 투표 방지: 로컬 스토리지에서 이미 좋아요한 사진 ID 복원
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
    const fetchData = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("id, name, profile_image, birth_date, death_date, collection_end_at, is_paid, created_at, film_url, creator_email, photo_deadline, status, is_premium, tier, bank_info")
          .eq("slug", slug)
          .single()

        if (eventError || !eventData) {
          setError("Memorial not found.")
          setEvent(null)
          setStories([])
          setLoading(false)
          return
        }

        setEvent({
          id: eventData.id,
          name: eventData.name ?? null,
          profile_image: eventData.profile_image ?? null,
          birth_date: eventData.birth_date ?? null,
          death_date: eventData.death_date ?? null,
          collection_end_at: eventData.collection_end_at ?? null,
          expired_at: eventData.collection_end_at ?? null,
          is_paid: eventData.is_paid ?? false,
          created_at: eventData.created_at ?? null,
          film_url: eventData.film_url ?? null,
          creator_email: eventData.creator_email ?? null,
          photo_deadline: eventData.photo_deadline ?? null,
          status: eventData.status ?? null,
          is_premium: eventData.is_premium ?? false,
          tier: eventData.tier ?? null,
          bank_info: eventData.bank_info ?? null,
        })

        const { data: storiesData, error: storiesError } = await supabase
          .from("stories")
          .select("id, author_name, story_text, image_url, likes_count, created_at")
          .eq("event_id", eventData.id)
          .eq("is_approved", true)
          .order("likes_count", { ascending: false, nullsFirst: false })

        if (storiesError) {
          setStories([])
        } else {
          const list = (storiesData ?? []) as Story[]
          setStories(list)
          const map: Record<string, number> = {}
          list.forEach((s) => {
            map[s.id] = s.likes_count ?? 0
          })
          setLikesMap(map)
        }
      } catch {
        setError("Something went wrong while loading.")
        setEvent(null)
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  // When collection is closed, fetch Final Selection for teaser (3–5 images)
  useEffect(() => {
    if (!event?.id || !isClosed) return
    const loadSelected = async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, image_url")
        .eq("event_id", event.id)
        .eq("is_selected", true)
        .limit(5)
      setSelectedStories((data ?? []) as TeaserStory[])
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

  // 따뜻한 후원 현황 (결제 완료된 platform_tip만)
  useEffect(() => {
    if (!slug) return
    getDonationStatsAction(slug).then((res) => {
      if (res.ok) setDonationStats({ count: res.count, list: res.list, recentCount1h: res.recentCount1h })
    })
  }, [slug])

  const handleOpenForm = () => setFormOpen(true)
  const handleCloseForm = () => {
    setFormOpen(false)
    setHasPhotoSelected(false)
    setSubmitError(null)
  }

  const handleShareLink = async () => {
    if (typeof window === "undefined") return
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ url, title: document.title })
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
      }
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // ignore
    }
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
        err instanceof Error ? err.message : "알림 구독 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      )
    }
  }

  const handleSubmitStory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!event) return
    const form = e.currentTarget
    const formData = new FormData(form)
    const fileInput = form.querySelector('input[name="image"]') as HTMLInputElement | null
    const file = fileInput?.files?.[0] ?? null

    if (!file) {
      setSubmitError("Please choose a photo to upload.")
      return
    }

    // 인스타 방식: 브라우저에서 WebP로 압축 + 썸네일 생성 후 서버로 전송
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

      const compressedMain = await imageCompression(file, mainOptions)
      const compressedThumb = await imageCompression(file, thumbOptions)

      const payload = new FormData()
      payload.set("slug", slug)
      payload.set("eventId", event.id)
      payload.set("author_name", (formData.get("author_name") as string) ?? "")
      payload.set("story_text", (formData.get("story_text") as string) ?? "")
      payload.set("image", new File([compressedMain], "photo.webp", { type: "image/webp" }))
      payload.set("thumb", new File([compressedThumb], "photo-thumb.webp", { type: "image/webp" }))

      const result = await createStoryAction(payload)
      if (result?.ok && result?.storyId && typeof window !== "undefined") {
        try {
          const key = `aeterna_my_story_${event.id}`
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
        setTimeout(() => setShowUploadSuccessToast(false), 4000)
      }
      handleCloseForm()
      form.reset()
      setHasPhotoSelected(false)
      const { data } = await supabase
        .from("stories")
        .select("id, author_name, story_text, image_url, thumb_url, likes_count, created_at")
        .eq("event_id", event.id)
        .eq("is_approved", true)
        .order("likes_count", { ascending: false, nullsFirst: false })
      setStories((data ?? []) as Story[])
      const map: Record<string, number> = {}
      ;(data ?? []).forEach((s: Story) => {
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
      // 후원 없이 확인하기는 불가; 체크 유도
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
      setCheckoutError(result.error ?? "결제 시작에 실패했습니다.")
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--once-bg)] font-sans text-[var(--once-text-muted)] text-sm label-uppercase tracking-widest uppercase">
        Loading memorial…
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--once-bg)] font-serif px-6 text-center text-[var(--once-text-primary)]">
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

  const birth = event.birth_date ?? "—"
  const death = event.death_date ?? "—"

  return (
    <LayoutGroup>
    <div className="min-h-screen bg-[var(--once-bg)] text-[var(--once-text-primary)] font-sans">
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
                Premium 업그레이드 시 복구 가능
              </p>
              <p className="text-[var(--aeterna-body)] text-sm mb-6">
                사진 수집 마감이 지나 추억이 보호되고 있습니다. Premium으로 업그레이드하면 다시 보실 수 있습니다.
              </p>
              <motion.button
                type="button"
                onClick={() => setShowPremiumBlurPopup(false)}
                className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                확인
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
                결제 시스템 준비 중입니다
              </p>
              <p className="text-[var(--aeterna-body)] text-sm mb-6">
                곧 안전한 결제로 전체 추억을 잠금 해제할 수 있습니다.
              </p>
              <motion.button
                type="button"
                onClick={() => setShowPaymentComingSoon(false)}
                className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                확인
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDonationThankYou && (
          <motion.div
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] max-w-sm px-6 py-4 rounded-2xl border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-center shadow-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-[var(--aeterna-gold)] font-serif text-sm leading-relaxed">
              따뜻한 후원 감사합니다.
            </p>
          </motion.div>
        )}
        {showUploadSuccessToast && (
          <motion.div
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] max-w-sm px-6 py-4 rounded-2xl border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-center shadow-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="text-[var(--aeterna-gold)] font-serif text-sm leading-relaxed">
              추억을 공유해 주셔서 감사합니다. 이 사진과 이야기가 AI 헌정 영상의 한 장면이 됩니다.
            </p>
            <button
              type="button"
              onClick={handleShareLink}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-[var(--border-gold-subtle)] px-3 py-1 text-[11px] text-[var(--aeterna-gold-muted)] hover:border-[var(--aeterna-gold)] hover:text-[var(--aeterna-gold)] transition-colors"
            >
              이 추모 페이지를 다른 지인에게도 공유하기
            </button>
            {shareCopied && (
              <p className="mt-1 text-[10px] text-[var(--aeterna-gold-muted)]">
                링크가 복사되었습니다. 카카오톡이나 문자에 붙여넣어 주세요.
              </p>
            )}
            <form onSubmit={handleAfterUploadSubscribe} className="mt-3 flex flex-col gap-2">
              <p className="text-[11px] text-[var(--aeterna-gold-muted)]">
                영상이 완성되면 이메일로 가장 먼저 소식을 보내드립니다.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={afterUploadEmail}
                  onChange={(e) => setAfterUploadEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="flex-1 min-h-[36px] px-3 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] text-[11px] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)]"
                />
                <button
                  type="submit"
                  disabled={afterUploadLoading || afterUploadDone}
                  className="min-h-[36px] px-3 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-[11px] font-medium disabled:opacity-60 hover:bg-[var(--aeterna-gold-light)] transition-colors"
                >
                  {afterUploadDone ? "등록 완료" : afterUploadLoading ? "등록 중…" : "알림 받기"}
                </button>
              </div>
              {afterUploadError && (
                <p className="text-[10px] text-red-400 mt-1" role="alert">
                  {afterUploadError}
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero: full-viewport 배경 + 미니멀 White & Gold (once.film style) */}
      <header className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-[var(--once-bg)]">
          {event.profile_image ? (
            <img
              src={event.profile_image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end pb-16 md:pb-24 px-6 md:px-12">
          <div
            className="max-w-4xl animate-[fadeInUp_0.8s_ease-out_both]"
            style={{ animationDelay: "0.1s" }}
          >
            <p className="label-uppercase text-[10px] md:text-xs tracking-widest uppercase text-[var(--aeterna-gold-muted)] mb-2">
              In Loving Memory
            </p>
            <h1 className="font-heading font-serif text-3xl md:text-5xl lg:text-6xl font-light tracking-wide text-[var(--once-text-primary)] mb-2">
              {event.name}
            </h1>
            <p className="text-sm md:text-base text-[var(--once-text-secondary)] tracking-wide mb-4">
              {birth} — {death}
            </p>
            <p className="text-sm md:text-base text-[var(--once-text-primary)] mb-4">
              {(event.name ?? "이 분") + "님과의 소중한 기억을 한 장의 사진으로 채워주세요."}
            </p>
            {!filmReleased && !isClosed && (
              <motion.button
                type="button"
                onClick={handleOpenForm}
                className="inline-flex items-center gap-2 min-h-[52px] px-7 py-3 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm tracking-[0.18em] uppercase shadow-[0_20px_45px_rgba(0,0,0,0.55)] hover:bg-[var(--aeterna-gold-light)] transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={springJelly}
              >
                사진 올리고 AI 영화 출연시키기
              </motion.button>
            )}
          </div>
          {photoDeadlineRemainingMs !== null && (
            <div
              className="mt-8 inline-flex flex-col gap-1 animate-[fadeInUp_0.8s_ease-out_both]"
              style={{ animationDelay: "0.25s" }}
            >
              <p className="label-uppercase text-[10px] tracking-widest uppercase text-[var(--aeterna-gold-muted)]">
                AI 영상 선정 가능성 · 사진 수집 마감
              </p>
              <p
                className={`font-mono text-lg md:text-xl tabular-nums tracking-[0.12em] ${
                  isPhotoDeadlinePassed ? "text-white/60" : "text-[var(--aeterna-gold)]"
                }`}
              >
                {isPhotoDeadlinePassed ? "00d 00h 00m 00s" : formatCountdown(photoDeadlineRemainingMs)}
              </p>
            </div>
          )}
          {!isPremium && remainingMs !== null && remainingMs > 0 && (
            <div
              className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-black/35 border border-red-500/50 px-4 py-2.5 animate-[fadeInUp_0.8s_ease-out_both]"
              style={{ animationDelay: "0.35s" }}
            >
              <span className="text-sm">⏳</span>
              <div className="flex flex-col items-start">
                <p className="text-[11px] tracking-[0.16em] uppercase text-red-300/80">
                  7일 후 데이터 영구 삭제
                </p>
                <p className="text-xs text-red-100">
                  이 앨범은 생성일 기준 7일 뒤 자동으로 사라집니다. Plus 또는 Premium으로 업그레이드하면 평생 보관할 수 있어요.
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 7일 삭제 경고: Free 플랜이고 수집 기간 중일 때 */}
      {event && (event.tier === "free" || (!event.is_paid && !event.is_premium)) && photoDeadlineRemainingMs !== null && photoDeadlineRemainingMs > 0 && (
        <div className="bg-red-950/40 border-y border-red-800/50 px-4 py-3 text-center">
          <p className="text-sm font-medium text-red-100 tracking-[0.04em]">
            7일 이내에 업그레이드하지 않으면 모든 데이터가 영구 삭제됩니다.
          </p>
          <p className="text-xs text-red-200/90 mt-1">
            Plus 또는 Premium으로 업그레이드하면 추억을 영구 보관할 수 있습니다.
          </p>
        </div>
      )}

      {/* 시간 남음: AI 영상 참여 독려 (Gamify) */}
      {!filmReleased && !isClosed && photoDeadlineRemainingMs !== null && photoDeadlineRemainingMs > 0 && (
        <div className="bg-[var(--aeterna-gold-pale)]/20 border-y border-[var(--border-gold-subtle)] px-4 py-3 text-center">
          <p className="text-sm font-medium text-[var(--aeterna-headline)] tracking-[0.04em] mb-1">
            당신의 사진이 AI 영상에 채택될 수 있습니다
          </p>
          <p className="text-sm text-[var(--aeterna-body)] tracking-[0.04em]">
            사진 1장과 에피소드를 남겨 주시면 좋아요 순으로 <strong className="text-[var(--aeterna-gold)]">AI 추모 영상</strong>에 반영됩니다.
          </p>
        </div>
      )}

      {/* Full Screen Cinematic — 영상 공개 시 (film_url 있음) */}
      {filmReleased && (
        <section
          className="w-full bg-[var(--once-bg)] py-8 md:py-12 animate-[theaterEntrance_1.8s_ease-out_forwards] animate-[fadeInUp_0.85s_ease-out_both]"
          aria-label="AI Memorial Film"
        >
          {/* 은은한 골드 글로우 behind video */}
          <div className="relative w-full flex justify-center px-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[70vh] max-h-[720px] pointer-events-none rounded-lg animate-[goldGlowPulse_5s_ease-in-out_infinite]"
              style={{
                background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(197,160,89,0.14) 0%, transparent 65%)",
              }}
            />
            {/* 비디오 영역: w-full, h-[70vh], object-cover */}
            <div className="relative w-full h-[70vh] max-h-[720px] max-w-6xl mx-auto overflow-hidden rounded-lg">
              <div className="absolute inset-0 rounded-lg shadow-[0_0_80px_rgba(197,160,89,0.12)] pointer-events-none" />
              {event?.film_url ? (
                <video
                  src={event.film_url}
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
          {/* Download High-Quality Film — Stripe 결제 연결 */}
          <div className="w-full max-w-6xl mx-auto px-4 mt-8 flex flex-col items-center gap-3">
            <motion.button
              type="button"
              onClick={handleDownloadFilm}
              disabled={checkoutLoading}
              className="gold-btn-shimmer min-h-[52px] px-8 py-3.5 rounded-[var(--radius-button)] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-serif text-sm tracking-[0.2em] uppercase hover:bg-[var(--aeterna-gold-pale)] disabled:opacity-60"
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
        </section>
      )}

      {/* Share a Memory / AI Film Preview crafting (when closed, film not yet released) */}
      {!filmReleased && (
        <div className="max-w-4xl mx-auto px-4 mb-10 animate-[fadeInUp_0.85s_ease-out_both]">
          {isClosed ? (
            <section
              className="relative rounded-2xl overflow-hidden border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)]/95 shadow-[var(--shadow-deep)]"
              aria-label="AI Memorial Film"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--once-bg)] via-[var(--once-bg-elevated)] to-[var(--once-bg)] pointer-events-none" />

              <div className="relative px-6 py-10 md:py-14">
                <p className="text-center font-heading font-serif text-[var(--aeterna-headline)] text-lg md:text-xl label-uppercase tracking-widest uppercase mb-2">
                  The AI Memorial Film is being crafted
                </p>
                <p className="text-center text-[var(--aeterna-gold-muted)] text-sm label-uppercase tracking-widest mb-8">
                  Your memories are being woven into a lasting tribute
                </p>

                <div className="max-w-md mx-auto h-1 rounded-full bg-[var(--aeterna-charcoal-muted)] overflow-hidden mb-12">
                  <div
                    className="h-full w-1/3 min-w-[80px] rounded-full bg-gradient-to-r from-transparent via-[#C5A059] to-transparent shadow-[0_0_12px_rgba(197,160,89,0.6)] animate-[goldLoad_2s_ease-in-out_infinite]"
                  />
                </div>

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
                        className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm tracking-[0.12em] uppercase disabled:opacity-60 hover:bg-[var(--aeterna-gold-light)]"
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
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* Immersive Feed: Shared element transition (layoutId) → fullscreen */}
      <main className="animate-[fadeInUp_0.85s_ease-out_both] [animation-delay:0.18s]">
        {stories.length === 0 ? (
          <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-[var(--once-text-muted)] tracking-widest uppercase bg-[var(--once-bg)]">
            No memories shared yet.
          </div>
        ) : (
          <>
            {/* Top 3 Most Loved — 가로 스크롤 */}
            {stories.length >= 1 && (
              <section className="mb-8" aria-label="Most loved memories">
                <h2 className="px-4 mb-4 text-sm font-serif text-[var(--aeterna-gold)] tracking-[0.2em] uppercase">
                  가장 사랑받는 추억 (Most Loved)
                </h2>
                <div className="overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
                  <ul className="flex gap-4 px-4 min-w-0">
                    {stories.slice(0, 3).map((story, index) => {
                      const rank = index + 1
                      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"
                      const medalBg = rank === 1 ? "from-amber-400/90 to-yellow-600/90" : rank === 2 ? "from-gray-300/90 to-gray-500/90" : "from-amber-600/90 to-amber-800/90"
                      const isBlurredByPaywall = isLocked && index >= paywallThreshold
                      const isBlurredTop = isBlurredByDeadlineOnly(index) || isBlurredByPaywall
                      return (
                        <motion.li
                          key={story.id}
                          className="flex-shrink-0 w-[min(280px,75vw)]"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...spring, delay: 0.08 * index }}
                        >
                          <motion.button
                            type="button"
                            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[var(--once-bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)] block text-left"
                            onClick={() => {
                              if (showBlurByDeadline) setShowPremiumBlurPopup(true)
                              else if (!isBlurredByPaywall) setViewerStory(story)
                            }}
                            disabled={false}
                            whileHover={!isBlurredTop ? { scale: 1.02 } : undefined}
                            whileTap={!isBlurredTop ? { scale: 0.98 } : undefined}
                            transition={spring}
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            {story.image_url ? (
                              <img
                                src={story.image_url}
                                alt=""
                                className={`w-full h-full object-cover ${isBlurredTop ? "blur-[12px]" : ""}`}
                                draggable={false}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--aeterna-body)] text-sm">
                                Memory
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            {isBlurredTop && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 pointer-events-none">
                                <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-xs font-serif text-white/90 tracking-wider uppercase">
                                  {showBlurByDeadline ? "Premium으로 복구" : "Locked"}
                                </span>
                              </div>
                            )}
                            <div className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg bg-gradient-to-br ${medalBg}`}>
                              {medal}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className="text-white font-serif text-sm truncate">
                                {story.author_name ?? "Anonymous"}
                              </p>
                              <p className="text-[var(--aeterna-gold)] font-mono text-xl font-semibold tabular-nums mt-0.5">
                                ♥ {likesMap[story.id] ?? story.likes_count ?? 0}
                              </p>
                            </div>
                          </motion.button>
                        </motion.li>
                      )
                    })}
                  </ul>
                </div>
              </section>
            )}

            {isLocked && lockedCount > 0 && (
              <div className="max-w-4xl mx-auto px-4 pb-4 flex flex-col items-center gap-3">
                <p className="text-sm text-[var(--aeterna-headline)] text-center">
                  지인들이 남긴 <strong className="text-[var(--aeterna-gold)]">{lockedCount}개</strong>의 추억이 더 있습니다.
                </p>
                <motion.button
                  type="button"
                  onClick={handleUnlockMemories}
                  disabled={checkoutLoading}
                  className="min-h-[48px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif text-sm font-medium tracking-[0.12em] uppercase hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                >
                  {checkoutLoading ? "이동 중…" : "전체 잠금 해제하기"}
                </motion.button>
                {checkoutError && (
                  <p className="text-red-400/90 text-xs">{checkoutError}</p>
                )}
              </div>
            )}
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px md:gap-0.5 bg-[var(--once-bg)]">
              {stories.map((story, index) => {
                const isBlurredByPaywall = isLocked && index >= paywallThreshold
                const isBlurred = isBlurredByDeadlineOnly(index) || isBlurredByPaywall
                return (
                  <motion.li
                    key={story.id}
                    className="group relative aspect-square bg-[var(--once-bg-elevated)] cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.06 * Math.min(index, 14) }}
                  >
                    <motion.button
                      type="button"
                      className={`absolute inset-0 w-full h-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--aeterna-gold)] ${isBlurredByPaywall ? "cursor-default" : ""}`}
                      onClick={() => {
                        if (showBlurByDeadline) setShowPremiumBlurPopup(true)
                        else if (!isBlurredByPaywall) setViewerStory(story)
                      }}
                      aria-label={isBlurred ? (showBlurByDeadline ? "Premium으로 복구" : "Locked") : "View story"}
                      disabled={isBlurredByPaywall}
                      whileHover={isBlurred ? undefined : { scale: 1.02 }}
                      whileTap={isBlurred ? undefined : { scale: 0.98 }}
                      transition={spring}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      {story.image_url ? (
                        <motion.img
                          layoutId={isBlurred ? undefined : `story-img-${story.id}`}
                          src={story.thumb_url ?? story.image_url}
                          alt=""
                          className={`w-full h-full object-cover ${isBlurred ? "blur-[12px] select-none" : ""}`}
                          style={{ opacity: viewerStory?.id === story.id ? 0 : 1 }}
                          transition={spring}
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--aeterna-body)] text-xs">
                          Memory
                        </div>
                      )}
                    </motion.button>
                    {isBlurred && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 pointer-events-none">
                        <svg className="w-8 h-8 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xs font-serif text-white/90 tracking-wider uppercase">
                          {showBlurByDeadline ? "Premium으로 복구" : "Locked"}
                        </span>
                      </div>
                    )}
                    {!isBlurred && (
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/85 to-transparent flex items-end justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-[var(--once-text-primary)] truncate block">
                            {story.author_name ?? "Anonymous"}
                          </span>
                          <span className="text-[10px] text-[var(--once-text-secondary)] tabular-nums">
                            ♥ {likesMap[story.id] ?? story.likes_count ?? 0}
                          </span>
                        </div>
                        <div className="relative flex flex-col items-end shrink-0">
                          {poppingHeartId === story.id && (
                            <motion.span
                              className="absolute inset-0 flex items-center justify-center pointer-events-none text-red-400"
                              initial={{ scale: 0.8, opacity: 1 }}
                              animate={{ scale: 2.2, opacity: 0 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            >
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </motion.span>
                          )}
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!heartedIds.has(story.id)) {
                                setPoppingHeartId(story.id)
                                handleHeart(story.id)
                                setTimeout(() => setPoppingHeartId(null), 520)
                              }
                            }}
                            disabled={heartedIds.has(story.id)}
                            className={`relative z-10 p-2 rounded-full shrink-0 ${
                              heartedIds.has(story.id) ? "text-red-400" : "text-[var(--once-text-secondary)] hover:text-red-400/80"
                            }`}
                            aria-label="당신의 사진이 AI 영상에 채택될 수 있습니다"
                            whileTap={{ scale: heartedIds.has(story.id) ? 1 : 1.2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            title="당신의 사진이 AI 영상에 채택될 수 있습니다"
                          >
                            <svg className="w-5 h-5" fill={heartedIds.has(story.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </motion.button>
                          <span className="absolute -top-6 right-0 w-[max(140px,20vw)] text-[9px] text-white/90 bg-black/70 rounded px-2 py-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-normal text-right z-10">
                            당신의 사진이 AI 영상에 채택될 수 있습니다
                          </span>
                        </div>
                      </div>
                    )}
                    {myStoryId === story.id && (
                      <div className="absolute top-2 left-2 right-2 rounded-lg bg-black/70 backdrop-blur-sm p-2.5 text-center">
                        <p className="text-[10px] text-white font-medium mb-1.5">
                          내 사진이 현재 <strong className="text-[var(--aeterna-gold)]">{index + 1}위</strong>입니다! 친구들에게 하트를 부탁하세요
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={`https://story.kakao.com/share?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 min-h-[28px] px-2.5 rounded-lg bg-[#FEE500] text-[#191919] text-[10px] font-medium"
                          >
                            카톡 공유
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const url = typeof window !== "undefined" ? window.location.href : ""
                              navigator.clipboard.writeText(url).then(() => {
                                if (typeof window !== "undefined") window.alert("링크가 복사되었습니다.")
                              })
                            }}
                            className="inline-flex items-center min-h-[28px] px-2.5 rounded-lg border border-white/50 text-white text-[10px]"
                          >
                            링크 복사
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

        {/* 조의금 섹션: 카드/Apple Pay/Google Pay 연동, 1% 수수료 고지 */}
        {event.bank_info && (
          <section className="max-w-4xl mx-auto px-4 py-10 md:py-12 border-t border-[var(--border-gold-subtle)]/50 mt-12">
            <h2 className="text-sm font-serif text-[var(--aeterna-gold)] tracking-[0.2em] uppercase mb-1">
              조의금 (기부)
            </h2>
            <p className="text-[10px] text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-4">카드 · Apple Pay · Google Pay</p>
            {hasDonatedForBank || revealedBankWithoutDonation ? (
              <div className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)]/80 p-6">
                {hasDonatedForBank && (
                  <p className="text-[var(--aeterna-gold-muted)] text-xs leading-relaxed mb-4">
                    후원해주신 덕분에 Aeterna가 추억을 더 오랫동안 보관할 수 있게 되었습니다.
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
                      조의금 계좌 정보를 확인하려면 소액 후원 후 열람할 수 있습니다.
                    </p>
                    <p className="text-sm text-[var(--aeterna-gold-muted)] mb-2">
                      가족을 위해 1% 수수료를 함께 부담해 주세요. Aeterna 운영 수수료 1%가 포함됩니다.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer text-left max-w-md px-2">
                      <input
                        type="checkbox"
                        checked={platformTipChecked}
                        onChange={(e) => setPlatformTipChecked(e.target.checked)}
                        className="mt-1 rounded border-[var(--border-gold-subtle)] text-[var(--aeterna-gold)] focus:ring-[var(--aeterna-gold)]"
                      />
                      <span className="text-sm text-[var(--aeterna-body)]">
                        유족이 조의금을 100% 전달받으실 수 있도록, 서비스 운영비 1,000원을 대신 후원해 주시겠습니까?
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
                      {donationCheckoutLoading ? "결제 페이지로 이동 중…" : "1,000원 후원하고 계좌 보기"}
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
                      후원 없이 정보 보기
                    </button>
                    <p className="text-[10px] text-[var(--aeterna-gold-muted)] mt-3" aria-label="Recent Support">
                      Recent Support · 최근 1시간 내에 <strong className="text-[var(--aeterna-gold-muted)]">{donationStats?.recentCount1h != null && donationStats.recentCount1h > 0 ? donationStats.recentCount1h : 3}</strong>명의 지인이 따뜻한 후원을 보탰습니다.
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

        {/* 따뜻한 후원 현황 (사회적 증거) */}
        {event && (
          <section
            aria-label="따뜻한 후원 현황"
            className="mt-10 pt-8 border-t border-[var(--border-gold-subtle)]/50"
          >
            <h2 className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-3">
              따뜻한 후원 현황
            </h2>
            {donationStats && donationStats.count > 0 ? (
              <>
                <p className="text-[var(--aeterna-headline)] text-sm mb-4">
                  현재까지 <strong className="text-[var(--aeterna-gold)]">{donationStats.count}명</strong>의 지인이 유족에게 마음을 전했습니다.
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--aeterna-body)]">
                  {donationStats.list.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-[var(--aeterna-gold-muted)]" aria-hidden>·</span>
                      {item.displayLabel}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-[var(--aeterna-gold-muted)]">
                아직 후원 내역이 없습니다. 첫 번째 마음을 전해 보세요.
              </p>
            )}
          </section>
        )}
      </main>

      {/* FAB: Share a Memory (수집 기간 내) / 종료 메시지 (만료 후) */}
      {!filmReleased && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 z-40 bottom-fab"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.4 }}
        >
          {isClosed ? (
            <div className="flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-full border border-[var(--border-gold-subtle)] bg-[var(--once-bg)]/90 backdrop-blur-md text-[var(--aeterna-gold-muted)] font-serif text-xs tracking-[0.16em] uppercase">
              추억 수집이 종료되었습니다
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={handleOpenForm}
              className="flex items-center gap-2 min-h-[52px] px-6 py-3 rounded-full border border-[var(--border-gold-subtle)] bg-[var(--once-bg)]/80 backdrop-blur-md text-[var(--aeterna-gold)] font-serif text-sm tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(0,0,0,0.4)] hover:bg-[var(--once-bg-elevated)] hover:border-[var(--aeterna-gold-muted)]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.92 }}
              transition={springJelly}
            >
              <span className="text-base" aria-hidden>+</span>
              Share a Memory
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Full-screen Story Viewer: Shared element + Swipe to close */}
      <AnimatePresence mode="wait">
        {viewerStory && (
          <StoryViewer
            key="story-viewer"
            story={viewerStory}
            likesCount={likesMap[viewerStory.id] ?? viewerStory.likes_count ?? 0}
            isHearted={heartedIds.has(viewerStory.id)}
            onClose={() => setViewerStory(null)}
            onHeart={() => handleHeart(viewerStory.id)}
            spring={spring}
          />
        )}
      </AnimatePresence>

      {/* Share a Memory modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="form-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--once-bg-elevated)] shadow-[var(--shadow-deep)] p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                id="form-title"
                className="text-lg font-heading font-serif text-[var(--aeterna-headline)] tracking-[0.08em]"
              >
                Share a Memory
              </h2>
              <motion.button
                type="button"
                onClick={handleCloseForm}
                className="p-2 text-[var(--once-text-secondary)] hover:text-[var(--once-text-primary)] rounded-lg"
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

            <form onSubmit={handleSubmitStory} className="space-y-5">
              <div>
                <label htmlFor="author_name" className="block text-xs text-[var(--aeterna-gold-muted)] label-uppercase tracking-widest uppercase mb-1.5">
                  Your name
                </label>
                <input
                  id="author_name"
                  name="author_name"
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="w-full min-h-[48px] px-4 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)]"
                />
              </div>
              <div>
                <label htmlFor="story_text" className="block text-xs text-[var(--aeterna-gold-muted)] label-uppercase tracking-widest uppercase mb-1.5">
                  이 사진에 담긴 따뜻한 에피소드를 들려주세요
                </label>
                <textarea
                  id="story_text"
                  name="story_text"
                  required
                  rows={3}
                  placeholder="예: 마지막으로 함께한 가족 여행, 고인이 가장 좋아하던 미소가 담긴 날 등 한 줄로 적어주세요."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold-muted)] resize-none"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-xs text-[var(--aeterna-gold-muted)] label-uppercase tracking-widest uppercase mb-1.5">
                  Photo · AI 영화 출연 기회
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setHasPhotoSelected(!!e.target.files?.length)}
                  className="w-full text-sm text-[var(--aeterna-body)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--aeterna-gold)] file:text-[var(--aeterna-charcoal)] file:font-serif"
                />
                {hasPhotoSelected && (
                  <div className="mt-3 rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/80 px-4 py-3 flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-[var(--aeterna-gold-pale)]/20 flex items-center justify-center text-[var(--aeterna-gold)]">
                      ✨
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold text-[var(--aeterna-gold)] mb-0.5">
                        당신의 사진이 AI 헌정 영상의 주인공이 될 확률이 높습니다!
                      </p>
                      <p className="text-[var(--aeterna-gold-muted)]">
                        지금 올린 한 장의 사진이, 나중에 1분짜리 마법 영화 속 한 장면으로 등장할 수 있어요. 현재{" "}
                        {stories.length > 0 ? Math.min(95, 50 + stories.length * 3) : 85}%가 참여 중입니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {submitError && (
                <p className="text-sm text-red-400">{submitError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 min-h-[48px] rounded-xl border border-[var(--border-gold-subtle)] text-[var(--once-text-secondary)] hover:bg-white/5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 min-h-[48px] rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-serif disabled:opacity-60 hover:bg-[var(--aeterna-gold-light)]"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                >
                  {submitLoading ? "Submitting…" : "Submit"}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

      {/* Admin-only: Back to Admin (visible when signed-in creator views the guest feed) */}
      {slug && event && currentUserEmail && event.creator_email !== null && event.creator_email !== undefined && currentUserEmail === event.creator_email && (
        <motion.a
          href={`/p/${slug}/admin`}
          className="fixed bottom-6 right-6 z-40 min-h-[44px] px-4 py-2.5 rounded-full border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/95 backdrop-blur text-[var(--aeterna-gold-muted)] font-serif text-xs uppercase tracking-[0.14em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors shadow-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          Back to Admin
        </motion.a>
      )}
    </LayoutGroup>
  )
}
