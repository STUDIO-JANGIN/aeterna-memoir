-- Public URL for AI Memorial Film (set when film is published)
-- Run in Supabase SQL Editor.

ALTER TABLE events
ADD COLUMN IF NOT EXISTS film_url text;

COMMENT ON COLUMN events.film_url IS 'Public AI Memorial Film URL (enables Full Screen Cinematic section when set).';
