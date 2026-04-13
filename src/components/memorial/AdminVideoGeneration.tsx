"use client"

import Link from "next/link"
import { Video } from "lucide-react"
import type { AppStrings } from "@/lib/appTranslations"
import type { AdminStory } from "@/app/actions/setStorySelected"
import {
  TRIBUTE_CLIP_COUNT,
  TRIBUTE_FILM_MAX_PHOTOS,
  TRIBUTE_FILM_MIN_PHOTOS,
} from "@/lib/tributeFilmConfig"

export type AdminVideoGenerationProps = {
  memorial: AppStrings["memorial"]
  slug: string
  tributeSlots: (string | null)[]
  clipCreditsRemaining: number
  allTributeClipsComplete: boolean
  filmProcessing: boolean
  generateFilmLoading: boolean
  generateFilmError: string | null
  videoStatusFailed: boolean
  approvedWithImage: AdminStory[]
  selectedCount: number
  filmSelectionHint: string | null
  onFilmPhotoToggle: (story: AdminStory) => void | Promise<void>
  onGenerateFilm: () => void | Promise<void>
}

export function AdminVideoGeneration({
  memorial,
  slug,
  tributeSlots,
  clipCreditsRemaining,
  allTributeClipsComplete,
  filmProcessing,
  generateFilmLoading,
  generateFilmError,
  videoStatusFailed,
  approvedWithImage,
  selectedCount,
  filmSelectionHint,
  onFilmPhotoToggle,
  onGenerateFilm,
}: AdminVideoGenerationProps) {
  const clipsCompleted = tributeSlots.filter((u) => u != null && String(u).length > 0).length
  const minP = TRIBUTE_FILM_MIN_PHOTOS
  const maxP = TRIBUTE_FILM_MAX_PHOTOS
  const selectionValid = selectedCount >= minP && selectedCount <= maxP
  const generateDisabled =
    generateFilmLoading ||
    filmProcessing ||
    clipCreditsRemaining <= 0 ||
    !selectionValid ||
    allTributeClipsComplete

  return (
    <section
      className="card-landing-airy p-6 md:p-10 mb-10 md:mb-12 ring-1 ring-[var(--aeterna-gold)]/20"
      aria-labelledby="ai-tribute-heading"
    >
      <div className="mb-8 pb-6 border-b border-white/[0.08]">
        <p className="text-landing-label mb-2">{memorial.adminTierLabelPremium}</p>
        <h2
          id="ai-tribute-heading"
          className="font-[var(--font-serif)] text-base sm:text-lg font-normal tracking-[-0.02em] text-[var(--landing-text-title)]"
        >
          {memorial.adminPremiumAiTitle}
        </h2>
        <p className="text-landing-body mt-3 max-w-2xl leading-relaxed whitespace-pre-line">
          {memorial.adminPremiumAiDescription}
        </p>
        <p className="text-landing-body mt-4 text-[var(--aeterna-gold)] font-medium tabular-nums max-w-2xl leading-relaxed">
          {memorial.adminPremiumClipsCompletedStatus(clipsCompleted, TRIBUTE_CLIP_COUNT)}
        </p>
      </div>

      {tributeSlots.some((u) => u != null && String(u).length > 0) ? (
        <div className="space-y-6 mb-8">
          <p className="text-landing-label">{memorial.adminPremiumCompletedClipsLabel}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {tributeSlots.map((url, i) =>
              url != null && String(url).length > 0 ? (
                <div
                  key={`clip-${i}`}
                  className="rounded-2xl overflow-hidden border border-white/[0.08] ring-1 ring-[var(--aeterna-gold)]/15 bg-[#030303]/50"
                >
                  <video
                    src={String(url)}
                    controls
                    playsInline
                    className="w-full max-h-[min(40vh,360px)] object-contain bg-[#030303]"
                  >
                    {memorial.videoUnsupported}
                  </video>
                  <p className="text-center text-landing-body py-2">
                    {memorial.adminPremiumClipLabel(i + 1, TRIBUTE_CLIP_COUNT)}
                  </p>
                </div>
              ) : null,
            )}
          </div>
          <Link
            href={`/p/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-landing-gold inline-flex min-h-[52px] w-full max-w-md mx-auto justify-center text-center"
          >
            {memorial.adminPremiumPreviewOnMemorialCta}
          </Link>
        </div>
      ) : null}

      {filmProcessing || generateFilmLoading ? (
        <div className="space-y-6 max-w-xl">
          <p className="text-landing-body leading-relaxed max-w-2xl">{memorial.adminPremiumFilmCraftingTitle}</p>
          <p className="text-landing-body leading-relaxed max-w-2xl">{memorial.adminPremiumFilmCraftingSubtitle}</p>
          <div className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden ring-1 ring-white/[0.06]">
            <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-[var(--aeterna-gold)] via-[var(--aeterna-gold-light)] to-[var(--aeterna-gold)] animate-[goldLoad_2.5s_ease-in-out_infinite]" />
          </div>
        </div>
      ) : videoStatusFailed ? (
        <p className="text-landing-body text-[var(--aeterna-gold-muted)] max-w-2xl leading-relaxed">
          {memorial.adminPremiumFilmFailed}
        </p>
      ) : allTributeClipsComplete ? (
        <p className="text-landing-body max-w-2xl leading-relaxed">{memorial.adminPremiumAllClipsComplete}</p>
      ) : (
        <div className="space-y-8">
          {approvedWithImage.length === 0 ? (
            <p className="text-landing-body max-w-2xl leading-relaxed">{memorial.adminPremiumApprovePhotosFirst}</p>
          ) : (
            <>
              <p className="text-landing-body tabular-nums">
                {memorial.adminPremiumFilmSelectionSummary(selectedCount, maxP)}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {approvedWithImage.map((story) => {
                  const selected = story.is_selected === true
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => onFilmPhotoToggle(story)}
                      aria-pressed={selected}
                      aria-label={
                        selected ? memorial.adminPremiumRemoveFromFilmAria : memorial.adminPremiumIncludeInFilmAria
                      }
                      className={`relative aspect-square rounded-2xl overflow-hidden border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aeterna-gold)] bg-app-soft-surface ${
                        selected
                          ? "ring-2 ring-[var(--aeterna-gold)] border-[var(--aeterna-gold)]/60 shadow-[0_0_32px_-8px_rgba(197,160,89,0.45)]"
                          : "border-white/[0.08] hover:border-[var(--aeterna-gold)]/35 opacity-95 hover:opacity-100"
                      }`}
                    >
                      <img src={story.image_url || ""} alt="" className="h-full w-full object-cover" />
                      <span
                        className={`absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md ${
                          selected
                            ? "bg-[var(--aeterna-gold)] text-[#0a0a0a]"
                            : "bg-[#030303]/50 text-white/90 border border-white/20"
                        }`}
                      >
                        <Video className="h-4 w-4 shrink-0" strokeWidth={selected ? 2.25 : 1.75} aria-hidden />
                      </span>
                    </button>
                  )
                })}
              </div>
              {(filmSelectionHint || generateFilmError) && (
                <p
                  className={`text-landing-body max-w-2xl leading-relaxed ${generateFilmError ? "text-[var(--aeterna-gold-muted)]" : ""}`}
                  role="status"
                >
                  {filmSelectionHint || generateFilmError}
                </p>
              )}
              <div className="flex flex-col items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => void onGenerateFilm()}
                  disabled={generateDisabled}
                  className="btn-landing-gold min-h-[56px] w-full max-w-md px-8 text-[11px] tracking-[0.18em] disabled:opacity-40 disabled:pointer-events-none shadow-[0_16px_48px_-12px_rgba(197,160,89,0.4)]"
                >
                  {memorial.adminPremiumGenerateFilmCta}
                </button>
                {!selectionValid && selectedCount < minP ? (
                  <p className="text-center text-landing-body max-w-2xl leading-relaxed">
                    {memorial.adminPremiumSelectMinGuide}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      )}
      <p className="text-center text-landing-body pt-6 mt-2 border-t border-white/[0.06] max-w-2xl mx-auto leading-relaxed">
        {memorial.adminPremiumFooterTagline}
      </p>
    </section>
  )
}
