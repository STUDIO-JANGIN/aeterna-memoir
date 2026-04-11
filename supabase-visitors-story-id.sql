-- Links a visitor notification signup to the specific story they submitted (for “email when it’s live”).
-- Run in Supabase SQL Editor after reviewing.

ALTER TABLE visitors ADD COLUMN IF NOT EXISTS story_id uuid REFERENCES stories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visitors_event_id ON visitors(event_id);
CREATE INDEX IF NOT EXISTS idx_visitors_story_id ON visitors(story_id);

COMMENT ON COLUMN visitors.story_id IS 'Story this visitor asked to be notified about when approved (post-upload flow).';
