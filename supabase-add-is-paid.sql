-- Paywall: unlock all photos after payment completion
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.is_paid IS 'Payment completion flag. If true, all photos remain visible in guest feed after deadline.';
