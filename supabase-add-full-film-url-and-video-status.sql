-- Full-length AI memorial film URL + status.
-- Run in Supabase SQL Editor.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS full_film_url text,
  ADD COLUMN IF NOT EXISTS video_status text;

COMMENT ON COLUMN events.full_film_url IS '1분 풀버전 AI 헌정 영상 URL.';
COMMENT ON COLUMN events.video_status IS 'AI 영상 생성 상태 (예: requested, processing, completed, failed).';

