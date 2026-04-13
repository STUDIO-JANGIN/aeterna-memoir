/** Parse stored `events.memorial_background_position` ("x,y" percents) for CSS object-position. */
export function parseMemorialBackgroundPosition(
  raw: string | null | undefined,
): { x: number; y: number } | null {
  if (!raw?.trim()) return null
  const parts = raw.trim().split(",")
  if (parts.length !== 2) return null
  const x = Number(parts[0])
  const y = Number(parts[1])
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  }
}
