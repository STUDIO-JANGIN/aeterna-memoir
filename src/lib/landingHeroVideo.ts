import type { LandingLocale } from "@/lib/landingTranslations"

const DEFAULT_DESKTOP =
  process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL ?? "/hero-bg.mp4"
const ASIA_DESKTOP =
  process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL_ASIA ?? "/hero-bg-asia.mp4"
const GULF_DESKTOP =
  process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL_GULF ?? "/hero-bg-gulf.mp4"

/** Optional lower-bitrate / shorter files for small screens (same aspect, ~720p or heavy compression). */
const DEFAULT_MOBILE = process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL_MOBILE?.trim()
const ASIA_MOBILE = process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL_ASIA_MOBILE?.trim()
const GULF_MOBILE = process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL_GULF_MOBILE?.trim()

function desktopUrlForLocale(locale: LandingLocale): string {
  if (locale === "ko" || locale === "ja" || locale === "zh" || locale === "zh-hk") {
    return ASIA_DESKTOP
  }
  if (locale === "ar") {
    return GULF_DESKTOP
  }
  return DEFAULT_DESKTOP
}

function mobileUrlForLocale(locale: LandingLocale, desktop: string): string {
  let fromEnv: string | undefined
  if (locale === "ko" || locale === "ja" || locale === "zh" || locale === "zh-hk") {
    fromEnv = ASIA_MOBILE
  } else if (locale === "ar") {
    fromEnv = GULF_MOBILE
  } else {
    fromEnv = DEFAULT_MOBILE
  }
  return fromEnv || desktop
}

/**
 * Desktop + optional mobile-optimized hero background clips.
 * When `mobile === desktop`, the page renders a single `<source>` (one request).
 */
export function getLandingHeroBackgroundVideos(locale: LandingLocale): {
  desktop: string
  mobile: string
} {
  const desktop = desktopUrlForLocale(locale)
  const mobile = mobileUrlForLocale(locale, desktop)
  return { desktop, mobile }
}

const MOBILE_MAX_PX = 767

/** Matches Tailwind `md` breakpoint — hero video uses lighter loading on narrow viewports. */
export function isNarrowViewportForHeroVideo(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`).matches
}

/**
 * Desktop: run callback immediately (full preload).
 * Mobile: defer until browser idle so first paint + critical assets aren’t competing with a large MP4.
 */
export function scheduleHeroVideoMount(onReady: () => void, idleTimeoutMs = 900): () => void {
  if (typeof window === "undefined") return () => {}
  if (!isNarrowViewportForHeroVideo()) {
    onReady()
    return () => {}
  }
  const ric = window.requestIdleCallback
  if (typeof ric === "function") {
    const id = ric(() => onReady(), { timeout: idleTimeoutMs })
    return () => window.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(onReady, 320)
  return () => clearTimeout(id)
}
