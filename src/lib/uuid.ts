/** RFC 4122 UUID (any version), case-insensitive. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Returns a lowercase canonical UUID string, or null if the value is missing or not a valid UUID.
 * Use before FK inserts so Postgres never receives objects, "undefined", or malformed strings.
 */
export function parseUuidString(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim()
  if (!s || s === "undefined" || s === "null") return null
  if (!UUID_RE.test(s)) return null
  return s.toLowerCase()
}
