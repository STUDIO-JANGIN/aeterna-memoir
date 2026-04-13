-- Align payments.purpose with Stripe webhook (premium_film | platform_tip | support_family).
-- Run in Supabase SQL Editor if purpose is missing or CHECK rejects support_family.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'premium_film';

UPDATE payments SET purpose = 'premium_film' WHERE purpose IS NULL OR purpose = '';

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_purpose_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_purpose_check CHECK (
    purpose IN ('premium_film', 'platform_tip', 'support_family')
  );

COMMENT ON COLUMN payments.purpose IS 'Stripe checkout purpose: premium_film | platform_tip | support_family.';
