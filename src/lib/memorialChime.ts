/**
 * Soft overlapping tones (warm fifth + gentle high bell) — calm, heartwarming confirmation
 * when a memorial is created. Not percussive or camera-like.
 */
export function playMemorialGentleChime(): void {
  if (typeof window === "undefined") return
  try {
    const ctx = new AudioContext()
    const t0 = ctx.currentTime

    const note = (freq: number, start: number, dur: number, peak: number) => {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, start)

      const env = ctx.createGain()
      env.gain.setValueAtTime(0.0001, start)
      env.gain.exponentialRampToValueAtTime(peak, start + 0.05)
      env.gain.exponentialRampToValueAtTime(0.0001, start + dur)

      osc.connect(env)
      env.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + dur + 0.05)
    }

    // E4 + G4 warm interval, then soft C5 — low peaks so the blend stays gentle
    note(329.63, t0, 0.75, 0.05)
    note(392.0, t0 + 0.14, 0.8, 0.042)
    note(523.25, t0 + 0.3, 0.72, 0.028)

    void ctx.resume()
    setTimeout(() => {
      void ctx.close()
    }, 1400)
  } catch {
    /* ignore */
  }
}
