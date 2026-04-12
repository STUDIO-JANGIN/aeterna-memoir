import { bcp47ForLandingLocale } from "@/lib/invitePdfLocale"
import type { LandingLocale } from "@/lib/landingTranslations"

export type CeremonyParts = {
  /** Localized long date, or em dash */
  dateLine: string
  /** Localized time, or null if unknown */
  timeLine: string | null
}

/**
 * Split stored `ceremony_time` into a display date and time using the invitation locale.
 * Accepts ISO-like strings; otherwise shows the raw value as date-only.
 */
export function parseCeremonyForInvitePdf(
  ceremonyTime: string | null | undefined,
  locale: LandingLocale
): CeremonyParts {
  const raw = ceremonyTime?.trim()
  const tag = bcp47ForLandingLocale(locale)
  if (!raw) {
    return { dateLine: "—", timeLine: null }
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw)
  if (dateOnly) {
    const d = new Date(`${raw}T12:00:00`)
    if (!Number.isNaN(d.getTime())) {
      return {
        dateLine: d.toLocaleDateString(tag, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        timeLine: null,
      }
    }
  }

  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) {
    const hasTime =
      /T\d{2}:\d{2}/.test(raw) ||
      raw.includes(":") && !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())
    return {
      dateLine: d.toLocaleDateString(tag, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      timeLine: hasTime ? d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" }) : null,
    }
  }

  const timeOnly = /^\s*\d{1,2}:\d{2}/.test(raw) || /\b(am|pm)\b/i.test(raw)
  if (timeOnly) {
    return { dateLine: "—", timeLine: raw }
  }

  return { dateLine: raw, timeLine: null }
}
