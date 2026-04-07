-- Lightweight one-line tributes on memorial story photos (guest-facing).
-- Run in Supabase SQL Editor or via migration.

CREATE TABLE IF NOT EXISTS story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_reported BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_story_comments_story_created
  ON story_comments(story_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_story_comments_reported
  ON story_comments(is_reported)
  WHERE is_reported = true;

COMMENT ON TABLE story_comments IS 'Short comfort messages (max 100 chars) on approved memorial stories.';
