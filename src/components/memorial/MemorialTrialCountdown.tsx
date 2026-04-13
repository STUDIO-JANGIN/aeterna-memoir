"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ARTISAN_SPRING } from "@/lib/artisanMotion"
import type { AppStrings } from "@/lib/appTranslations"

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000

export type MemorialTrialBannerCopy = Pick<
  AppStrings["memorial"],
  | "preserveLegacyHeader"
  | "trialGatheringTimerLabel"
  | "trialCountdownFromMs"
  | "trialUpgradePart1"
  | "trialUpgradeLinkLabel"
  | "trialUpgradePart2"
>

type MemorialTrialCountdownProps = {
  /** Milliseconds remaining until the free trial / collection window ends. */
  remainingMs: number
  className?: string
  /**
   * `banner` = full viewport width, flat sides (e.g. top of memorial feed).
   * `card` = rounded inset card (e.g. admin dashboard).
   */
  variant?: "banner" | "card"
  /** Destination for the “upgrade” link (landing pricing: Eternal Legacy + Eternal Film). */
  upgradeHref?: string
  copy: MemorialTrialBannerCopy
}

/**
 * Preservation window — aligned to landing: dark surface, gold accents, generous spacing.
 */
export function MemorialTrialCountdown({
  remainingMs,
  className = "",
  variant = "card",
  upgradeHref = "/#pricing",
  copy,
}: MemorialTrialCountdownProps) {
  const urgent = remainingMs > 0 && remainingMs < TWENTY_FOUR_H_MS
  const line = useMemo(() => copy.trialCountdownFromMs(remainingMs), [copy, remainingMs])

  const shell =
    variant === "banner"
      ? "relative w-full max-w-none rounded-none border-x-0 border-t border-b border-white/[0.08] bg-[rgba(3,3,3,0.55)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:px-6 sm:py-6"
      : "relative overflow-hidden rounded-2xl card-landing-airy px-5 py-5 sm:px-7 sm:py-6"

  return (
    <motion.div
      role="timer"
      aria-live="polite"
      animate={urgent ? { opacity: [1, 0.96, 1] } : { opacity: 1 }}
      transition={urgent ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : ARTISAN_SPRING}
      className={`${shell} ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(197,160,89,0.12) 1px, rgba(197,160,89,0.12) 2px)",
        }}
        aria-hidden
      />
      <div className="relative text-center">
        <p className="font-[var(--font-serif)] text-base sm:text-lg font-normal tracking-[-0.02em] text-[var(--landing-text-title)] mb-2">
          {copy.preserveLegacyHeader}
        </p>
        <p className="text-landing-label mb-2">{copy.trialGatheringTimerLabel}</p>
        <p
          className="font-mono tabular-nums tracking-tight text-[clamp(0.7rem,2.8vw,1rem)] leading-none text-[var(--aeterna-gold)] whitespace-nowrap mx-auto max-w-[100vw] px-1"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {line}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--landing-text-body)] max-w-2xl mx-auto px-1">
          {copy.trialUpgradePart1}
          {(copy.trialUpgradeLinkLabel ?? "").trim() ? (
            <Link
              href={upgradeHref}
              className="font-medium text-[var(--aeterna-gold)] underline underline-offset-[0.2em] decoration-[var(--aeterna-gold)]/50 hover:text-[var(--aeterna-gold-light)] hover:decoration-[var(--aeterna-gold)] transition-colors"
            >
              {copy.trialUpgradeLinkLabel}
            </Link>
          ) : null}
          {copy.trialUpgradePart2}
        </p>
      </div>
    </motion.div>
  )
}
