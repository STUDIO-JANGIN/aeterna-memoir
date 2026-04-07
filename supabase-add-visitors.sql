-- Visitors table: who left memories or subscribed for notifications.
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email text,
  provider text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE visitors IS 'Visitors who shared memories or subscribed to notifications.';
COMMENT ON COLUMN visitors.email IS 'Visitor email used for notifications.';
COMMENT ON COLUMN visitors.provider IS 'Origin of the visit: email, google, kakao, etc.';

