-- Framing for circular profile on /p/[slug] (matches create-flow object-position pan).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS profile_image_position text;

COMMENT ON COLUMN events.profile_image_position IS 'Optional x,y percents 0–100 for CSS object-position on profile_image (same format as memorial_background_position).';
