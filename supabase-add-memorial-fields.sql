-- Aeterna business logic: extend events table
-- memorial_type, status, photo_deadline, is_premium

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS memorial_type text DEFAULT 'person' CHECK (memorial_type IN ('person', 'pet'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'expired'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS photo_deadline timestamptz;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.memorial_type IS 'person | pet';
COMMENT ON COLUMN events.status IS 'active | expired';
COMMENT ON COLUMN events.photo_deadline IS 'Photo collection deadline timestamp. After this, content is blurred and Premium upsell appears.';
COMMENT ON COLUMN events.is_premium IS 'Set true for Premium subscriptions; allows restoration.';

-- Existing rows: backfill photo_deadline from collection_end_at
UPDATE events
SET photo_deadline = COALESCE(collection_end_at, expired_at, created_at + interval '7 days')
WHERE photo_deadline IS NULL;
