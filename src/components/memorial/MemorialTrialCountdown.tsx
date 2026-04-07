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
 * Conversion-focused trial timer: creation-aligned deadline (from parent), updates every second via parent state.
 */
export function MemorialTrialCountdown({ remainingMs, className = "" }: MemorialTrialCountdownProps) {
  const urgent = remainingMs > 0 && remainingMs < TWENTY_FOUR_H_MS
  const line = useMemo(() => formatMemorialCountdownDisplay(remainingMs), [remainingMs])

  return (
    <motion.div
      role="timer"
      aria-live="polite"
      animate={
        urgent
          ? { opacity: [1, 0.88, 1] }
          : { opacity: 1 }
      }
      transition={
        urgent
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      className={`
        relative overflow-hidden rounded-2xl border border-[var(--aeterna-gold)]/25
        bg-gradient-to-b from-[var(--once-bg-elevated)]/95 to-black/40
        px-3 py-3 sm:px-5 sm:py-4
        shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_40px_-16px_rgba(0,0,0,0.55)]
        ${urgent ? "ring-1 ring-[var(--aeterna-gold)]/20" : ""}
        ${className}
      `}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(197,160,89,0.15) 1px, rgba(197,160,89,0.15) 2px)",
        }}
        aria-hidden
      />
      <div className="relative text-center">
        <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-1.5 sm:mb-2">
          Secure these memories in:
        </p>
        <p
          className="font-mono tabular-nums tracking-tight text-[clamp(0.65rem,2.8vw,0.95rem)] leading-none text-[var(--aeterna-gold)] whitespace-nowrap mx-auto max-w-[100vw] px-1"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {line}
        </p>
        <p className="mt-2 sm:mt-2.5 text-[10px] sm:text-[11px] leading-snug text-[var(--once-text-secondary)] max-w-md mx-auto px-1">
          Upgrade to a permanent plan before the timer hits zero to preserve this legacy forever.
        </p>
      </div>
    </motion.div>
  )
}
