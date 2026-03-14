-- AI 영상 파이프라인: 10초 프리뷰 URL, 풀버전 렌더 요청 시각
ALTER TABLE events
ADD COLUMN IF NOT EXISTS preview_film_url text,
ADD COLUMN IF NOT EXISTS full_film_requested_at timestamptz;

COMMENT ON COLUMN events.preview_film_url IS '10초 AI 헌정 영상 미리보기 URL (워터마크 포함).';
COMMENT ON COLUMN events.full_film_requested_at IS '결제 완료 후 1분 풀버전 렌더 요청 시각. 백엔드 job이 이 값을 보고 렌더링 시작.';
