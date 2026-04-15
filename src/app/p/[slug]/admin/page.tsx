"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  MemorialTrialCountdown,
  type MemorialTrialBannerCopy,
} from "@/components/memorial/MemorialTrialCountdown"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import {
  getStoriesForAdminAction,
  setStorySelectedAction,
  type AdminEvent,
  type AdminStory,
} from "@/app/actions/setStorySelected"
import { approveStoryAction, unapproveStoryAction } from "@/app/actions/approveStory"
import { extendDeadlineAction, closeDeadlineNowAction } from "@/app/actions/updateEventDeadline"
import { deleteStoryAction } from "@/app/actions/deleteStory"
import { createPlusCheckoutSessionAction } from "@/app/actions/createPlusCheckoutSession"
import { autoSelectTop20ByLikesAction } from "@/app/actions/autoSelectTop20ByLikes"
import { savePreviewFilmAction } from "@/app/actions/savePreviewFilm"
import { requestFullFilmAction } from "@/app/actions/requestFullFilm"
import { updateEventBySlugAction } from "@/app/actions/updateEventBySlug"
import { generatePreviewVideo } from "@/lib/generatePreviewVideo"
import { getMemorialFundTotalBySlugAction } from "@/app/actions/getMemorialFundTotal"
import { AdminVideoGeneration } from "@/components/memorial/AdminVideoGeneration"
import {
  InvitationActionSheet,
  type InvitationCanvasData,
} from "@/components/memorial/InvitationActionSheet"
import { parseMemorialBackgroundPosition } from "@/lib/memorialBackgroundPosition"
import { formatInvitePdfContactLine } from "@/lib/invitePdfTranslations"
import { usePersistedPricingCurrencyForCreate } from "@/hooks/usePersistedPricingCurrencyForCreate"
import { getAppPricingFootnote } from "@/lib/appTranslations"
import { formatMemorialAdminCheckoutCta } from "@/lib/landingPricing"
import { supabase } from "@/lib/supabase/browser"
import { normalizeTributeSlots, TRIBUTE_FILM_MAX_PHOTOS, TRIBUTE_FILM_MIN_PHOTOS } from "@/lib/tributeFilmConfig"

const MIN_FILM_PHOTOS = TRIBUTE_FILM_MIN_PHOTOS
const MAX_FILM_PHOTOS = TRIBUTE_FILM_MAX_PHOTOS
const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default function AdminPhotoSelectPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : ""
  const { app: tx, locale } = useLandingLocale()
  const pricingCurrency = usePersistedPricingCurrencyForCreate(locale, null)
  const adminPlusCheckoutLabel = useMemo(
    () => formatMemorialAdminCheckoutCta(tx.memorial.adminPreserveForeverCta, 1, pricingCurrency),
    [pricingCurrency, tx.memorial.adminPreserveForeverCta],
  )
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
  const [adminToast, setAdminToast] = useState<string | null>(null)
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false)
  const [showAiWaitlistModal, setShowAiWaitlistModal] = useState(false)

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
  const currentTier = (event?.tier ?? "free") as "free" | "plus" | "premium"
  const isPlusOrPremium = currentTier === "plus" || currentTier === "premium"
  /** Paid via Stripe (Eternal Legacy / Eternal Film) — hide free-tier countdown even if tier column lags. */
  const isPaidMemorial = isPlusOrPremium || event?.is_paid === true

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
  const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : null
  const trialRemainingMs = deadlineMs !== null ? Math.max(0, deadlineMs - countdownNow) : 0

  useEffect(() => {
    if (slug) loadData()
  }, [slug, loadData])

  useEffect(() => {
    const id = window.setInterval(() => setCountdownNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!adminToast) return
    const t = window.setTimeout(() => setAdminToast(null), 3200)
    return () => clearTimeout(t)
  }, [adminToast])

  const invitationCanvasData = useMemo((): InvitationCanvasData | null => {
    if (!event) return null
    const pan = parseMemorialBackgroundPosition(event.profile_image_position ?? null)
    const phone = event.invitation_contact_phone?.trim()
    return {
      name: event.name?.trim() || "Beloved",
      birthDate: event.birth_date,
      deathDate: event.death_date,
      location: event.location,
      ceremonyTime: event.ceremony_time,
      fundLink: event.flower_link,
      profileImageUrl: event.profile_image,
      profileImagePan: pan,
      remembranceBio: event.invitation_bio,
      contactDetailsLine: phone ? formatInvitePdfContactLine(locale, phone) : null,
    }
  }, [event, locale])

  const tributeSlots = useMemo(() => normalizeTributeSlots(event?.tribute_film_urls), [event?.tribute_film_urls])
  const allTributeClipsComplete = tributeSlots.every((u) => u != null && String(u).length > 0)
  const clipCreditsRemaining = typeof event?.video_credits === "number" ? event.video_credits : 0

  const filmProcessing =
    currentTier === "premium" &&
    (event?.video_status === "processing" || event?.video_status === "generating")

  useEffect(() => {
    if (!filmProcessing || !slug) return
    const id = window.setInterval(() => {
      void loadData()
    }, 5000)
    return () => window.clearInterval(id)
  }, [filmProcessing, slug, loadData])

  // Payment-related `as any` is used to avoid strict return-type friction.
  const checkoutSessionOptions = useMemo(
    () => ({
      checkoutLocale: locale,
      pricingCurrency,
      checkoutNavigatorLanguage: typeof navigator !== "undefined" ? navigator.language : undefined,
    }),
    [locale, pricingCurrency],
  )

  const handlePlusCheckout = async () => {
    if (!event || !slug) return
    setPlusCheckoutLoading(true)
    setPlusCheckoutError(null)
    const result: any = await createPlusCheckoutSessionAction(event.id, slug, checkoutSessionOptions)
    setPlusCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setPlusCheckoutError(result.error || "Unable to start checkout.")
    }
  }

  const handleFilmPhotoToggle = async (story: AdminStory) => {
    if (!story.image_url || filmProcessing || allTributeClipsComplete) return
    const isSel = story.is_selected === true
    setFilmSelectionHint(null)
    setGenerateFilmError(null)
    if (isSel) {
      await setStorySelectedAction(story.id, false)
      await loadData()
      return
    }
    if (selectedCount >= MAX_FILM_PHOTOS) {
      setFilmSelectionHint(tx.memorial.adminPremiumMaxPhotosHint(MAX_FILM_PHOTOS))
      return
    }
    await setStorySelectedAction(story.id, true)
    await loadData()
  }

  const handleUnapprove = async (storyId: string) => {
    const res = await unapproveStoryAction(storyId)
    if (res.ok) {
      await loadData()
      setAdminToast(tx.memorial.adminToastStoryMovedToPending)
    }
  }

  const confirmAndDelete = (storyId: string) => {
    if (!window.confirm(tx.memorial.adminDeleteMemoryConfirm)) {
      return
    }
    void deleteStoryAction(storyId).then(() => loadData())
  }

  const handleGenerateFilm = async () => {
    if (!slug || filmProcessing || allTributeClipsComplete) return
    if (clipCreditsRemaining <= 0) {
      setGenerateFilmError(tx.memorial.adminPremiumNoClipCredits)
      return
    }
    if (selectedCount < MIN_FILM_PHOTOS || selectedCount > MAX_FILM_PHOTOS) {
      setGenerateFilmError(
        tx.memorial.adminPremiumFilmSelectRangeError(MIN_FILM_PHOTOS, MAX_FILM_PHOTOS),
      )
      return
    }
    setGenerateFilmLoading(true)
    setGenerateFilmError(null)
    const res = await requestFullFilmAction(slug)
    setGenerateFilmLoading(false)
    if (res.ok) {
      await loadData()
    } else if (res.code === "missing_ai_config") {
      setShowAiWaitlistModal(true)
    } else {
      setGenerateFilmError(res.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-landing-label text-[var(--aeterna-gold)]">{tx.memorial.adminLoadingTitle}</p>
        <p className="text-landing-body max-w-xs text-center">{tx.memorial.adminLoadingSubtitle}</p>
      </div>
    )
  }
  if (!event && error === "Unauthorized.") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-landing px-6 text-center">
        <h1 className="text-landing-section-title max-w-md">{tx.memorial.adminAccessRestrictedTitle}</h1>
        <p className="text-landing-body max-w-md">{tx.memorial.adminAccessRestrictedBody}</p>
        <Link href="/" className="btn-landing-primary">
          {tx.memorial.adminBackToHome}
        </Link>
      </div>
    )
  }
  if (!event) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-landing px-6">
        <h1 className="text-landing-section-title">{tx.memorial.adminNotFoundTitle}</h1>
        <p className="text-landing-body">{tx.memorial.adminNotFoundBody}</p>
      </div>
    )
  }

  const tierLabel =
    currentTier === "free"
      ? tx.memorial.adminTierLabelFree
      : currentTier === "plus"
        ? tx.memorial.adminTierLabelPlus
        : tx.memorial.adminTierLabelPremium

  return (
    <div className="min-h-dvh p-6 md:p-10 md:pb-16">
      {!isPaidMemorial && trialRemainingMs > 0 && (
        <div className="max-w-6xl mx-auto mb-8 md:mb-10 w-full">
          <MemorialTrialCountdown
            remainingMs={trialRemainingMs}
            className="w-full"
            upgradeHref={`/?locale=${encodeURIComponent(locale)}#pricing`}
            copy={memorialTrialBannerCopy}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <header className="mb-8 md:mb-10">
          <div className="card-landing-airy p-6 md:p-10">
            <p className="text-landing-label mb-5">{tx.memorial.adminDashboardKicker}</p>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="space-y-2 min-w-0 flex-1">
                <h1 className="font-[var(--font-serif)] text-base sm:text-lg font-normal tracking-[-0.02em] text-[var(--landing-text-title)]">
                  {event.name}
                </h1>
                <p className="text-landing-body pt-1 max-w-xl leading-relaxed">{tx.memorial.adminDashboardWelcome}</p>
              </div>
              <div className="flex flex-col gap-3 shrink-0 w-full lg:w-auto lg:min-w-[12.5rem]">
                <Link
                  href={`/p/${slug}/admin/settings`}
                  className="btn-landing-gold w-full justify-center min-h-[48px]"
                >
                  {tx.memorial.adminEdit}
                </Link>
                <button
                  type="button"
                  onClick={() => setInviteSheetOpen(true)}
                  className="btn-landing-outline-gold w-full justify-center min-h-[48px]"
                >
                  {tx.memorial.adminSharePdfInvitation}
                </button>
                <Link
                  href={`/p/${slug}`}
                  className="btn-landing-outline-gold w-full justify-center"
                >
                  {tx.memorial.adminBackToFeed}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="card-landing-airy p-6 md:p-10 mb-10 md:mb-12">
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
              <span className="text-landing-label">{tx.memorial.adminCurrentPlan}</span>
              <span className="inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 bg-[var(--aeterna-gold)]/12 text-[var(--aeterna-gold)] text-[10px] font-medium rounded-full uppercase tracking-[0.2em] ring-1 ring-[var(--aeterna-gold)]/35">
                {tierLabel}
              </span>
            </div>
            <p className="text-landing-body mb-8 max-w-2xl leading-relaxed">
              {tx.memorial.adminContributionsCollected(stories.length)}
            </p>
          </>

          {currentTier === "free" && (
            <>
              <div
                id="memorial-preserve-upgrade"
                tabIndex={-1}
                className="scroll-mt-8 flex flex-col sm:flex-row gap-3 items-stretch justify-center w-full max-w-2xl mx-auto"
              >
                <button
                  type="button"
                  onClick={handlePlusCheckout}
                  disabled={plusCheckoutLoading}
                  className="flex-1 min-w-0 min-h-[52px] items-center justify-center px-4 sm:px-6 btn-landing-gold disabled:pointer-events-none inline-flex text-center"
                >
                  {plusCheckoutLoading ? tx.memorial.adminProcessing : adminPlusCheckoutLabel}
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-[var(--aeterna-gold-muted)] max-w-2xl mx-auto">
                {getAppPricingFootnote(tx, pricingCurrency)}
              </p>
            </>
          )}

          {currentTier === "plus" && (
            <p className="text-landing-body max-w-2xl leading-relaxed">
              {tx.memorial.adminPlusPreservedBody}
            </p>
          )}

          {plusCheckoutError ? (
            <p className="mt-6 text-sm text-[var(--aeterna-gold-muted)] text-center" role="alert">
              {plusCheckoutError}
            </p>
          ) : null}
        </div>

        {currentTier === "premium" && event ? (
          <AdminVideoGeneration
            memorial={tx.memorial}
            slug={slug}
            tributeSlots={tributeSlots}
            clipCreditsRemaining={clipCreditsRemaining}
            allTributeClipsComplete={allTributeClipsComplete}
            filmProcessing={filmProcessing}
            generateFilmLoading={generateFilmLoading}
            generateFilmError={generateFilmError}
            videoStatusFailed={event.video_status === "failed"}
            approvedWithImage={approvedRaw.filter((s) => s.image_url)}
            selectedCount={selectedCount}
            filmSelectionHint={filmSelectionHint}
            onFilmPhotoToggle={handleFilmPhotoToggle}
            onGenerateFilm={handleGenerateFilm}
          />
        ) : null}

        <div className="card-landing-airy p-6 md:p-8 mb-6 md:mb-8">
          <h2 className="text-landing-label mb-6">
            {tx.memorial.adminMemoriesSectionTitle}
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
              {tx.memorial.adminTabPending(pending.length)}
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
              {tx.memorial.adminTabApproved(approved.length)}
            </button>
          </div>
        </div>

        {tab === "approved" && approved.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/[0.12] bg-[color:var(--landing-surface)] px-6 py-12 text-center text-landing-body leading-relaxed text-[var(--landing-text-muted)]">
            {tx.memorial.adminApprovedEmpty}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {(tab === "pending" ? pending : approved).map((story) => (
              <div
                key={story.id}
                className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-app-soft-surface shadow-[var(--landing-shadow-deep)]"
              >
                <div className="relative aspect-square bg-[#030303]/50">
                  <img src={story.image_url || ""} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2 p-3 border-t border-white/[0.06] bg-[#030303]/25">
                  {tab === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => approveStoryAction(story.id).then(() => loadData())}
                        className="btn-landing-gold w-full min-h-[44px] justify-center"
                      >
                        {tx.memorial.adminStoryApprove}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmAndDelete(story.id)}
                        className="btn-landing-outline-gold w-full min-h-[40px] justify-center gap-2"
                        aria-label={tx.memorial.adminStoryDeleteAria}
                      >
                        <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {tx.memorial.adminStoryDelete}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleUnapprove(story.id)}
                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] px-4 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--landing-text-hero)] transition-colors hover:bg-white/[0.08] hover:border-white/25"
                      >
                        {tx.memorial.adminStoryUnapprove}
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmAndDelete(story.id)}
                        className="btn-landing-outline-gold w-full min-h-[40px] justify-center gap-2"
                        aria-label={tx.memorial.adminStoryDeletePermanentAria}
                      >
                        <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {tx.memorial.adminStoryDelete}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {adminToast ? (
          <div
            role="status"
            className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[80] w-[min(calc(100vw-2rem),20rem)] -translate-x-1/2 rounded-xl border border-white/[0.1] bg-[#1e1e1e] px-4 py-3 text-center text-[13px] text-[var(--landing-text-hero)] shadow-[var(--landing-shadow-deep)]"
          >
            {adminToast}
          </div>
        ) : null}

        <InvitationActionSheet
          open={inviteSheetOpen}
          onOpenChange={setInviteSheetOpen}
          slug={slug}
          deceasedName={event.name}
          locale={locale}
          memorial={tx.memorial}
          invitationCanvasData={invitationCanvasData}
        />

        {showAiWaitlistModal ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/55 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-waitlist-title"
            onClick={() => setShowAiWaitlistModal(false)}
          >
            <div
              className="card-landing-airy max-w-md w-full p-6 md:p-8 shadow-[var(--landing-shadow-deep)] border border-white/[0.1]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="ai-waitlist-title"
                className="font-[var(--font-serif)] text-lg text-[var(--landing-text-title)] mb-4"
              >
                {tx.memorial.adminPremiumAiWaitlistTitle}
              </h2>
              <p className="text-landing-body leading-relaxed text-[var(--landing-text-body)]">
                {tx.memorial.adminPremiumAiWaitlistBody}
              </p>
              <button
                type="button"
                className="btn-landing-gold w-full mt-8 min-h-[48px] justify-center"
                onClick={() => setShowAiWaitlistModal(false)}
              >
                {tx.common.ok}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}