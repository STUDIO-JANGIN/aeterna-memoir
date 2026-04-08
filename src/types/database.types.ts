/**
 * Manual sync with Supabase `public.comments` (mirror updates when the schema changes).
 * Rows with `is_reported: true` are excluded from memorial UI queries.
 */
export interface Comment {
  id: string
  visitor_name: string
  text: string
  created_at: string
  is_reported: boolean
}
