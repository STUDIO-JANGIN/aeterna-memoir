-- Video credits for Premium tier.
-- Each Premium purchase grants 3 video_credits (remaining AI film renders).
-- Run in Supabase SQL Editor.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS video_credits integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN events.video_credits IS 'Remaining AI film renders for Premium tier.';

