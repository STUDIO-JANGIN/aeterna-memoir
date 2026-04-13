/** YYYY.MM.DD for invitation stationery; invalid → em dash. */
export function formatInvitePdfIsoDate(value: string | null | undefined): string {
  const raw = value?.trim()
  if (!raw) return "—"
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}.${m[2]}.${m[3]}`
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}.${mo}.${day}`
  }
  return "—"
}
