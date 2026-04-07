-- AI video pipeline: 10-second preview URL, full-render request timestamp
ALTER TABLE events
ADD COLUMN IF NOT EXISTS preview_film_url text,
ADD COLUMN IF NOT EXISTS full_film_requested_at timestamptz;

COMMENT ON COLUMN events.preview_film_url IS 'Preview URL for 10-second AI tribute film (watermarked).';
COMMENT ON COLUMN events.full_film_requested_at IS 'Timestamp when full 1-minute render is requested after payment. Backend job starts rendering based on this value.';
