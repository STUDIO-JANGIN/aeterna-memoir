-- 3-tier system: free (default), plus, premium
-- Run in Supabase SQL Editor.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_tier_check;

ALTER TABLE events
  ADD CONSTRAINT events_tier_check CHECK (tier IN ('free', 'plus', 'premium'));

COMMENT ON COLUMN events.tier IS 'free: 7일 후 삭제 | plus: 영구 보관+다운로드 | premium: plus + AI 헌정 영상';
