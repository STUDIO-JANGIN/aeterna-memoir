-- TOP 20 랭킹: stories.likes_count (없을 경우에만 추가)
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN stories.likes_count IS '좋아요 수. 하트 클릭 시 증가, 상위 20장이 AI Film 후보로 선발됨.';
