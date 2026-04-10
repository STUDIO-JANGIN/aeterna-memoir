import type { LandingLocale } from "@/lib/landingTranslations"

/** Four Stripe currency profiles for landing + checkout. */
export type PricingCurrencyId = "usd" | "krw" | "jpy" | "sar"

/**
 * Amounts per tier [free, legacy/plus, film/premium] in Stripe’s smallest unit:
 * USD/SAR: cents/halalas; KRW/JPY: zero-decimal (whole won/yen).
 */
export const TIER_STRIPE_UNITS: Record<PricingCurrencyId, [number, number, number]> = {
  usd: [0, 1999, 3999],
  krw: [0, 19900, 39900],
  jpy: [0, 2900, 5900],
  sar: [0, 7900, 15900],
}

export function getPricingCurrencyId(locale: LandingLocale): PricingCurrencyId {
  switch (locale) {
    case "ko":
      return "krw"
    case "ja":
      return "jpy"
    case "ar":
      return "sar"
    case "en":
    case "es":
    case "fr":
    case "zh":
    default:
      return "usd"
  }
}

export function stripeCurrencyCode(id: PricingCurrencyId): string {
  return id
}

/** Display line for pricing cards: primary figure + ISO suffix (suffix hidden where redundant). */
export function formatLandingTierPrice(
  currencyId: PricingCurrencyId,
  tierIndex: 0 | 1 | 2,
): { primary: string; suffix: string } {
  const u = TIER_STRIPE_UNITS[currencyId][tierIndex]

  if (currencyId === "usd") {
    if (u === 0) return { primary: "$0", suffix: "USD" }
    return { primary: `$${(u / 100).toFixed(2)}`, suffix: "USD" }
  }
  if (currencyId === "krw") {
    return { primary: `₩${u.toLocaleString("en-US")}`, suffix: "KRW" }
  }
  if (currencyId === "jpy") {
    return { primary: `¥${u.toLocaleString("ja-JP")}`, suffix: "JPY" }
  }
  // sar — units are halalas
  if (u === 0) return { primary: "0", suffix: "SAR" }
  return { primary: `${(u / 100).toFixed(0)}`, suffix: "SAR" }
}

export function landingPlanHref(tierIndex: 0 | 1 | 2, locale: LandingLocale): string {
  const plan = tierIndex === 0 ? "free" : tierIndex === 1 ? "forever" : "film"
  const params = new URLSearchParams()
  params.set("plan", plan)
  params.set("locale", locale)
  return `/create?${params.toString()}`
}

/** Resolve Stripe Price ID for regional checkout; falls back to legacy single-currency env vars for USD. */
export function resolveStripePriceIdPlus(currency: PricingCurrencyId): string | undefined {
  const map: Record<PricingCurrencyId, string | undefined> = {
    usd: process.env.STRIPE_PRICE_ID_PLUS_USD ?? process.env.STRIPE_PRICE_ID_PLUS,
    krw: process.env.STRIPE_PRICE_ID_PLUS_KRW,
    jpy: process.env.STRIPE_PRICE_ID_PLUS_JPY,
    sar: process.env.STRIPE_PRICE_ID_PLUS_SAR,
  }
  const id = map[currency]?.trim()
  return id || undefined
}

/** Short legal-ish line on /create plan step (English UI; amounts follow regional checkout). */
export function getCreateFlowPricingFootnote(currency: PricingCurrencyId): string {
  const m: Record<PricingCurrencyId, string> = {
    usd: "All prices in US dollars (USD).",
    krw: "Charged in Korean won (KRW).",
    jpy: "Charged in Japanese yen (JPY).",
    sar: "Charged in Saudi riyals (SAR).",
  }
  return m[currency]
}

export function resolveStripePriceIdPremium(currency: PricingCurrencyId): string | undefined {
  const map: Record<PricingCurrencyId, string | undefined> = {
    usd: process.env.STRIPE_PRICE_ID_PREMIUM_USD ?? process.env.STRIPE_PRICE_ID_PREMIUM,
    krw: process.env.STRIPE_PRICE_ID_PREMIUM_KRW,
    jpy: process.env.STRIPE_PRICE_ID_PREMIUM_JPY,
    sar: process.env.STRIPE_PRICE_ID_PREMIUM_SAR,
  }
  const id = map[currency]?.trim()
  return id || undefined
}
