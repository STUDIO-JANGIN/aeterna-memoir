import type { Transition } from "framer-motion"

/** Physics-based motion — global spring (mathematical beauty). */
export const ARTISAN_SPRING: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  mass: 1,
}

/** Page / step / modal — momentum, not a flat fade */
export const artisanPresence = {
  initial: { opacity: 0, y: 14, scale: 0.992 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.988 },
} as const
