-- One-time: fix memorials that were paid (Plus/Premium) before deadlines were written at checkout.
-- Safe to re-run: sets the same far-future timestamps as paidMemorialDeadlineFields().
UPDATE events
SET
  expired_at = '2099-12-31T23:59:59.999Z'::timestamptz,
  collection_end_at = '2099-12-31T23:59:59.999Z'::timestamptz,
  photo_deadline = '2099-12-31T23:59:59.999Z'::timestamptz
WHERE is_paid = true AND tier IN ('plus', 'premium');
