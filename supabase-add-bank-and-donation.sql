-- Account details (bank_info) + payment purpose classification

-- events: family account details (for condolence transfers)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS bank_info text;

COMMENT ON COLUMN events.bank_info IS 'Family account details. Exposed only after support payment completion.';

-- payments: classify payment purpose (premium_film | platform_tip)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'premium_film';

-- Keep existing rows as premium_film
UPDATE payments SET purpose = 'premium_film' WHERE purpose IS NULL;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_purpose_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_purpose_check CHECK (purpose IN ('premium_film', 'platform_tip'));

COMMENT ON COLUMN payments.purpose IS 'premium_film: film package | platform_tip: platform support tip.';
