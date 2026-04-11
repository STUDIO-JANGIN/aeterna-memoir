/** Split remaining milliseconds into day/hour/min/sec (hour rolls at 24h within a day bucket). */
export function splitMsToDHMS(ms: number): { d: number; h: number; m: number; s: number } {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60) % 60
  const h = Math.floor(totalSeconds / 3600) % 24
  const d = Math.floor(totalSeconds / 86400)
  return { d, h, m, s }
}
