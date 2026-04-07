-- Add amount_cents and currency to payments to track actual amounts.
-- Run in Supabase SQL Editor.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS amount_cents integer,
  ADD COLUMN IF NOT EXISTS currency text;

COMMENT ON COLUMN payments.amount_cents IS 'Payment amount in smallest currency unit (e.g., cents).';
COMMENT ON COLUMN payments.currency IS 'Payment currency (e.g., usd, krw).';

