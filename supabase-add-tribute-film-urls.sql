-- Ordered URLs for five ~10s tribute clips (Luma Ray 2). Run in Supabase SQL Editor.
-- Complements full_film_url (first clip / legacy single URL).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tribute_film_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN events.tribute_film_urls IS
  'JSON array of up to 5 public video URLs (10s clips). Null entries reserved for pending slots.';

-- Optional: align existing Premium rows that still have 3 film credits to the new bundle of 5.
-- UPDATE events SET video_credits = 5 WHERE tier = 'premium' AND video_credits = 3 AND (tribute_film_urls IS NULL OR tribute_film_urls = '[]'::jsonb);
