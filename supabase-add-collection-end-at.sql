-- Memory collection deadline timestamp (for D-Day timer)
-- Run this in Supabase SQL Editor.

ALTER TABLE events
ADD COLUMN IF NOT EXISTS collection_end_at timestamptz;

COMMENT ON COLUMN events.collection_end_at IS 'Memory collection deadline timestamp (if missing, app computes created_at + 48h).';
