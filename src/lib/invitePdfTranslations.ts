import type { LandingLocale } from "@/lib/landingTranslations"

/** Fixed template strings for funeral invitation PDFs (per UI language). */
export type InvitePdfStrings = {
  /** When the memorial has no name yet */
  fallbackName: string
  /** Small line above the name */
  nameLead: string
  /** Line below the name (invitation body) */
  inviteLine: string
  /** Label before service date */
  dateLabel: string
  /** Label before service time */
  timeLabel: string
  /** Label before location */
  locationLabel: string
  /** Label before contact phone (main body) */
  contactLabel: string
  /** Label before bank / condolence account (KR and localized elsewhere) */
  bankLabel: string
  /** Caption under QR */
  scanQr: string
  /** Two lines of closing copy */
  closing1: string
  closing2: string
}

/** “Please contact … for further details” (after closing lines). */
export function formatInvitePdfContactLine(locale: LandingLocale, phone: string): string {
  const p = phone.trim()
  if (!p) return ""
  const map: Record<LandingLocale, string> = {
    en: `Please contact ${p} for further details.`,
    ko: `자세한 안내는 ${p}로 문의해 주시기 바랍니다.`,
    ja: `詳細は ${p} までお問い合わせください。`,
    fr: `Pour plus de précisions, veuillez contacter : ${p}.`,
    es: `Para más información, contacte a ${p}.`,
    ar: `للمزيد من التفاصيل، يُرجى التواصل على ${p}.`,
    zh: `若需詳情，請聯絡：${p}。`,
    "zh-hk": `若需詳情，請聯絡：${p}。`,
  }
  return map[locale] ?? map.en
}

const INVITE_PDF_COPY: Record<LandingLocale, InvitePdfStrings> = {
  en: {
    fallbackName: "Beloved",
    nameLead: "In loving memory of",
    inviteLine: "You are warmly invited to join us in celebrating a life remembered with love.",
    dateLabel: "Service date",
    timeLabel: "Time",
    locationLabel: "Location",
    contactLabel: "Contact",
    bankLabel: "Condolence account",
    scanQr: "Scan to leave a message of condolence",
    closing1: "Your presence would mean a great deal",
    closing2: "as we gather in remembrance and gratitude.",
  },
  ko: {
    fallbackName: "소중한 분",
    nameLead: "고인을 기리며",
    inviteLine: "조용한 추모의 자리에 함께해 주시기 바랍니다.",
    dateLabel: "일시(날짜)",
    timeLabel: "시간",
    locationLabel: "장소",
    contactLabel: "연락처",
    bankLabel: "마음 전하실 곳",
    scanQr: "QR 코드를 스캔하여 조의의 말을 남겨 주세요",
    closing1: "함께해 주셔서 감사드립니다.",
    closing2: "따뜻한 기억과 이야기를 나누는 시간이 되기를 바랍니다.",
  },
  ja: {
    fallbackName: "ご故人",
    nameLead: "偲ぶ会にて",
    inviteLine: "謹んでお招きいたします。静かなお別れのひとときを共に過ごせましたら幸いです。",
    dateLabel: "日取り",
    timeLabel: "時刻",
    locationLabel: "会場",
    contactLabel: "連絡先",
    bankLabel: "ご弔慰のご案内",
    scanQr: "QRコードをスキャンして弔意を記入できます",
    closing1: "ご参列を心よりお待ちしております。",
    closing2: "思い出を語り合い、お別れの時間を共にできれば幸いです。",
  },
  fr: {
    fallbackName: "Notre proche",
    nameLead: "En la douce mémoire de",
    inviteLine: "Nous vous invitons à célébrer une vie et à partager un moment de recueillement.",
    dateLabel: "Date",
    timeLabel: "Heure",
    locationLabel: "Lieu",
    contactLabel: "Contact",
    bankLabel: "Compte pour condoléances",
    scanQr: "Scannez pour laisser un message de condoléances",
    closing1: "Votre présence nous toucherait profondément",
    closing2: "dans la gratitude et le souvenir partagé.",
  },
  es: {
    fallbackName: "Quien amamos",
    nameLead: "En amoroso recuerdo de",
    inviteLine: "Le invitamos a acompañarnos en la celebración de una vida y un legado de cariño.",
    dateLabel: "Fecha",
    timeLabel: "Hora",
    locationLabel: "Lugar",
    contactLabel: "Contacto",
    bankLabel: "Cuenta para condolencias",
    scanQr: "Escanee para dejar un mensaje de condolencias",
    closing1: "Sería un honor contar con su presencia",
    closing2: "en este momento de recuerdo y gratitud.",
  },
  ar: {
    fallbackName: "العزيز",
    nameLead: "ببالغ الحب والوفاء",
    inviteLine: "تشرفوننا بحضوركم للوقوف معًا في تكريم ذكرى عزيزة.",
    dateLabel: "التاريخ",
    timeLabel: "الوقت",
    locationLabel: "المكان",
    contactLabel: "للتواصل",
    bankLabel: "حساب التعازي",
    scanQr: "امسح ضوئيًا لترك رسالة تعزية",
    closing1: "يشرّفنا حضوركم",
    closing2: "ومشاركتكم لنا لحظات من الذكرى والدعاء.",
  },
  zh: {
    fallbackName: "摯愛",
    nameLead: "永誌追思",
    inviteLine: "敬邀您一同追思，珍藏曾共度的時光。",
    dateLabel: "日期",
    timeLabel: "時間",
    locationLabel: "地點",
    contactLabel: "聯絡方式",
    bankLabel: "奠儀帳戶",
    scanQr: "掃描 QR 碼留下弔唁留言",
    closing1: "誠摯邀請您前來，與我們一同追憶、",
    closing2: "分享故事，靜心道別。",
  },
  "zh-hk": {
    fallbackName: "摯愛",
    nameLead: "永誌追思",
    inviteLine: "敬邀您一同追思，珍藏曾共度的時光。",
    dateLabel: "日期",
    timeLabel: "時間",
    locationLabel: "地點",
    contactLabel: "聯絡方式",
    bankLabel: "奠儀帳戶",
    scanQr: "掃描 QR 碼留下弔唁留言",
    closing1: "誠摯邀請您前來，與我們一同追憶、",
    closing2: "分享故事，靜心道別。",
  },
}

export function getInvitePdfStrings(locale: LandingLocale): InvitePdfStrings {
  return INVITE_PDF_COPY[locale] ?? INVITE_PDF_COPY.en
}
