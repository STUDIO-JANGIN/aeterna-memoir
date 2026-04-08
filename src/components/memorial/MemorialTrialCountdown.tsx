"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ARTISAN_SPRING } from "@/lib/artisanMotion"

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000

/** Swiss-watch style: fixed-width segments so digits do not jump. */
export function formatMemorialCountdownDisplay(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60) % 60
  const h = Math.floor(totalSeconds / 3600) % 24
  const d = Math.floor(totalSeconds / 86400)
  return `${String(d).padStart(2, "0")}d : ${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`
}

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
}

/**
 * Preservation window — aligned to landing: dark surface, gold accents, generous spacing.
 */
export function MemorialTrialCountdown({
  remainingMs,
  className = "",
  variant = "card",
  upgradeHref = "/#pricing",
}: MemorialTrialCountdownProps) {
  const urgent = remainingMs > 0 && remainingMs < TWENTY_FOUR_H_MS
  const line = useMemo(() => formatMemorialCountdownDisplay(remainingMs), [remainingMs])

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
          Preserve this legacy
        </p>
        <p className="text-landing-label mb-2">Time remaining in this gathering window</p>
        <p
          className="font-mono tabular-nums tracking-tight text-[clamp(0.7rem,2.8vw,1rem)] leading-none text-[var(--aeterna-gold)] whitespace-nowrap mx-auto max-w-[100vw] px-1"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {line}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[var(--landing-text-body)] max-w-2xl mx-auto px-1">
          To keep these memories alive forever, please{" "}
          <Link
            href={upgradeHref}
            className="font-medium text-[var(--aeterna-gold)] underline underline-offset-[0.2em] decoration-[var(--aeterna-gold)]/50 hover:text-[var(--aeterna-gold-light)] hover:decoration-[var(--aeterna-gold)] transition-colors"
          >
            upgrade
          </Link>{" "}
          within 7 days. After this window, the shrine will gently close to protect the privacy of the data.
        </p>
      </div>
    </motion.div>
  )
}
