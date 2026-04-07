-- Top-20 ranking: stories.likes_count (add only if missing)
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN stories.likes_count IS 'Heart count. Increments on heart click; top 20 can be selected as AI film candidates.';
