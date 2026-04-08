/**
 * After Stripe payment (Eternal Legacy / Eternal Film), collection timers are set to this
 * far-future instant so free-tier 7-day logic never applies to paid memorials.
 */
export const PAID_MEMORIAL_COLLECTION_END_ISO = "2099-12-31T23:59:59.999Z"

/** DB fields to set together when granting Plus / Premium so deadlines never reflect the free 7-day window. */
export function paidMemorialDeadlineFields(): {
  expired_at: string
  collection_end_at: string
  photo_deadline: string
} {
  const iso = PAID_MEMORIAL_COLLECTION_END_ISO
  return { expired_at: iso, collection_end_at: iso, photo_deadline: iso }
}
