/**
 * Manual sync with Supabase `public.*` tables (mirror updates when the schema changes).
 *
 * - **`EventsRow`**: `public.events` — see `events.schema.ts` (full column list + migration notes).
 * - **`Comment`**: `public.comments` — rows with `is_reported: true` are excluded from memorial UI.
 */
export type { EventsRow } from "./events.schema"

export interface Comment {
  id: string
  visitor_name: string
  text: string
  created_at: string
  is_reported: boolean
  /** Viewer hearts; column added via supabase-comments-likes-count.sql */
  likes_count?: number
}
