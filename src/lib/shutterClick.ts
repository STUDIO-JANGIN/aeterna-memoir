/**
 * ~0.2s high-frequency “shutter” — gain 0.1 (barely audible, felt more than heard).
 */
export function playShutterClick(): void {
  if (typeof window === "undefined") return
  try {
    const ctx = new AudioContext()
    const t0 = ctx.currentTime
    const dur = 0.2

    const osc = ctx.createOscillator()
    osc.type = "sine"
    osc.frequency.setValueAtTime(3000, t0)
    osc.frequency.exponentialRampToValueAtTime(900, t0 + dur)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.1, t0 + 0.012)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

    osc.connect(env)
    env.connect(ctx.destination)

    osc.start(t0)
    osc.stop(t0 + dur + 0.03)

    void ctx.resume()
    setTimeout(() => {
      void ctx.close()
    }, 600)
  } catch {
    /* ignore */
  }
}
