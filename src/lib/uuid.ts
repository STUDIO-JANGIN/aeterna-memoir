/** Standard 8-4-4-4-12 hex UUID, case-insensitive (matches Postgres uuid). */
const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
/** 32 hex chars without hyphens (some APIs / drivers emit this). */
const UUID_COMPACT_RE = /^[\da-f]{32}$/i

/**
 * Coerce API / React state to a trimmed string id (handles numeric ids from JSON, objects, etc.).
 */
export function coerceIdString(raw: unknown): string {
  if (raw === null || raw === undefined) return ""
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim()
  if (s === "undefined" || s === "null") return ""
  return s
}

/**
 * Returns a lowercase canonical UUID string, or null if the value is missing or not a valid UUID.
 * Use before FK inserts so Postgres never receives objects, "undefined", or malformed strings.
 * Accepts `{uuid}`, compact 32-char hex, and standard hyphenated forms.
 */
export function parseUuidString(raw: unknown): string | null {
  let s = coerceIdString(raw)
  if (!s) return null
  if (s.startsWith("{") && s.endsWith("}")) {
    s = s.slice(1, -1).trim()
  }
  if (UUID_COMPACT_RE.test(s)) {
    const h = s.toLowerCase()
    s = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`
  }
  if (!UUID_RE.test(s)) return null
  return s.toLowerCase()
}
