import { TRIBUTE_CLIP_COUNT, TRIBUTE_CLIP_MAX_IMAGES } from "@/lib/tributeFilmConfig"

/**
 * Distribute `selected` stories across `clipCount` clips so each clip gets a fair slice of keyframes.
 */
export function sliceStoriesForClip<T>(selected: T[], clipIndex: number, clipCount: number = TRIBUTE_CLIP_COUNT): T[] {
  if (selected.length === 0 || clipIndex < 0 || clipIndex >= clipCount) return []
  const n = selected.length
  const start = Math.floor((clipIndex * n) / clipCount)
  const end = Math.floor(((clipIndex + 1) * n) / clipCount)
  const slice = selected.slice(start, Math.max(start + 1, end))
  const base = slice.length > 0 ? slice : selected.slice(start, start + 1)
  return base.slice(0, TRIBUTE_CLIP_MAX_IMAGES)
}
