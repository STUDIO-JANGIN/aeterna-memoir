import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * Locale-specific hero phone imagery. Paths live in /public — replace files to match
 * each market without renaming (e.g. Korean 할머니·가족, Japanese tatami/garden, Arabic thobe/hijab).
 * Default EN/FR/ES keeps the original inclusive campaign art direction.
 */
export function getLandingHeroImages(locale: LandingLocale): {
  portrait: string
  secondary: string
} {
  switch (locale) {
    case "ko":
      return {
        portrait: "/landing-hero-grandmother.png",
        secondary: "/landing-hero-pets.png",
      }
    case "ja":
      return {
        portrait: "/landing-hero-grandmother.png",
        secondary: "/landing-connect-grandma-01.png",
      }
    case "ar":
      return {
        portrait: "/landing-hero-blasian-patriarch.png",
        secondary: "/landing-hero-pets.png",
      }
    default:
      return {
        portrait: "/landing-hero-blasian-patriarch.png",
        secondary: "/landing-hero-pets.png",
      }
  }
}
