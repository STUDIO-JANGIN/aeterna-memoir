-- 계좌 정보(bank_info) + 플랫폼 후원 결제 구분(purpose)

-- events: 유족 계좌 정보 (조의금 송금용)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS bank_info text;

COMMENT ON COLUMN events.bank_info IS '유족 계좌 정보. 후원 완료 시에만 노출';

-- payments: 결제 목적 구분 (premium_film | platform_tip)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'premium_film';

-- 기존 행은 premium_film 유지
UPDATE payments SET purpose = 'premium_film' WHERE purpose IS NULL;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_purpose_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_purpose_check CHECK (purpose IN ('premium_film', 'platform_tip'));

COMMENT ON COLUMN payments.purpose IS 'premium_film: 영상 패키지 | platform_tip: 플랫폼 후원(1,000원)';
