import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * Landing page (/) only: `md+` utility classes in globals.css swap to script-appropriate families.
 * Latin locales (en, fr, es): Playfair titles + Cormorant Garamond body via `html[data-locale]`.
 * KO: Noto Serif KR + Pretendard · JA: Shippori Mincho + Noto Sans JP · zh: Noto TC · ar: Amiri.
 */
export function getLandingLocaleFontClasses(locale: LandingLocale): {
  serif: string
  sans: string
} {
  switch (locale) {
    case "ko":
      return { serif: "landing-ko-serif-md", sans: "landing-ko-sans-md" }
    case "ja":
      return { serif: "landing-ja-serif-md", sans: "landing-ja-sans-md" }
    case "zh":
      return { serif: "landing-zh-serif-md", sans: "landing-zh-sans-md" }
    case "ar":
      return { serif: "landing-ar-sans-md", sans: "landing-ar-sans-md" }
    default:
      return { serif: "", sans: "" }
  }
}

/** Loosen Latin-centric tracking for CJK/Arabic hero titles on desktop. */
export function getLandingHeroTitleTrackingClass(locale: LandingLocale): string {
  switch (locale) {
    case "ko":
    case "ja":
      return "md:tracking-[-0.02em]"
    case "zh":
      return "md:tracking-tight"
    case "ar":
      return "md:tracking-normal"
    default:
      return ""
  }
}
