-- Add creator_email to events table (for admin verification / Magic Link later)
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE events
ADD COLUMN IF NOT EXISTS creator_email text;

COMMENT ON COLUMN events.creator_email IS 'Email of the family member who created the memorial; used for admin access verification (e.g. Magic Link).';
