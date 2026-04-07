-- Ensure events has a unique slug for /p/[slug] routing.
-- Run this if your events table does not yet have a slug column.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

COMMENT ON COLUMN events.slug IS 'Unique URL segment for guest feed: /p/[slug]';

-- ========== Backfill: set default slug on existing events with empty slug ==========
-- If "Event not found" appears on /p/[slug]/admin or guest upload flows, run below.
-- (Using id as slug yields URLs like /p/550e8400-e29b-41d4-a716-446655440000/admin)

UPDATE events
SET slug = id::text
WHERE slug IS NULL OR slug = '';

-- After backfill, admin link becomes /p/{slug-set-above}/admin.
-- Example: if event id is 'abc-123-uuid', open /p/abc-123-uuid/admin.
