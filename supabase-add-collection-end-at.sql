-- 추억 수집 마감 시각 (D-Day 타이머용)
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE events
ADD COLUMN IF NOT EXISTS collection_end_at timestamptz;

COMMENT ON COLUMN events.collection_end_at IS '추억 수집 마감 시각 (없으면 생성일+48시간으로 앱에서 계산)';
