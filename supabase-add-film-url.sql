-- AI Memorial Film 공개용 URL (영상 공개 시 설정)
-- Supabase SQL Editor에서 실행하세요.

ALTER TABLE events
ADD COLUMN IF NOT EXISTS film_url text;

COMMENT ON COLUMN events.film_url IS 'AI Memorial Film 공개 URL (설정 시 Full Screen Cinematic 영역 표시)';
