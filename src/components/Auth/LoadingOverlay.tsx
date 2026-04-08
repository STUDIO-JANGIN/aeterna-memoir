"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

const TEXT_TRANSITION = { duration: 1.2, ease: "easeInOut" } as const

const grainStyle: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat",
  backgroundSize: "128px 128px",
}

function ObsidianSacredCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#030303] px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.02] mix-blend-overlay"
        style={grainStyle}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(420px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), rgba(255,255,255,0.06) 0%, transparent 62%)",
        }}
      />
      <div className="relative z-[2] flex max-w-lg flex-col items-center text-center">{children}</div>
    </div>
  )
}

const welcomeTextClassName =
  "max-w-md font-[var(--font-serif)] text-xl leading-snug text-[#f5f5f7]/80 tracking-[0.05em] sm:text-2xl"

type SacredWelcomeOverlayProps = {
  /** When true, the ritual runs: fade in → dwell → fade out → onExitComplete */
  open: boolean
  onExitComplete?: () => void
  /** After fade-in completes, hold before fade-out (ms). */
  dwellMs?: number
}

/**
 * Sacred welcome ritual: slow fade/scale in, one breath, fade/scale out — then hand off to the app.
 */
export function SacredWelcomeOverlay({ open, onExitComplete, dwellMs = 2400 }: SacredWelcomeOverlayProps) {
  const [textStage, setTextStage] = useState<"in" | "out">("in")
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stageRef = useRef(textStage)
  const exitNotifiedRef = useRef(false)
  stageRef.current = textStage

  useEffect(() => {
    if (open) {
      setTextStage("in")
      exitNotifiedRef.current = false
    }
    return () => {
      if (dwellRef.current) clearTimeout(dwellRef.current)
    }
  }, [open])

  const onTextMotionComplete = useCallback(() => {
    const s = stageRef.current
    if (s === "in") {
      if (dwellRef.current) return
      dwellRef.current = setTimeout(() => {
        setTextStage("out")
        dwellRef.current = null
      }, dwellMs)
      return
    }
    if (s === "out" && !exitNotifiedRef.current) {
      exitNotifiedRef.current = true
      onExitComplete?.()
    }
  }, [dwellMs, onExitComplete])

  return (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key="sacred-veil"
          className="fixed inset-0 z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <ObsidianSacredCanvas>
            <motion.p
              className={welcomeTextClassName}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={
                textStage === "in"
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 1.02 }
              }
              transition={TEXT_TRANSITION}
              onAnimationComplete={onTextMotionComplete}
            >
              Welcome to your sacred space
            </motion.p>
          </ObsidianSacredCanvas>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/** Alias — matches requested filename semantics */
export const LoadingOverlay = SacredWelcomeOverlay

/** Suspense / route shell: obsidian + grain + glow + one gentle in-breath (content swaps when ready). */
export function SacredWelcomeLoadingFallback() {
  return (
    <ObsidianSacredCanvas>
      <motion.p
        className={welcomeTextClassName}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TEXT_TRANSITION}
      >
        Welcome to your sacred space
      </motion.p>
    </ObsidianSacredCanvas>
  )
}
