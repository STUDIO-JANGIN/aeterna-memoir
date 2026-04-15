-- =============================================================================
-- events: optional columns — visual framing + profile (create flow / guest page)
-- =============================================================================
-- Run this in the Supabase SQL Editor on **staging and production** before or
-- alongside deploying app code that references these fields.
--
-- Related single-purpose files (same definitions; this bundle is for one-shot sync):
--   - supabase-add-memorial-background-image.sql
--   - supabase-add-memorial-background-position.sql
--   - supabase-add-profile-image-position.sql
--
-- TypeScript mirror: `src/types/events.schema.ts` (`EventsRow`).
-- =============================================================================

-- Blurred full-page background on guest memorial (public storage URL).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS memorial_background_image text;

COMMENT ON COLUMN events.memorial_background_image IS 'Public URL for blurred page background; optional at create.';

-- CSS object-position for background image ("x,y" percents 0–100). Required when using custom background.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS memorial_background_position text;

COMMENT ON COLUMN events.memorial_background_position IS 'Optional "x,y" percentages (0–100) for CSS object-position when memorial_background_image is set.';

-- CSS object-position for circular profile on /p/[slug] (same "x,y" format as memorial_background_position).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS profile_image_position text;

COMMENT ON COLUMN events.profile_image_position IS 'Optional x,y percents 0–100 for CSS object-position on profile_image (same format as memorial_background_position).';
