import { bcp47ForLandingLocale } from "@/lib/invitePdfLocale"
import type { LandingLocale } from "@/lib/landingTranslations"

export type CeremonyDateFieldOrder = "mdy" | "dmy" | "ymd"

/** Column order for ceremony date `<select>`s (Step 6 / wizard step 7). */
export function ceremonyDateFieldOrder(locale: LandingLocale): CeremonyDateFieldOrder {
  switch (locale) {
    case "en":
      return "mdy"
    case "ko":
    case "ja":
    case "zh":
    case "zh-hk":
      return "ymd"
    case "fr":
    case "es":
    case "ar":
      return "dmy"
    default:
      return "mdy"
  }
}

/** US English and Arabic use 12-hour clock in the ceremony UI; others use 24-hour. */
export function ceremonyTimeUses12HourClock(locale: LandingLocale): boolean {
  return locale === "en" || locale === "ar"
}

export function from24hTo12(h: number): { hour12: number; period: "AM" | "PM" } {
  if (h === 0) return { hour12: 12, period: "AM" }
  if (h < 12) return { hour12: h, period: "AM" }
  if (h === 12) return { hour12: 12, period: "PM" }
  return { hour12: h - 12, period: "PM" }
}

export function to24Hour(hour12: number, period: "AM" | "PM"): number {
  if (period === "AM") return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

/** Short hint under date/time fields (format pattern). */
export function ceremonyDateFormatHint(locale: LandingLocale): string {
  switch (locale) {
    case "en":
      return "MM / DD / YYYY"
    case "ko":
      return "YYYY. MM. DD."
    case "ja":
    case "zh":
    case "zh-hk":
      return "YYYY年MM月DD日"
    case "fr":
    case "es":
    case "ar":
      return "DD / MM / YYYY"
    default:
      return "MM / DD / YYYY"
  }
}

export function ceremonyTimeFormatHint(locale: LandingLocale): string {
  if (ceremonyTimeUses12HourClock(locale)) {
    return locale === "ar" ? "١٢ ساعة (صباحًا / مساءً)" : "12-hour · e.g. 10:00 AM"
  }
  switch (locale) {
    case "ko":
      return "24시간제 · 예: 22:00"
    case "ja":
      return "24時間 · 例: 22:00"
    case "zh":
    case "zh-hk":
      return "24小時 · 例：22:00"
    case "fr":
      return "24 h · ex. 22:00"
    case "es":
      return "24 h · ej. 22:00"
    default:
      return "24-hour · e.g. 22:00"
  }
}

function ceremonyDateDisplayPart(isoYmd: string, locale: LandingLocale): string {
  const d = isoYmd.trim()
  if (!d) return ""
  const parts = d.split("-").map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return ""
  const [y, mo, day] = parts
  const dt = new Date(y, mo - 1, day)
  if (Number.isNaN(dt.getTime())) return ""

  const tag = bcp47ForLandingLocale(locale)

  if (locale === "ko") {
    return `${y}. ${String(mo).padStart(2, "0")}. ${String(day).padStart(2, "0")}.`
  }
  if (locale === "ja" || locale === "zh" || locale === "zh-hk") {
    return `${y}年${String(mo).padStart(2, "0")}月${String(day).padStart(2, "0")}日`
  }
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dt)
  }
  // fr, es, ar — DD/MM/YYYY (Arabic-Indic digits for ar via locale)
  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt)
}

function ceremonyTimeDisplayPart(
  hour12: number,
  minute: string,
  period: "AM" | "PM",
  locale: LandingLocale
): string {
  const tag = bcp47ForLandingLocale(locale)
  const h24 = to24Hour(hour12, period)
  const minuteNum = Number(minute)
  const safeMin = Number.isFinite(minuteNum) ? minuteNum : 0
  const ref = new Date(2000, 0, 1, h24, safeMin, 0, 0)

  if (ceremonyTimeUses12HourClock(locale)) {
    return new Intl.DateTimeFormat(tag, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(ref)
  }
  // Korean: prefer 오전/오후 wording (same clock as 12h) while the UI uses a 24h-style hour list.
  if (locale === "ko") {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(ref)
  }
  return new Intl.DateTimeFormat(tag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(ref)
}

/**
 * Single-line ceremony preview for invitations and `events.ceremony_time`.
 * Locale-aware date + time (not a one-size-fits-all format).
 */
export function buildCeremonyDisplay(
  dateIso: string,
  hour12: number,
  minute: string,
  period: "AM" | "PM",
  locale: LandingLocale
): string {
  const timePart = ceremonyTimeDisplayPart(hour12, minute, period, locale)
  const datePart = ceremonyDateDisplayPart(dateIso, locale)
  if (!datePart) return timePart
  return `${datePart} · ${timePart}`
}

/** Localized month name for ceremony month `<option>` labels. */
export function formatCeremonyMonthOption(month1to12: number, locale: LandingLocale): string {
  const tag = bcp47ForLandingLocale(locale)
  return new Intl.DateTimeFormat(tag, { month: "long" }).format(new Date(2020, month1to12 - 1, 1))
}

/** Day / year option text (Arabic-Indic numerals for `ar`). */
export function formatCeremonyNumericPick(n: number, locale: LandingLocale): string {
  if (locale === "ar") {
    return new Intl.NumberFormat("ar-SA", { numberingSystem: "arab" }).format(n)
  }
  return String(n)
}

/** AM/PM labels for the period `<select>` (values stay AM | PM). */
export function ceremonyPeriodOptionLabels(locale: LandingLocale): { am: string; pm: string } {
  const tag = bcp47ForLandingLocale(locale)
  const fmt = new Intl.DateTimeFormat(tag, { hour: "numeric", hour12: true, timeZone: "UTC" })
  const label = (utcHour: number) => {
    const parts = fmt.formatToParts(new Date(Date.UTC(2000, 0, 1, utcHour, 0)))
    return parts.find((p) => p.type === "dayPeriod")?.value?.trim() || ""
  }
  const am = label(9)
  const pm = label(15)
  if (am && pm) return { am, pm }
  return { am: "AM", pm: "PM" }
}

/** Localized field name for date picker columns (Month / Day / Year). */
export function ceremonyDateTimeFieldLabel(
  locale: LandingLocale,
  field: "month" | "day" | "year"
): string {
  const tag = bcp47ForLandingLocale(locale)
  try {
    const dn = new Intl.DisplayNames([tag], { type: "dateTimeField" })
    return dn.of(field) || field
  } catch {
    return field
  }
}
