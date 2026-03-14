/**
 * Shared Stripe Checkout config for Aeterna (global).
 * 한국: kakao_pay, naver_pay, samsung_pay / 서구: card, apple_pay, google_pay, cashapp, link.
 * Stripe가 지원하는 수단만 노출되며, 지역별로 최적 수단이 상단에 표시됨.
 */
export const PAYMENT_METHOD_TYPES = [
  "card",
  "apple_pay",
  "google_pay",
  "kakao_pay",
  "naver_pay",
  "samsung_pay",
  "cashapp",
  "link",
] as const

/** 계정/지역 미지원 시 fallback (Stripe가 수용하는 최소 목록) */
export const PAYMENT_METHOD_TYPES_FALLBACK = [
  "card",
  "kakao_pay",
  "naver_pay",
  "cashapp",
  "link",
] as const

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number]

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
export function getDonationProductCopy(locale: string): {
  name: string
  description: string
} {
  const isKo = (locale || "").toLowerCase().startsWith("ko")
  if (isKo) {
    return {
      name: "Aeterna 서비스 운영비 후원 (1,000원)",
      description:
        "유족분들이 슬픔에만 집중하실 수 있도록, 조의금 송금 수수료 대신 서비스 운영비를 후원해 주시는 결제입니다.",
    }
  }
  return {
    name: "Aeterna platform support (US$0.99)",
    description:
      "Optional donation to cover service costs so families receive 100% of condolences. Thank you for supporting Aeterna.",
  }
}
