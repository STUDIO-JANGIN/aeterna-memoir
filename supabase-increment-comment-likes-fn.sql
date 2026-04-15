-- Atomic comment heart increment (used by heartCommentAction).
-- Run after supabase-comments-likes-count.sql (likes_count column must exist).

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
