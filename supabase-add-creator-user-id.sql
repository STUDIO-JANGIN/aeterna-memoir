-- Links memorial to auth.users for reliable admin access (preferred over email-only).
-- Run in Supabase SQL editor after deploy.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS creator_user_id uuid;

COMMENT ON COLUMN events.creator_user_id IS 'auth.users.id of the memorial creator; used with creator_email for admin access.';

CREATE INDEX IF NOT EXISTS idx_events_creator_user_id ON events(creator_user_id);
