import type { LandingLocale } from "@/lib/landingTranslations"

/** Four Stripe currency profiles for landing + checkout. */
export type PricingCurrencyId = "usd" | "krw" | "jpy" | "sar"

export const PRICING_CURRENCY_IDS: PricingCurrencyId[] = ["usd", "krw", "jpy", "sar"]

export const LANDING_PRICING_CURRENCY_KEY = "aeterna.landing.pricingCurrency"
/** When `"1"`, the user picked a currency manually; changing language resets it. */
export const LANDING_PRICING_MANUAL_KEY = "aeterna.landing.pricingManual"

export function isPricingCurrencyId(value: string | null | undefined): value is PricingCurrencyId {
  return value === "usd" || value === "krw" || value === "jpy" || value === "sar"
}

/** ISO 3166-1 alpha-2 from geo IP → checkout profile (Step 1: first load). */
export function countryCodeToPricingCurrency(country: string | null | undefined): PricingCurrencyId {
  if (!country) return "usd"
  const c = country.trim().toUpperCase()
  if (c === "KR") return "krw"
  if (c === "JP") return "jpy"
  if (c === "SA" || c === "AE") return "sar"
  return "usd"
}

const GRID_FOOTNOTE_EN: Record<PricingCurrencyId, string> = {
  usd: "All prices in US dollars (USD).",
  krw: "All prices in Korean won (KRW).",
  jpy: "All prices in Japanese yen (JPY).",
  sar: "All prices in Saudi riyals (SAR).",
}

const GRID_FOOTNOTE_KO: Record<PricingCurrencyId, string> = {
  usd: "가격은 미국 달러(USD) 기준입니다.",
  krw: "모든 가격은 원화(KRW) 기준입니다.",
  jpy: "가격은 일본 엔(JPY) 기준입니다.",
  sar: "가격은 사우디 리얄(SAR) 기준입니다.",
}

const GRID_FOOTNOTE_JA: Record<PricingCurrencyId, string> = {
  usd: "表示は米ドル（USD）です。",
  krw: "表示は韓国ウォン（KRW）です。",
  jpy: "表示価格はすべて日本円（JPY）です。",
  sar: "表示はサウジアラビア リヤル（SAR）です。",
}

const GRID_FOOTNOTE_AR: Record<PricingCurrencyId, string> = {
  usd: "جميع الأسعار بالدولار الأمريكي (USD).",
  krw: "جميع الأسعار بالوون الكوري (KRW).",
  jpy: "جميع الأسعار بالين الياباني (JPY).",
  sar: "جميع الأسعار بالريال السعودي (SAR).",
}

const GRID_FOOTNOTE_ZH: Record<PricingCurrencyId, string> = {
  usd: "所有價格均以美金（USD）計價。",
  krw: "所示金額均以韓元（KRW）為單位。",
  jpy: "所示金額均以日圓（JPY）為單位。",
  sar: "所示金額均以沙特里亞爾（SAR）為單位。",
}

const GRID_FOOTNOTE_ES: Record<PricingCurrencyId, string> = {
  usd: "Todos los precios están expresados en dólares estadounidenses (USD).",
  krw: "Los importes se muestran en won surcoreano (KRW).",
  jpy: "Los importes se muestran en yen japonés (JPY).",
  sar: "Los importes se muestran en riyal saudí (SAR).",
}

const GRID_FOOTNOTE_FR: Record<PricingCurrencyId, string> = {
  usd: "Tous les prix sont indiqués en dollars américains (USD).",
  krw: "Les montants sont affichés en won coréen (KRW).",
  jpy: "Les montants sont affichés en yen japonais (JPY).",
  sar: "Les montants sont affichés en riyal saoudien (SAR).",
}

/** Landing pricing grid footnote line (dynamic by selected currency + UI language). */
export function getLandingGridFootnote(locale: LandingLocale, currency: PricingCurrencyId): string {
  switch (locale) {
    case "ko":
      return GRID_FOOTNOTE_KO[currency]
    case "ja":
      return GRID_FOOTNOTE_JA[currency]
    case "ar":
      return GRID_FOOTNOTE_AR[currency]
    case "zh":
    case "zh-hk":
      return GRID_FOOTNOTE_ZH[currency]
    case "es":
      return GRID_FOOTNOTE_ES[currency]
    case "fr":
      return GRID_FOOTNOTE_FR[currency]
    case "en":
    default:
      return GRID_FOOTNOTE_EN[currency]
  }
}

export function dispatchPricingCurrencyUpdated(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("aeterna-pricing-currency"))
}

export function readPersistedLandingPricingCurrency(): PricingCurrencyId | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LANDING_PRICING_CURRENCY_KEY)
    return isPricingCurrencyId(raw) ? raw : null
  } catch {
    return null
  }
}

export function writePersistedLandingPricingCurrency(
  currency: PricingCurrencyId,
  options: { manual: boolean },
): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LANDING_PRICING_CURRENCY_KEY, currency)
    if (options.manual) {
      localStorage.setItem(LANDING_PRICING_MANUAL_KEY, "1")
    } else {
      localStorage.removeItem(LANDING_PRICING_MANUAL_KEY)
    }
    dispatchPricingCurrencyUpdated()
  } catch {
    /* ignore */
  }
}

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
    case "zh-hk":
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

/** `/p/[slug]/admin` free-tier upgrade buttons — title + regional price (matches landing `TIER_STRIPE_UNITS`). */
export function formatMemorialAdminCheckoutCta(
  title: string,
  tierIndex: 1 | 2,
  currencyId: PricingCurrencyId,
): string {
  const { primary, suffix } = formatLandingTierPrice(currencyId, tierIndex)
  const pricePart = suffix ? `${primary} ${suffix}` : primary
  return `${title} — ${pricePart}`
}

export function landingPlanHref(
  tierIndex: 0 | 1 | 2,
  locale: LandingLocale,
  pricingCurrency?: PricingCurrencyId,
): string {
  const plan = tierIndex === 0 ? "free" : tierIndex === 1 ? "forever" : "film"
  const params = new URLSearchParams()
  params.set("plan", plan)
  params.set("locale", locale)
  if (pricingCurrency) params.set("currency", pricingCurrency)
  /** Discards any stale /create localStorage draft so “human vs pet” is not skipped (see create page). */
  params.set("new", "1")
  return `/create?${params.toString()}`
}

/**
 * Live-mode master Price IDs (Aeterna Memoir — multi-currency in Stripe Dashboard).
 *
 * Important: We no longer prefer `STRIPE_PRICE_ID_PLUS` / `STRIPE_PRICE_ID_PREMIUM` from env, because those
 * are often left over from older sandboxes (e.g. other products) and would override these defaults.
 * For Stripe **test** mode only, set `STRIPE_PRICE_ID_PLUS_TEST` / `STRIPE_PRICE_ID_PREMIUM_TEST`.
 */
export const STRIPE_DEFAULT_PRICE_ID_PLUS = "price_1TLQapRx4nwbdr0ovMVg8fdj"
export const STRIPE_DEFAULT_PRICE_ID_PREMIUM = "price_1TLQR9Rx4nwbdr0oo0wMzgVu"

/** Resolve Stripe Price ID for Plus (Eternal Legacy) checkout. */
export function resolveStripePriceIdPlus(currency: PricingCurrencyId): string | undefined {
  const testOnly = process.env.STRIPE_PRICE_ID_PLUS_TEST?.trim()
  if (testOnly) return testOnly

  const map: Record<PricingCurrencyId, string | undefined> = {
    usd: process.env.STRIPE_PRICE_ID_PLUS_USD?.trim(),
    krw: process.env.STRIPE_PRICE_ID_PLUS_KRW?.trim(),
    jpy: process.env.STRIPE_PRICE_ID_PLUS_JPY?.trim(),
    sar: process.env.STRIPE_PRICE_ID_PLUS_SAR?.trim(),
  }
  const regional = map[currency]?.trim()
  if (regional) return regional

  return STRIPE_DEFAULT_PRICE_ID_PLUS
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
  const testOnly = process.env.STRIPE_PRICE_ID_PREMIUM_TEST?.trim()
  if (testOnly) return testOnly

  const map: Record<PricingCurrencyId, string | undefined> = {
    usd: process.env.STRIPE_PRICE_ID_PREMIUM_USD?.trim(),
    krw: process.env.STRIPE_PRICE_ID_PREMIUM_KRW?.trim(),
    jpy: process.env.STRIPE_PRICE_ID_PREMIUM_JPY?.trim(),
    sar: process.env.STRIPE_PRICE_ID_PREMIUM_SAR?.trim(),
  }
  const regional = map[currency]?.trim()
  if (regional) return regional

  return STRIPE_DEFAULT_PRICE_ID_PREMIUM
}
