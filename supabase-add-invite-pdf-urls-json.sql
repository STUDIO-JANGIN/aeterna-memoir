-- Per-locale invitation PDF URLs (JSON map: en, ko, ja, …).
-- Run in Supabase SQL Editor after `supabase-add-invite-pdf-url.sql`.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS invite_pdf_urls jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN events.invite_pdf_urls IS 'Map of locale code → public PDF URL for funeral invitations.';
