-- Optional full-bleed memorial page background (URL in public storage). If null, UI derives from guest stories.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS memorial_background_image text;

COMMENT ON COLUMN events.memorial_background_image IS 'Public URL for blurred page background; optional at create.';
