-- Optional phone for printed invitation (“please contact … for further details”).
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS invitation_contact_phone text;

COMMENT ON COLUMN events.invitation_contact_phone IS 'Contact phone for service details on the printable invitation; optional.';
