/** Standard 8-4-4-4-12 hex UUID, case-insensitive (matches Postgres uuid). */
const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

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
