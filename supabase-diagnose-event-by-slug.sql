-- ============================================================
-- Diagnostic: investigate /p/memorial-7k0clf/admin "Event not found"
-- Run in order in Supabase SQL Editor.
-- ============================================================

-- 1) Check slug matching in events table (including case/whitespace)
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

-- 2) Show rows that match memorial-7k0clf after normalization
SELECT id, name, slug, created_at
FROM events
WHERE lower(trim(slug)) = 'memorial-7k0clf';

-- 3) Fix: if slug mismatches due to case/whitespace, normalize exactly to 'memorial-7k0clf'
--    (run only if step 2 returns rows)
UPDATE events
SET slug = 'memorial-7k0clf'
WHERE lower(trim(slug)) = 'memorial-7k0clf'
  AND (slug IS DISTINCT FROM 'memorial-7k0clf');

-- 4) Check RLS policies on events table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'events';

-- 5) Check whether RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'events';

-- 6) RLS notes
--    Server Action(getEventBySlug) uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS.
--    "Event not found" is usually caused by slug mismatch (steps 1–3).
--    RLS applies only when clients query events directly with anon key.
--    If reads are blocked in that case, add a policy like below (only if needed).
--
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'events';
-- (relrowsecurity = true means RLS is enabled)
--
-- Example: allow SELECT on events (testing only, run only if needed)
-- CREATE POLICY "Allow read events" ON events FOR SELECT USING (true);
