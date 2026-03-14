-- Funeral invitation PDF URL for each event.
-- Run in Supabase SQL Editor.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS invite_pdf_url text;

COMMENT ON COLUMN events.invite_pdf_url IS '장례 초청장 PDF의 공개 URL.';

