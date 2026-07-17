-- Public URL for the deceased profile photo on guest memorial + invitation PDF.
-- Run on staging and production if profile uploads fail with "column profile_image" errors.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS profile_image text;

COMMENT ON COLUMN events.profile_image IS 'Public storage URL for circular profile on /p/[slug] and invitation PDF.';
