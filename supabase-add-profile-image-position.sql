-- Framing for circular profile on /p/[slug] (matches create-flow object-position pan).
-- If you see "Could not find the 'profile_image_position' column ... in the schema cache":
-- 1) Run this script in Supabase SQL Editor (as postgres).
-- 2) Refresh PostgREST so the API sees the column, e.g. run once:
--    NOTIFY pgrst, 'reload schema';
--    (Or wait ~1–2 minutes; or pause/resume project in Dashboard if needed.)

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS profile_image_position text;

COMMENT ON COLUMN events.profile_image_position IS 'Optional x,y percents 0–100 for CSS object-position on profile_image (same format as memorial_background_position).';

-- Optional (run separately if schema cache still errors): NOTIFY pgrst, 'reload schema';
