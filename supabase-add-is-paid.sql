-- Paywall: 결제 완료 시 모든 사진 잠금 해제
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN events.is_paid IS '결제 완료 여부. true이면 마감 후에도 게스트 피드에서 모든 사진 선명 노출.';
