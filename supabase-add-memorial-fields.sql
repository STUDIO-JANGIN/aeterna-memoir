-- Aeterna 비즈니스 로직: events 테이블 확장
-- memorial_type, status, photo_deadline, is_premium

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS memorial_type text DEFAULT 'person' CHECK (memorial_type IN ('person', 'pet'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'expired'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS photo_deadline timestamptz;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.memorial_type IS 'person | pet';
COMMENT ON COLUMN events.status IS 'active | expired';
COMMENT ON COLUMN events.photo_deadline IS '사진 수집 마감 시각. 이후 블러 + Premium 팝업';
COMMENT ON COLUMN events.is_premium IS 'Premium 구독 시 true, 복구 가능';

-- 기존 행: photo_deadline을 collection_end_at으로 채우기
UPDATE events
SET photo_deadline = COALESCE(collection_end_at, expired_at, created_at + interval '7 days')
WHERE photo_deadline IS NULL;
