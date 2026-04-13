import type { LandingLocale } from "@/lib/landingTranslations"
import { bcp47ForLandingLocale } from "@/lib/invitePdfLocale"

/** Long dates: month name, day, year — pass a BCP 47 tag (e.g. from {@link bcp47ForLandingLocale}). */
export function formatLongDate(value: string | Date | null | undefined, locale = "en-US"): string {
  if (value == null || value === "" || value === "—") return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—"
  return d.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })
}

/** Long dates using the visitor’s selected app language (memorial, guest UI). */
export function formatLongDateForLandingLocale(
  value: string | Date | null | undefined,
  locale: LandingLocale
): string {
  return formatLongDate(value, bcp47ForLandingLocale(locale))
}

/** Relative time for story comments (guest memorial drawer). */
export function formatMemorialCommentTime(iso: string, localeTag: string): string {
  const d = new Date(iso)
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" })
  if (diffSec < 60) {
    return rtf.format(0, "second")
  }
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return rtf.format(-diffMin, "minute")
  }
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 48) {
    return rtf.format(-diffHr, "hour")
  }
  return d.toLocaleDateString(localeTag, { month: "short", day: "numeric" })
}

export function formatDateTime(value: string | Date | null | undefined, locale = "en-US"): string {
  if (value == null || value === "") return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—"
  return d.toLocaleString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
