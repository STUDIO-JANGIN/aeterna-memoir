/**
 * After Stripe payment (Eternal Legacy / Eternal Film), collection timers are set to this
 * far-future instant so free-tier 7-day logic never applies to paid memorials.
 * Server actions must never shorten these fields for paid memorials (irreversible trust issue).
 */
export const PAID_MEMORIAL_COLLECTION_END_ISO = "2099-12-31T23:59:59.999Z"

/** Same instant as {@link PAID_MEMORIAL_COLLECTION_END_ISO} for client-side deadline UX. */
export const PAID_MEMORIAL_DEADLINE_MS = Date.parse(PAID_MEMORIAL_COLLECTION_END_ISO)

/** True when the event has paid Plus/Premium (or legacy flags). Used by guest UI and server guards. */
export function eventRowIsPaidMemorial(row: {
  tier?: string | null
  is_paid?: boolean | null
  is_premium?: boolean | null
}): boolean {
  const t = (row.tier ?? "").trim().toLowerCase()
  if (t === "plus" || t === "premium") return true
  return row.is_premium === true || row.is_paid === true
}

/** DB fields to set together when granting Plus / Premium so deadlines never reflect the free 7-day window. */
export function paidMemorialDeadlineFields(): {
  expired_at: string
  collection_end_at: string
  photo_deadline: string
} {
  const iso = PAID_MEMORIAL_COLLECTION_END_ISO
  return { expired_at: iso, collection_end_at: iso, photo_deadline: iso }
}
