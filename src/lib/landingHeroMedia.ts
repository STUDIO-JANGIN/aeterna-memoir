import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * Locale-specific hero phone imagery. Paths live in /public — replace files to match
 * each market without renaming (e.g. Korean 할머니·가족, Japanese tatami/garden, Arabic thobe/hijab).
 * KO/JA/ZH: right = East Asian elder portrait; left = pets (same asset as EN right).
 * AR: right = Saudi elder with hijab (no niqab); left = pets (same as EN).
 * Default EN/FR/ES keeps the original inclusive campaign art direction.
 */
export function getLandingHeroImages(locale: LandingLocale): {
  portrait: string
  secondary: string
} {
  switch (locale) {
    case "ko":
    case "ja":
    case "zh":
      return {
        portrait: "/landing-hero-east-asian-grandmother.png",
        secondary: "/landing-hero-pets.png",
      }
    case "ar":
      return {
        portrait: "/landing-hero-saudi-grandmother-hijab.png",
        secondary: "/landing-hero-pets.png",
      }
    default:
      return {
        portrait: "/landing-hero-blasian-patriarch.png",
        secondary: "/landing-hero-pets.png",
      }
  }
}
