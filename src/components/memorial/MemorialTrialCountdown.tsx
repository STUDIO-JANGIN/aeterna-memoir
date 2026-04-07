"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"

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
}

/**
 * Preservation window — aligned to landing: dark surface, gold accents, generous spacing.
 */
export function MemorialTrialCountdown({ remainingMs, className = "" }: MemorialTrialCountdownProps) {
  const urgent = remainingMs > 0 && remainingMs < TWENTY_FOUR_H_MS
  const line = useMemo(() => formatMemorialCountdownDisplay(remainingMs), [remainingMs])

  return (
    <motion.div
      role="timer"
      aria-live="polite"
      animate={urgent ? { opacity: [1, 0.96, 1] } : { opacity: 1 }}
      transition={urgent ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl card-landing-airy px-5 py-5 sm:px-7 sm:py-6 ${className}`}
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
        <p className="mt-4 text-sm leading-relaxed text-[var(--landing-text-body)] max-w-md mx-auto px-1">
          To keep these memories alive forever, please upgrade within 7 days. After this window, the shrine will gently
          close to protect the privacy of the data.
        </p>
      </div>
    </motion.div>
  )
}
