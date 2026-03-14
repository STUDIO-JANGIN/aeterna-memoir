-- Ensure events has a unique slug for /p/[slug] routing.
-- Run this if your events table does not yet have a slug column.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

COMMENT ON COLUMN events.slug IS 'Unique URL segment for guest feed: /p/[slug]';

-- ========== 백필: slug가 비어 있는 기존 이벤트에 기본값 설정 ==========
-- /p/[slug]/admin 또는 게스트 업로드 시 "Event not found" 나오면 아래를 실행하세요.
-- (id를 slug로 쓰면 URL이 /p/550e8400-e29b-41d4-a716-446655440000/admin 형태가 됨)

UPDATE events
SET slug = id::text
WHERE slug IS NULL OR slug = '';

-- 백필 후 해당 이벤트의 admin 링크는 /p/{위에서 설정된 slug}/admin 입니다.
-- 예: 이벤트 id가 'abc-123-uuid' 면 /p/abc-123-uuid/admin 로 접속
