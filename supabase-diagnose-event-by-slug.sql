-- ============================================================
-- 진단: /p/memorial-7k0clf/admin "Event not found" 원인 확인
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================================

-- 1) Slug 일치 여부: events 테이블의 slug 값 확인 (대소문자·공백 포함)
SELECT
  id,
  name,
  slug,
  length(slug) AS slug_len,
  slug = 'memorial-7k0clf' AS exact_match,
  lower(trim(slug)) = 'memorial-7k0clf' AS normalized_match,
  created_at
FROM events
WHERE slug IS NOT NULL
ORDER BY created_at DESC;

-- 2) memorial-7k0clf와 정규화했을 때 일치하는 행만 보기
SELECT id, name, slug, created_at
FROM events
WHERE lower(trim(slug)) = 'memorial-7k0clf';

-- 3) 수정: slug가 대소문자/공백 때문에 안 맞는 경우, 정확히 'memorial-7k0clf'로 통일
--    (위 2번에서 행이 나온 경우에만 실행)
UPDATE events
SET slug = 'memorial-7k0clf'
WHERE lower(trim(slug)) = 'memorial-7k0clf'
  AND (slug IS DISTINCT FROM 'memorial-7k0clf');

-- 4) RLS(보안 정책) 확인: events 테이블 정책 목록
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'events';

-- 5) RLS가 켜져 있는지 확인
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'events';

-- 6) RLS 참고
--    Server Action(getEventBySlug)은 SUPABASE_SERVICE_ROLE_KEY로 호출하므로
--    RLS를 우회합니다. "Event not found"는 보통 slug 불일치(1~3번) 때문입니다.
--    anon 키로 클라이언트에서 직접 events를 조회하는 경우에만 RLS가 적용되며,
--    그때 읽기가 막혀 있다면 아래처럼 정책을 추가할 수 있습니다 (필요 시에만).
--
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'events';
-- (relrowsecurity = true 이면 RLS 활성화됨)
--
-- 예: events 테이블 SELECT 허용 (테스트용, 필요 시에만 실행)
-- CREATE POLICY "Allow read events" ON events FOR SELECT USING (true);
