/**
 * Ensures memorial profile images render: full URLs pass through; storage paths become public URLs.
 */
export function resolveProfileImageUrl(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null
  const u = raw.trim()
  if (!u) return null
  if (u.startsWith("http://") || u.startsWith("https://")) return u
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!base) return u.startsWith("/") ? u : null
  if (u.startsWith("/storage/v1/")) return `${base}${u}`
  const path = u.replace(/^\/+/, "")
  return `${base}/storage/v1/object/public/photos/${path}`
}
