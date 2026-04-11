import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * Locale-specific hero phone imagery. Paths live in /public — replace files to match
 * each market without renaming (e.g. Korean 할머니·가족, Japanese tatami/garden, Arabic thobe/hijab).
 * KO/JA/ZH: right mockup uses a warm East Asian elder portrait (direct gaze).
 * AR: right mockup uses a warm Saudi elder portrait with hijab (face visible, no niqab).
 * Default EN/FR/ES keeps the original inclusive campaign art direction.
 */
export function getLandingHeroImages(locale: LandingLocale): {
  portrait: string
  secondary: string
} {
  switch (locale) {
    case "ko":
    case "ja":
      return {
        portrait: "/landing-hero-grandmother.png",
        secondary: "/landing-hero-east-asian-grandmother.png",
      }
    case "zh":
      return {
        portrait: "/landing-hero-blasian-patriarch.png",
        secondary: "/landing-hero-east-asian-grandmother.png",
      }
    case "ar":
      return {
        portrait: "/landing-hero-blasian-patriarch.png",
        secondary: "/landing-hero-saudi-grandmother-hijab.png",
      }
    default:
      return {
        portrait: "/landing-hero-blasian-patriarch.png",
        secondary: "/landing-hero-pets.png",
      }
  }
}
