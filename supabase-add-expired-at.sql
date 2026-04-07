-- Event collection period (Expiry System): memory collection deadline
-- Default is set by app logic as created_at + 7 days; DB default is intentionally not used.
ALTER TABLE events
ADD COLUMN IF NOT EXISTS expired_at timestamptz;

COMMENT ON COLUMN events.expired_at IS 'Memory collection deadline timestamp (default: 7 days after creation). Guest uploads are disabled after this.';

-- Existing rows: optionally backfill from collection_end_at, else created_at + 7 days.
-- UPDATE events SET expired_at = COALESCE(collection_end_at, created_at + interval '7 days') WHERE expired_at IS NULL;
