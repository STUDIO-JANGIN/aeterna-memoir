import type Stripe from "stripe"

/** Stripe supports PayPay on Checkout; SDK union may lag behind API. */
const pm = (s: string) => s as Stripe.Checkout.SessionCreateParams.PaymentMethodType

/**
 * Stripe Checkout (hosted) — regional `payment_method_types` order.
 *
 * - **Apple Pay / Google Pay**: Not separate Checkout types; they appear on **`card`**. Put `card`
 *   early so wallets stay prominent.
 * - **Link**: Always **after** regional wallets / APMs so it does not gatekeep local methods.
 * - **Cash App**: USD only (Stripe hides or errors otherwise).
 *
 * Stripe may still reorder slightly by eligibility; this array is the best API-level priority hint.
 */

export type CheckoutPaymentContext = {
  /** App locale (`LandingLocale`) or BCP-47; primary signal for regional PM order. */
  locale?: string | null
  /** Browser `navigator.language` when `locale` is unset (pass from client). */
  navigatorLanguage?: string | null
  /** Stripe currency code (`usd`, `krw`, `jpy`, `sar`, `eur`, …). */
  currency?: string | null
}

function effectiveLocaleFromContext(opts: CheckoutPaymentContext): string | null {
  const a = opts.locale?.trim()
  const b = opts.navigatorLanguage?.trim()
  return a || b || null
}

export function isKoreanPaymentContext(locale?: string | null, currency?: string | null): boolean {
  const loc = (locale ?? "").trim().toLowerCase()
  if (loc.startsWith("ko")) return true
  const cur = (currency ?? "").trim().toLowerCase()
  return cur === "krw"
}

/** Map locale → coarse region for payment-method ordering. */
function resolvePaymentRegion(locale?: string | null): string {
  const l = (locale ?? "").trim().toLowerCase()
  if (!l) return "en"
  if (l.startsWith("ko")) return "ko"
  if (l.startsWith("ja")) return "ja"
  if (l === "zh-hk" || l.startsWith("zh-hk")) return "zh-hk"
  if (l === "zh" || l.startsWith("zh-tw") || l.startsWith("zh-hant")) return "zh-tw"
  if (l.startsWith("ar")) return "ar"
  if (l.startsWith("fr") || l.startsWith("es")) return "eu"
  if (l.startsWith("en")) return "en"
  return "en"
}

function uniqTypes(
  types: Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const seen = new Set<string>()
  const out: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = []
  for (const t of types) {
    if (!seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

/**
 * Hyper-local Stripe Checkout `payment_method_types` order.
 * Link is never first — it stays a supporting option after trusted local methods.
 */
export function getPaymentMethods(
  opts: CheckoutPaymentContext,
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const effectiveLocale = effectiveLocaleFromContext(opts)
  const region = resolvePaymentRegion(effectiveLocale)
  const cur = (opts.currency ?? "").trim().toLowerCase()
  const isUsd = cur === "usd" || cur === ""
  const isKrw = cur === "krw"
  const isJpy = cur === "jpy"
  const isEur = cur === "eur"
  const korean = isKoreanPaymentContext(effectiveLocale, opts.currency)

  const parts: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = []

  switch (region) {
    case "ko":
      // Kakao Pay first (trust); card = Apple/Google Pay + cards; Link last
      if (isKrw || korean) {
        parts.push("kakao_pay", "card", "naver_pay", "samsung_pay")
      } else {
        parts.push("card")
      }
      break
    case "ja":
      // Konbini + PayPay require JPY settlement for these rails
      if (isJpy) {
        parts.push("konbini", "card", pm("paypay"))
      } else {
        parts.push("card")
      }
      break
    case "zh-tw":
    case "zh-hk":
      parts.push("alipay", "card")
      break
    case "ar":
      // Mada and GCC cards use `card`; Apple Pay surfaces on card
      parts.push("card")
      break
    case "eu":
      if (isEur) {
        parts.push("card", "bancontact", "ideal")
      } else {
        parts.push("card")
      }
      break
    case "en":
    default:
      // Express wallets on `card`; Link after card
      parts.push("card")
      break
  }

  // Link after local / card rails so it does not obscure wallets & APMs
  parts.push("link")

  if (isUsd) {
    parts.push("cashapp")
  }

  return uniqTypes(parts)
}

/** @deprecated Use `getPaymentMethods` — alias for existing imports. */
export function getCheckoutPaymentMethodTypes(
  opts: CheckoutPaymentContext,
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  return getPaymentMethods(opts)
}

/** Narrow retry list when the account rejects some APMs (dashboard / region limits). */
export function getCheckoutPaymentMethodTypesFallback(
  opts: CheckoutPaymentContext,
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const cur = (opts.currency ?? "").trim().toLowerCase()
  const isUsd = cur === "usd" || cur === ""
  const base: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ["card", "link"]
  if (isUsd) base.push("cashapp")
  return base
}

/** Map app `LandingLocale` / BCP-47 to Stripe Checkout `locale` for copy and hints. */
export function stripeCheckoutLocaleFromLanding(
  landingLocale?: string | null,
): Stripe.Checkout.SessionCreateParams.Locale | undefined {
  const raw = (landingLocale ?? "").trim().toLowerCase()
  if (!raw) return undefined
  if (raw === "zh-hk" || raw.startsWith("zh-hk")) return "zh-HK"
  const base = raw.split("-")[0] ?? raw
  const map: Record<string, Stripe.Checkout.SessionCreateParams.Locale> = {
    en: "en",
    ko: "ko",
    ja: "ja",
    fr: "fr",
    es: "es",
    zh: "zh",
    ar: "en",
  }
  return map[base] ?? "en"
}

/**
 * Shared Checkout Session fragment: payment methods, optional `payment_method_options`, UI locale.
 * Pass `navigatorLanguage` from the client when `locale` may be empty.
 */
export function checkoutSessionPaymentAndLocale(opts: CheckoutPaymentContext): Pick<
  Stripe.Checkout.SessionCreateParams,
  "payment_method_types" | "locale" | "payment_method_options"
> {
  const effectiveLocale = effectiveLocaleFromContext(opts)
  const payment_method_types = getPaymentMethods({
    locale: effectiveLocale,
    currency: opts.currency,
  })
  const loc = stripeCheckoutLocaleFromLanding(effectiveLocale)
  return {
    payment_method_types,
    ...(loc ? { locale: loc } : {}),
    // Strong customer authentication where applicable; supports Mada / GCC cards on `card`
    payment_method_options: {
      card: {
        request_three_d_secure: "automatic",
      },
    },
  }
}

/**
 * Locale → donation amount for platform tip.
 * ko → 1,000 KRW, default (en-US, en-AU, etc.) → 0.99 USD.
 */
export function getDonationAmountByLocale(locale: string): { currency: "krw" | "usd"; unit_amount: number } {
  const normalized = (locale || "").toLowerCase().replace(/-.*/, "")
  if (normalized === "ko") {
    return { currency: "krw", unit_amount: 1000 }
  }
  return { currency: "usd", unit_amount: 99 }
}

/**
 * Donation checkout product copy by locale (Stripe line_item).
 */
export function getDonationProductCopy(): {
  name: string
  description: string
} {
  return {
    name: "Aeterna platform support",
    description:
      "Optional tip to help cover processing and hosting so families can receive the full amount of condolence gifts. Thank you for supporting Aeterna.",
  }
}
