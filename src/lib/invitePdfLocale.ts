import type { LandingLocale } from "@/lib/landingTranslations"

/** BCP 47 tags for `Intl` date/time formatting in invitation PDFs. */
export function bcp47ForLandingLocale(locale: LandingLocale): string {
  const m: Record<LandingLocale, string> = {
    en: "en-US",
    ko: "ko-KR",
    ja: "ja-JP",
    fr: "fr-FR",
    es: "es-ES",
    ar: "ar-SA",
    zh: "zh-TW",
  }
  return m[locale]
}
