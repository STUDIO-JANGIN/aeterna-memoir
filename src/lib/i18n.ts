/**
 * Lightweight i18n for Aeterna (donation / account section).
 * Locale from navigator.language; extend as needed for full app i18n.
 */

export type Locale = "ko" | "en"

export function getLocaleFromBrowser(): Locale {
  if (typeof navigator === "undefined" || !navigator.language) return "en"
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith("ko")) return "ko"
  return "en"
}

const copy: Record<Locale, { donationButton: string; donationButtonLoading: string }> = {
  ko: {
    donationButton: "Support & view account",
    donationButtonLoading: "Redirecting to checkout…",
  },
  en: {
    donationButton: "Support & view account",
    donationButtonLoading: "Redirecting to checkout…",
  },
}

/** UI copy is English-first; `locale` still drives checkout currency where applicable. */
export function getDonationButtonLabel(locale: Locale, loading: boolean): string {
  const c = copy[locale] ?? copy.en
  return loading ? c.donationButtonLoading : c.donationButton
}
