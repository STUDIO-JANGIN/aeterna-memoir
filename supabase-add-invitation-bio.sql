-- Optional words of remembrance for printable invitation (create flow + PDF).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS invitation_bio text;

COMMENT ON COLUMN events.invitation_bio IS 'Short remembrance message for the printable invitation; optional.';
