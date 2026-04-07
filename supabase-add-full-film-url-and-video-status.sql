-- Full-length AI memorial film URL + status.
-- Run in Supabase SQL Editor.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS full_film_url text,
  ADD COLUMN IF NOT EXISTS video_status text;

COMMENT ON COLUMN events.full_film_url IS 'Public URL for the full-length (1-minute) AI tribute film.';
COMMENT ON COLUMN events.video_status IS 'AI video generation status (e.g. requested, processing, completed, failed).';

