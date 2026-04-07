/** Long dates for global English UI: "April 7, 2026" (month name, day, year). */
export function formatLongDate(value: string | Date | null | undefined, locale = "en-US"): string {
  if (value == null || value === "" || value === "—") return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—"
  return d.toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" })
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
