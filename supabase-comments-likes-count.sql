-- Comment hearts (guests can heart comfort messages on photos).
-- Run in Supabase SQL Editor after comments table exists.

ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN comments.likes_count IS 'Number of viewer hearts on this comment (toggle via client + localStorage).';
