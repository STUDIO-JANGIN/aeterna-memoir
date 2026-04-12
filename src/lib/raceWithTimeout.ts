/**
 * Resolves with `timeoutValue` if `promise` does not settle within `ms`.
 * Use for Supabase calls that can stall (offline tabs, extensions) so UI never sticks on loading copy.
 */
export function raceWithTimeout<T, U>(promise: Promise<T>, ms: number, timeoutValue: U): Promise<T | U> {
  return Promise.race([
    promise,
    new Promise<T | U>((resolve) => setTimeout(() => resolve(timeoutValue), ms)),
  ])
}
