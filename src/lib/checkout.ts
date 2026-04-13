import type Stripe from "stripe"

/**
 * Stripe Checkout (hosted) payment method order.
 *
 * - **Apple Pay / Google Pay**: Shown as express options on the **`card`** method; keep `card` first.
 * - **Korea**: After `card`, list Kakao / Naver / Samsung Pay when locale is Korean or currency is KRW.
 * - **Link**: After wallets, before Cash App.
 * - **Cash App**: Only when currency is USD (Stripe hides or errors otherwise).
 *
 * Stripe may still reorder slightly for eligibility; this list is the best API-level priority hint.
 *
 * **Tabs vs accordion**: Hosted Checkout UI is controlled by Stripe and is not the embedded Payment
 * Element. The `layout: { type: "tabs" }` option applies to Payment Element / Checkout `ui_mode:
 * "elements"` integrations only—not to redirect Checkout. To get tabs, migrate those flows to
 * Elements-based Checkout or Stripe’s custom UI mode.
 */
export function isKoreanPaymentContext(locale?: string | null, currency?: string | null): boolean {
  const loc = (locale ?? "").trim().toLowerCase()
  if (loc.startsWith("ko")) return true
  const cur = (currency ?? "").trim().toLowerCase()
  return cur === "krw"
}

export function getCheckoutPaymentMethodTypes(opts: {
  locale?: string | null
  currency?: string | null
}): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const korean = isKoreanPaymentContext(opts.locale, opts.currency)
  const cur = (opts.currency ?? "").trim().toLowerCase()
  const isUsd = cur === "usd" || cur === ""

  const methods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
    "card",
    ...(korean ? (["kakao_pay", "naver_pay", "samsung_pay"] as const) : []),
    "link",
  ]
  if (isUsd) methods.push("cashapp")
  return methods
}

/** Narrower list when the account rejects some APMs (e.g. regional limits). */
export function getCheckoutPaymentMethodTypesFallback(opts: {
  locale?: string | null
  currency?: string | null
}): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  const korean = isKoreanPaymentContext(opts.locale, opts.currency)
  if (korean) {
    return ["card", "kakao_pay", "link"]
  }
  return ["card", "link"]
}

/** Map app `LandingLocale` to Stripe Checkout `locale` for copy and hints. */
export function stripeCheckoutLocaleFromLanding(
  landingLocale?: string | null
): Stripe.Checkout.SessionCreateParams.Locale | undefined {
  const raw = (landingLocale ?? "").trim().toLowerCase()
  if (!raw) return undefined
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

export function checkoutSessionPaymentAndLocale(opts: {
  locale?: string | null
  currency?: string | null
}): Pick<Stripe.Checkout.SessionCreateParams, "payment_method_types" | "locale"> {
  const payment_method_types = getCheckoutPaymentMethodTypes(opts)
  const loc = stripeCheckoutLocaleFromLanding(opts.locale)
  return {
    payment_method_types,
    ...(loc ? { locale: loc } : {}),
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
