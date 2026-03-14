-- 이벤트 수집 기간(Expiry System): 추억 수집 마감일
-- 기본값은 앱에서 생성일 + 7일로 설정하며, DB 기본값은 사용하지 않음 (insert 시 전달)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS expired_at timestamptz;

COMMENT ON COLUMN events.expired_at IS '추억 수집 마감 시각 (기본: 생성일 기준 7일 후). 이 시각 이후에는 게스트 업로드 비활성화.';

-- 기존 행: collection_end_at이 있으면 그대로, 없으면 created_at + 7일로 채우기 (선택)
-- UPDATE events SET expired_at = COALESCE(collection_end_at, created_at + interval '7 days') WHERE expired_at IS NULL;
