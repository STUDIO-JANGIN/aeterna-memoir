import type { LandingLocale } from "@/lib/landingTranslations"

/** Fixed template strings for funeral invitation PDFs (per UI language). */
export type InvitePdfStrings = {
  /** When the memorial has no name yet */
  fallbackName: string
  /** Line above the name (e.g. “In Loving Memory Of”) */
  nameLead: string
  /** Caption between QR and memorial URL (PDF footer) */
  scanQr: string
}

/** “Please contact … for additional information.” */
export function formatInvitePdfContactLine(locale: LandingLocale, phone: string): string {
  const p = phone.trim()
  if (!p) return ""
  const map: Record<LandingLocale, string> = {
    en: `Please contact ${p} for additional information.`,
    ko: `추가 안내가 필요하시면 ${p}로 연락해 주시기 바랍니다.`,
    ja: `詳細については ${p} までお問い合わせください。`,
    fr: `Pour toute information complémentaire, veuillez contacter : ${p}.`,
    es: `Para más información, comuníquese al ${p}.`,
    ar: `للمزيد من المعلومات، يُرجى التواصل على ${p}.`,
    zh: `如需更多資訊，請聯絡：${p}。`,
    "zh-hk": `如需更多資訊，請聯絡：${p}。`,
  }
  return map[locale] ?? map.en
}

const INVITE_PDF_COPY: Record<LandingLocale, InvitePdfStrings> = {
  en: {
    fallbackName: "Beloved",
    nameLead: "In Loving Memory Of",
    scanQr: "Scan to visit the memorial",
  },
  ko: {
    fallbackName: "소중한 분",
    nameLead: "고인을 기리며",
    scanQr: "QR 코드를 스캔하여 추모 페이지로 이동합니다",
  },
  ja: {
    fallbackName: "ご故人",
    nameLead: "偲ぶ思いを込めて",
    scanQr: "QRコードをスキャンして追悼ページへ",
  },
  fr: {
    fallbackName: "Notre proche",
    nameLead: "À la douce mémoire de",
    scanQr: "Scannez pour visiter le mémorial",
  },
  es: {
    fallbackName: "Quien amamos",
    nameLead: "En cariñoso recuerdo de",
    scanQr: "Escanee para visitar el memorial",
  },
  ar: {
    fallbackName: "العزيز",
    nameLead: "في ذكرى ودٍّ خالدة",
    scanQr: "امسح ضوئيًا لزيارة الصفحة التذكارية",
  },
  zh: {
    fallbackName: "摯愛",
    nameLead: "永遠懷念",
    scanQr: "掃描 QR 碼前往追思頁面",
  },
  "zh-hk": {
    fallbackName: "摯愛",
    nameLead: "永遠懷念",
    scanQr: "掃描 QR 碼前往追思頁面",
  },
}

export function getInvitePdfStrings(locale: LandingLocale): InvitePdfStrings {
  return INVITE_PDF_COPY[locale] ?? INVITE_PDF_COPY.en
}
