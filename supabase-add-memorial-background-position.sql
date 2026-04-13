-- Focus point for custom memorial page background (object-position % as "x,y").
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS memorial_background_position text;

COMMENT ON COLUMN events.memorial_background_position IS 'Optional "x,y" percentages (0–100) for CSS object-position when memorial_background_image is set.';
