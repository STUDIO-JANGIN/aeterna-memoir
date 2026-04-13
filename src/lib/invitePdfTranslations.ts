import type { LandingLocale } from "@/lib/landingTranslations"

/** Fixed template strings for funeral invitation PDFs (per UI language). */
export type InvitePdfStrings = {
  /** When the memorial has no name yet */
  fallbackName: string
  /** Small caps line above the name */
  nameLead: string
  /** Line below the name (invitation body) */
  inviteLine: string
  /** Label before service date */
  dateLabel: string
  /** Label before service time */
  timeLabel: string
  /** Label before location */
  locationLabel: string
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
  }
  return map[locale] ?? map.en
}

const INVITE_PDF_COPY: Record<LandingLocale, InvitePdfStrings> = {
  en: {
    fallbackName: "Beloved",
    nameLead: "The family of",
    inviteLine: "kindly invites you to gather and celebrate a life held in love.",
    dateLabel: "Date",
    timeLabel: "Time",
    locationLabel: "Place",
    scanQr: "Scan to open the digital memorial",
    closing1: "We would be honored by your presence as we remember,",
    closing2: "share stories, and hold space together.",
  },
  ko: {
    fallbackName: "소중한 분",
    nameLead: "고인을 기리는",
    inviteLine: "가족을 대신해 조용한 추모의 자리에 함께해 주시기 바랍니다.",
    dateLabel: "일시(날짜)",
    timeLabel: "시간",
    locationLabel: "장소",
    scanQr: "QR 코드를 스캔하면 디지털 추모 페이지로 이동합니다",
    closing1: "함께해 주셔서 감사드리며,",
    closing2: "따뜻한 추억과 이야기를 나누는 시간이 되기를 바랍니다.",
  },
  ja: {
    fallbackName: "ご故人",
    nameLead: "ご家族一同",
    inviteLine: "謹んでお招きいたします。温かな追悼のひとときを共に過ごせましたら幸いです。",
    dateLabel: "日付",
    timeLabel: "時刻",
    locationLabel: "会場",
    scanQr: "QRコードからデジタル追悼ページへ",
    closing1: "ご参列を心よりお待ちしております。",
    closing2: "思い出を語り合い、静かなお別れの時間を共にできれば幸いです。",
  },
  fr: {
    fallbackName: "Notre proche",
    nameLead: "La famille de",
    inviteLine: "vous invite à vous joindre à elle pour célébrer une vie aimée.",
    dateLabel: "Date",
    timeLabel: "Heure",
    locationLabel: "Lieu",
    scanQr: "Scannez pour ouvrir le mémorial numérique",
    closing1: "Votre présence nous honorera pour partager souvenirs",
    closing2: "et recueillement dans la douceur.",
  },
  es: {
    fallbackName: "Quien amamos",
    nameLead: "La familia de",
    inviteLine: "tiene el honor de invitarle a celebrar una vida querida.",
    dateLabel: "Fecha",
    timeLabel: "Hora",
    locationLabel: "Lugar",
    scanQr: "Escanee para abrir el memorial digital",
    closing1: "Sería un honor contar con su presencia al recordar,",
    closing2: "compartir historias y acompañarnos con ternura.",
  },
  ar: {
    fallbackName: "العزيز",
    nameLead: "عائلة",
    inviteLine: "تدعوكم للمشاركة في تكريم حياة عزيزة.",
    dateLabel: "التاريخ",
    timeLabel: "الوقت",
    locationLabel: "المكان",
    scanQr: "امسح للانتقال إلى النصب التذكاري الرقمي",
    closing1: "نتشرف بحضوركم لمشاركتنا الذكريات",
    closing2: "ولحظات من السكينة والوداع.",
  },
  zh: {
    fallbackName: "摯愛",
    nameLead: "摯愛家屬",
    inviteLine: "敬邀您一同追思，珍藏曾共度的時光。",
    dateLabel: "日期",
    timeLabel: "時間",
    locationLabel: "地點",
    scanQr: "掃描 QR 碼前往數位追思頁面",
    closing1: "誠摯邀請您前來，與我們一同追憶、",
    closing2: "分享故事，靜心道別。",
  },
}

export function getInvitePdfStrings(locale: LandingLocale): InvitePdfStrings {
  return INVITE_PDF_COPY[locale] ?? INVITE_PDF_COPY.en
}
