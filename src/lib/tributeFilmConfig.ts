/** Premium AI tribute: five separate clips (Luma), ~10s each. */
export const TRIBUTE_CLIP_COUNT = 5
export const TRIBUTE_CLIP_SECONDS = 10
/** Initial credits on Premium purchase (one credit = one clip generation). */
export const PREMIUM_INITIAL_VIDEO_CREDITS = TRIBUTE_CLIP_COUNT

/**
 * Guest/admin should select this many approved photos for best results across all five clips.
 * Minimum is enforced in UI; optimum is stated in copy.
 */
export const TRIBUTE_FILM_MIN_PHOTOS = 10
export const TRIBUTE_FILM_MAX_PHOTOS = 25
export const TRIBUTE_FILM_RECOMMENDED_MIN = 15
export const TRIBUTE_FILM_RECOMMENDED_MAX = 20

/** Normalize DB jsonb to exactly five slots (null = not rendered yet). */
export function normalizeTributeSlots(raw: unknown): (string | null)[] {
  if (!Array.isArray(raw)) return Array.from({ length: TRIBUTE_CLIP_COUNT }, () => null)
  const a = raw.map((x) => (typeof x === "string" && x.trim().length > 0 ? x.trim() : null))
  while (a.length < TRIBUTE_CLIP_COUNT) a.push(null)
  return a.slice(0, TRIBUTE_CLIP_COUNT)
}
