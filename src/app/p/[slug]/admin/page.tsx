"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import {
  getStoriesForAdminAction,
  setStorySelectedAction,
  type AdminEvent,
  type AdminStory,
} from "@/app/actions/setStorySelected"
import { approveStoryAction } from "@/app/actions/approveStory"
import { extendDeadlineAction, closeDeadlineNowAction } from "@/app/actions/updateEventDeadline"
import { deleteStoryAction } from "@/app/actions/deleteStory"
import { createCheckoutSessionAction } from "@/app/actions/createCheckoutSession"
import { createPremiumCheckoutSessionAction } from "@/app/actions/createPremiumCheckoutSession"
import { createPremiumUsdCheckoutSessionAction } from "@/app/actions/createPremiumUsdCheckoutSession"
import { createFinalWarningCheckoutSessionAction } from "@/app/actions/createFinalWarningCheckoutSession"
import { createPlusCheckoutSessionAction } from "@/app/actions/createPlusCheckoutSession"
import { createPremiumTierCheckoutSessionAction } from "@/app/actions/createPremiumTierCheckoutSession"
import { autoSelectTop20ByLikesAction } from "@/app/actions/autoSelectTop20ByLikes"
import { savePreviewFilmAction } from "@/app/actions/savePreviewFilm"
import { requestFullFilmAction } from "@/app/actions/requestFullFilm"
import { updateEventBySlugAction } from "@/app/actions/updateEventBySlug"
import { generatePreviewVideo } from "@/lib/generatePreviewVideo"
import { getMemorialFundTotalBySlugAction } from "@/app/actions/getMemorialFundTotal"
import { supabase } from "@/lib/supabase/browser"

const MAX_SELECTED = 15
/** Luma tribute film: selected approved photos */
const MIN_FILM_PHOTOS = 5
const MAX_FILM_PHOTOS = 10
const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default function AdminPhotoSelectPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : ""

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [stories, setStories] = useState<AdminStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"pending" | "approved">("pending")
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deadlineUpdating, setDeadlineUpdating] = useState<"extend" | "close" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [premiumCheckoutLoading, setPremiumCheckoutLoading] = useState(false)
  const [premiumCheckoutError, setPremiumCheckoutError] = useState<string | null>(null)
  const [premiumUsdCheckoutLoading, setPremiumUsdCheckoutLoading] = useState(false)
  const [premiumUsdCheckoutError, setPremiumUsdCheckoutError] = useState<string | null>(null)
  const [showPaymentComingSoon, setShowPaymentComingSoon] = useState(false)
  const [countdownNow, setCountdownNow] = useState(() => Date.now())
  const [approvedSort, setApprovedSort] = useState<"likes" | "recent">("likes")
  const [autoSelectDone, setAutoSelectDone] = useState(false)
  const [previewGenerating, setPreviewGenerating] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [fullFilmRequesting, setFullFilmRequesting] = useState(false)
  const [fullFilmMessage, setFullFilmMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [testPreviewGenerating, setTestPreviewGenerating] = useState(false)
  const [testPreviewBlobUrl, setTestPreviewBlobUrl] = useState<string | null>(null)
  const [testPreviewError, setTestPreviewError] = useState<string | null>(null)
  const [bankInfoDraft, setBankInfoDraft] = useState("")
  const [bankInfoSaving, setBankInfoSaving] = useState(false)
  const [bankInfoMessage, setBankInfoMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [showMaxSelectedMessage, setShowMaxSelectedMessage] = useState(false)
  const [showCongratsPopup, setShowCongratsPopup] = useState(false)
  const hasShown12Congrats = useRef(false)
  const [showRipeMemoriesPopup, setShowRipeMemoriesPopup] = useState(false)
  const hasShown10Ripe = useRef(false)
  const [finalWarningCheckoutLoading, setFinalWarningCheckoutLoading] = useState(false)
  const [finalWarningCheckoutError, setFinalWarningCheckoutError] = useState<string | null>(null)
  const [finalWarningDismissed, setFinalWarningDismissed] = useState(false)
  const [plusCheckoutLoading, setPlusCheckoutLoading] = useState(false)
  const [plusCheckoutError, setPlusCheckoutError] = useState<string | null>(null)
  const [generateFilmLoading, setGenerateFilmLoading] = useState(false)
  const [generateFilmError, setGenerateFilmError] = useState<string | null>(null)
  const [filmSelectionHint, setFilmSelectionHint] = useState<string | null>(null)
  const [aiMood, setAiMood] = useState<"grand" | "warm" | "calm">("warm")
  const [aiPreviewIndex, setAiPreviewIndex] = useState(0)
  const [aiLabError, setAiLabError] = useState<string | null>(null)
  const [fundTotalCents, setFundTotalCents] = useState<number | null>(null)
  const [fundCurrency, setFundCurrency] = useState<string | null>(null)
  const [showMoreThemesNudge, setShowMoreThemesNudge] = useState(false)
  const hasShownMoreThemesNudge = useRef(false)
  const [showFilmArrivedLayer, setShowFilmArrivedLayer] = useState(false)
  const hasShownFilmArrived = useRef(false)

  const pending = stories.filter((s) => !s.is_approved)
  const approvedRaw = stories.filter((s) => s.is_approved)
  const approved =
    approvedSort === "recent"
      ? [...approvedRaw].sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        )
      : approvedRaw
  const selectedCount = approved.filter((s) => s.is_selected === true).length
  const selectedForVideo = approved.filter((s) => s.is_selected === true)
  const currentTier = (event?.tier ?? "free") as "free" | "plus" | "premium"
  const isPlusOrPremium = currentTier === "plus" || currentTier === "premium"

  const loadData = useCallback(async () => {
    if (!slug) {
      setError("Invalid URL: missing slug.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { event: e, stories: list, error: err } = await getStoriesForAdminAction(slug)
    setEvent(e ?? null)
    setStories(list)
    if (err) setError(err)
    setLoading(false)
  }, [slug])

  const deadlineAt = event?.expired_at ?? event?.collection_end_at
  const nowMs = countdownNow

  useEffect(() => {
    if (slug) loadData()
  }, [slug, loadData])

  const filmProcessing =
    currentTier === "premium" &&
    !event?.full_film_url &&
    event?.video_status !== "failed" &&
    (!!event?.full_film_requested_at ||
      event?.video_status === "processing" ||
      event?.video_status === "generating")

  useEffect(() => {
    if (!filmProcessing || !slug) return
    const id = window.setInterval(() => {
      void loadData()
    }, 5000)
    return () => window.clearInterval(id)
  }, [filmProcessing, slug, loadData])

  // Payment-related `as any` is used to avoid strict return-type friction.
  const handlePlusCheckout = async () => {
    if (!event || !slug) return
    setPlusCheckoutLoading(true)
    setPlusCheckoutError(null)
    const result: any = await createPlusCheckoutSessionAction(event.id, slug)
    setPlusCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setPlusCheckoutError(result.error || "Unable to start checkout.")
    }
  }

  const handlePremiumUpgrade = async () => {
    if (!event || !slug) return
    setPremiumUsdCheckoutLoading(true)
    setPremiumUsdCheckoutError(null)
    const result: any = await createPremiumTierCheckoutSessionAction(event.id, slug)
    setPremiumUsdCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setPremiumUsdCheckoutError(result.error || "Unable to start checkout.")
    }
  }

  const handleFilmPhotoToggle = async (story: AdminStory) => {
    if (!story.image_url || filmProcessing || event?.full_film_url) return
    const isSel = story.is_selected === true
    setFilmSelectionHint(null)
    setGenerateFilmError(null)
    if (isSel) {
      await setStorySelectedAction(story.id, false)
      await loadData()
      return
    }
    if (selectedCount >= MAX_FILM_PHOTOS) {
      setFilmSelectionHint(`You can choose up to ${MAX_FILM_PHOTOS} photos for the film.`)
      return
    }
    await setStorySelectedAction(story.id, true)
    await loadData()
  }

  const handleGenerateFilm = async () => {
    if (!slug || filmProcessing || event?.full_film_url) return
    if (selectedCount < MIN_FILM_PHOTOS || selectedCount > MAX_FILM_PHOTOS) {
      setGenerateFilmError(`Select between ${MIN_FILM_PHOTOS} and ${MAX_FILM_PHOTOS} approved photos.`)
      return
    }
    setGenerateFilmLoading(true)
    setGenerateFilmError(null)
    const res = await requestFullFilmAction(slug)
    setGenerateFilmLoading(false)
    if (res.ok) {
      await loadData()
    } else {
      setGenerateFilmError(res.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-landing px-6">
        <p className="text-landing-label text-[var(--aeterna-gold)]">Loading</p>
        <p className="text-landing-body max-w-xs text-center">Preparing your memorial dashboard…</p>
      </div>
    )
  }
  if (!event && error === "Unauthorized.") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-landing px-6 text-center">
        <h1 className="text-landing-section-title max-w-md">Access restricted</h1>
        <p className="text-landing-body max-w-md">You don&apos;t have access to this dashboard.</p>
        <Link href="/" className="btn-landing-primary">
          Back to home
        </Link>
      </div>
    )
  }
  if (!event) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-landing px-6">
        <h1 className="text-landing-section-title">Not found</h1>
        <p className="text-landing-body">This memorial could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-landing text-[var(--landing-text-hero)] font-[var(--font-sans)] antialiased p-6 md:p-10 md:pb-16">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 md:mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 md:gap-8">
          <div className="space-y-2 min-w-0">
            <p className="text-landing-label">Dashboard</p>
            <h1 className="font-[var(--font-serif)] text-[clamp(1.5rem,4vw,2.125rem)] font-normal leading-tight tracking-[-0.02em] text-[var(--landing-text-title)]">
              {event.name}
            </h1>
            <p className="text-landing-body text-left pt-1 max-w-xl">
              Curate submissions, upgrade your plan, and share the memorial with those who loved them.
            </p>
          </div>
          <Link
            href={`/p/${slug}`}
            className="btn-landing-primary shrink-0 self-start sm:self-center"
          >
            Back to feed
          </Link>
        </header>

        <div className="card-landing-airy p-6 md:p-10 mb-10 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
            <span className="text-landing-label">Current plan</span>
            <span className="inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 bg-[var(--aeterna-gold)]/15 text-[var(--aeterna-gold)] text-[10px] font-medium rounded-full uppercase tracking-[0.2em] ring-1 ring-[var(--aeterna-gold)]/35">
              {currentTier}
            </span>
          </div>

          <p className="text-landing-body mb-8 max-w-2xl">
            <span className="font-[var(--font-serif)] text-lg text-[var(--landing-text-hero)] not-italic tabular-nums">
              {stories.length}
            </span>{" "}
            precious memories have been collected.
          </p>

          {currentTier === "free" && (
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:gap-5">
              <button
                type="button"
                onClick={handlePlusCheckout}
                disabled={plusCheckoutLoading}
                className="flex flex-1 min-w-0 min-h-[52px] items-center justify-center px-5 btn-landing-gold disabled:pointer-events-none"
              >
                {plusCheckoutLoading ? "Processing…" : "Upgrade — $19.99 · Forever"}
              </button>
              <button
                type="button"
                onClick={handlePremiumUpgrade}
                disabled={premiumUsdCheckoutLoading}
                className="flex flex-1 min-w-0 min-h-[52px] items-center justify-center px-5 btn-landing-outline-gold disabled:pointer-events-none"
              >
                {premiumUsdCheckoutLoading ? "Processing…" : "Premium — $39.99 · AI film"}
              </button>
            </div>
          )}

          {currentTier === "plus" && (
            <div className="flex flex-col sm:flex-row items-center justify-center">
              <button
                type="button"
                onClick={handlePremiumUpgrade}
                disabled={premiumUsdCheckoutLoading}
                className="w-full sm:max-w-md min-h-[52px] flex items-center justify-center px-6 btn-landing-outline-gold disabled:pointer-events-none"
              >
                {premiumUsdCheckoutLoading ? "Processing…" : "Upgrade to Premium — $39.99 · AI tribute film"}
              </button>
            </div>
          )}

          {(plusCheckoutError || premiumUsdCheckoutError) && (
            <p className="mt-6 text-sm text-red-400/90 text-center" role="alert">
              {plusCheckoutError || premiumUsdCheckoutError}
            </p>
          )}
        </div>

        {currentTier === "premium" && (
          <section
            className="card-landing-airy p-6 md:p-10 mb-10 md:mb-12 border border-[var(--aeterna-gold)]/25 bg-[var(--aeterna-gold)]/[0.03] shadow-[0_0_80px_-24px_rgba(197,160,89,0.35)]"
            aria-labelledby="ai-tribute-heading"
          >
            <div className="mb-8 pb-6 border-b border-white/[0.08]">
              <p className="text-landing-label mb-2">Premium</p>
              <h2
                id="ai-tribute-heading"
                className="font-[var(--font-serif)] text-2xl md:text-[1.75rem] font-normal tracking-[-0.02em] text-[var(--landing-text-title)]"
              >
                Create Your AI Cinematic Tribute
              </h2>
              <p className="text-landing-body mt-3 max-w-2xl">
                Choose {MIN_FILM_PHOTOS}–{MAX_FILM_PHOTOS} approved photos. Our AI weaves them into a gentle, cinematic memorial film powered by Luma.
              </p>
            </div>

            {event.full_film_url ? (
              <div className="space-y-6">
                <p className="text-landing-body text-[var(--landing-text-muted)]">
                  Your tribute is live on the memorial and ready to share.
                </p>
                <div className="rounded-2xl overflow-hidden border border-white/[0.1] ring-1 ring-[var(--aeterna-gold)]/20 shadow-[var(--landing-shadow-deep)] bg-black/40">
                  <video
                    src={event.full_film_url}
                    controls
                    playsInline
                    className="w-full max-h-[min(56vh,520px)] object-contain bg-black"
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
                <Link
                  href={`/p/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-landing-gold inline-flex min-h-[52px] w-full max-w-md mx-auto justify-center text-center"
                >
                  Preview on memorial
                </Link>
              </div>
            ) : filmProcessing || generateFilmLoading ? (
              <div className="space-y-6 max-w-xl">
                <p className="font-[var(--font-serif)] text-lg text-[var(--landing-text-hero)] leading-relaxed">
                  Our AI is crafting your masterpiece… this may take 1–2 minutes.
                </p>
                <p className="text-landing-body">
                  You can leave this page — we&apos;ll update the memorial when the film is ready. This page refreshes automatically.
                </p>
                <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden ring-1 ring-white/[0.06]">
                  <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-[var(--aeterna-gold)] via-[var(--aeterna-gold-light)] to-[var(--aeterna-gold)] animate-[goldLoad_2.5s_ease-in-out_infinite]" />
                </div>
              </div>
            ) : event.video_status === "failed" ? (
              <p className="text-sm text-red-400/90">
                Something went wrong during rendering. Please contact support — we can restore your film credit and help you retry.
              </p>
            ) : (
              <div className="space-y-8">
                {approvedRaw.filter((s) => s.image_url).length === 0 ? (
                  <p className="text-landing-body text-[var(--landing-text-muted)]">
                    Approve guest photos in the Memories section below, then return here to build your film.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-landing-label">Selected for film</p>
                      <p className="text-landing-body tabular-nums">
                        <span className="text-[var(--aeterna-gold)] font-medium">{selectedCount}</span> / {MAX_FILM_PHOTOS}{" "}
                        <span className="text-[var(--landing-text-muted)]">(min {MIN_FILM_PHOTOS})</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                      {approvedRaw
                        .filter((s) => s.image_url)
                        .map((story) => {
                          const selected = story.is_selected === true
                          return (
                            <button
                              key={story.id}
                              type="button"
                              onClick={() => void handleFilmPhotoToggle(story)}
                              className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aeterna-gold)] ${
                                selected
                                  ? "ring-2 ring-[var(--aeterna-gold)] border-[var(--aeterna-gold)]/60 shadow-[0_0_32px_-8px_rgba(197,160,89,0.45)]"
                                  : "border-white/[0.1] hover:border-white/25 opacity-90 hover:opacity-100"
                              }`}
                            >
                              <img src={story.image_url || ""} alt="" className="h-full w-full object-cover" />
                              <span
                                className={`absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md ${
                                  selected
                                    ? "bg-[var(--aeterna-gold)] text-[#0a0a0a]"
                                    : "bg-black/50 text-white/90 border border-white/20"
                                }`}
                              >
                                <Star className={`h-4 w-4 ${selected ? "fill-[#0a0a0a]" : ""}`} strokeWidth={1.75} />
                              </span>
                            </button>
                          )
                        })}
                    </div>
                    {(filmSelectionHint || generateFilmError) && (
                      <p
                        className={`text-sm ${generateFilmError ? "text-red-400/90" : "text-amber-200/90"}`}
                        role="status"
                      >
                        {filmSelectionHint || generateFilmError}
                      </p>
                    )}
                    <div className="flex flex-col items-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => void handleGenerateFilm()}
                        disabled={
                          generateFilmLoading ||
                          selectedCount < MIN_FILM_PHOTOS ||
                          selectedCount > MAX_FILM_PHOTOS
                        }
                        className="btn-landing-gold min-h-[56px] w-full max-w-md px-8 text-[11px] tracking-[0.18em] disabled:opacity-40 disabled:pointer-events-none shadow-[0_16px_48px_-12px_rgba(197,160,89,0.4)]"
                      >
                        Generate AI Tribute Film
                      </button>
                      {selectedCount < MIN_FILM_PHOTOS && (
                        <p className="text-landing-body text-center text-[var(--landing-text-muted)] text-sm">
                          Select at least {MIN_FILM_PHOTOS} photos to continue.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        <div className="mb-6 md:mb-8">
          <h2 className="font-[var(--font-serif)] text-xl md:text-2xl font-normal tracking-[-0.02em] text-[var(--landing-text-title)] mb-6">
            Memories
          </h2>
          <div
            className="flex w-full max-w-xl mx-auto md:mx-0 items-stretch justify-center gap-2 border-b border-white/[0.08]"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "pending"}
              onClick={() => setTab("pending")}
              className={`flex flex-1 min-h-[52px] items-center justify-center px-3 text-landing-nav font-medium border-b-2 transition-colors duration-200 ${
                tab === "pending"
                  ? "border-[var(--aeterna-gold)] text-[var(--aeterna-gold)]"
                  : "border-transparent text-[var(--landing-text-muted)] hover:text-[var(--landing-text-body)]"
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "approved"}
              onClick={() => setTab("approved")}
              className={`flex flex-1 min-h-[52px] items-center justify-center px-3 text-landing-nav font-medium border-b-2 transition-colors duration-200 ${
                tab === "approved"
                  ? "border-[var(--aeterna-gold)] text-[var(--aeterna-gold)]"
                  : "border-transparent text-[var(--landing-text-muted)] hover:text-[var(--landing-text-body)]"
              }`}
            >
              Approved ({approved.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {(tab === "pending" ? pending : approved).map((story) => (
            <div
              key={story.id}
              className="relative aspect-square bg-black/35 rounded-2xl overflow-hidden group border border-white/[0.08] shadow-[var(--landing-shadow-deep)] ring-1 ring-white/[0.04]"
            >
              <img src={story.image_url || ""} alt="" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 px-2">
                {tab === "pending" ? (
                  <button
                    type="button"
                    onClick={() => approveStoryAction(story.id).then(() => loadData())}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[var(--aeterna-gold)] px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#0a0a0a] shadow-[0_8px_24px_-6px_rgba(197,160,89,0.45)] hover:bg-[var(--aeterna-gold-light)] transition-colors"
                  >
                    Approve
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStorySelectedAction(story.id, !story.is_selected).then(() => loadData())}
                    className={
                      story.is_selected
                        ? "inline-flex min-h-[40px] items-center justify-center rounded-full bg-[var(--aeterna-gold)] px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-[#0a0a0a] shadow-[0_8px_24px_-6px_rgba(197,160,89,0.45)]"
                        : "inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/25 bg-black/45 px-4 text-[9px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm hover:bg-white/15"
                    }
                  >
                    {story.is_selected ? "Selected" : "Select"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteStoryAction(story.id).then(() => loadData())}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600/95 text-white shadow-lg hover:bg-red-500 transition-colors"
                  aria-label="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}