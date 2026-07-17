-- =============================================================================
-- Memorial photo comments — run once in Supabase SQL Editor (staging + production)
-- =============================================================================
-- The app reads/writes **public.comments** (photo_id + event_id + text).
-- Do NOT use supabase-story-comments.sql — that creates legacy **story_comments**
-- which the current app does not use.
--
-- After running, reload the API schema cache:
--   Dashboard → Settings → API → "Reload schema" (if comments still fail)
-- =============================================================================

-- 1) Core table (guest comfort messages on approved story photos)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  visitor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_reported BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_photo_event_created
  ON public.comments(photo_id, event_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_reported
  ON public.comments(is_reported)
  WHERE is_reported = true;

COMMENT ON TABLE public.comments IS 'Guest messages on memorial story photos (StoryMemoryDrawer).';

-- 2) Comment hearts (optional but recommended)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.comments.likes_count IS 'Viewer hearts on this comment.';

-- 3) Atomic heart increment (run after likes_count exists)
-- Parameter name must stay p_comment_id — matches heartCommentAction RPC and existing DB installs.
CREATE OR REPLACE FUNCTION public.increment_comment_likes(p_comment_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.comments
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_comment_id
  RETURNING likes_count INTO new_count;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'comment_not_found' USING ERRCODE = 'P0001';
  END IF;

  RETURN new_count;
END;
$$;

COMMENT ON FUNCTION public.increment_comment_likes(uuid) IS 'Server-side comment heart; used by heartCommentAction.';

REVOKE ALL ON FUNCTION public.increment_comment_likes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_comment_likes(uuid) TO service_role;

-- 4) Realtime (optional — live refresh in memory drawer)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- 5) Quick sanity check (should return row counts, not errors)
-- SELECT COUNT(*) AS comment_rows FROM public.comments;
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'comments'
--   ORDER BY ordinal_position;
