-- Photo/memory comfort comments (guest-facing). Run in Supabase SQL Editor if not already applied.
-- Aligns with app usage: photo_id = stories.id, event_id = events.id.

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  visitor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_reported BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_photo_event_created
  ON comments(photo_id, event_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_reported
  ON comments(is_reported)
  WHERE is_reported = true;

COMMENT ON TABLE comments IS 'Short messages on memorial story photos; visitor_name is Guest/Anonymous when appropriate.';
