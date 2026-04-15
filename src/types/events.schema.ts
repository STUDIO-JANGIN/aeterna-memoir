/**
 * `public.events` — manual mirror of columns used by the app (Supabase PostgREST).
 *
 * **When adding a new column:** add the SQL migration in repo root (`supabase-*.sql`),
 * run it on Supabase (or use the bundle `supabase-sync-events-optional-columns.sql` for
 * background/profile framing fields), then update this type and any narrow types
 * (`AdminEvent`, `PublicMemorialEvent`, etc.).
 *
 * Locale (Korean vs English) does not change which columns exist — only UI copy.
 * Missing columns in the database cause runtime errors from `.update()` / `select('*')`
 * mapping; keeping this file aligned prevents shipping code that references unknown fields.
 */
export interface EventsRow {
  id: string
  created_at?: string | null

  slug: string | null
  name: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
  flower_link: string | null

  creator_email: string | null
  creator_user_id: string | null

  memorial_type?: string | null
  status?: string | null
  expired_at?: string | null
  collection_end_at?: string | null
  photo_deadline?: string | null

  profile_image: string | null
  /** "x,y" percents 0–100; same format as `memorial_background_position`. */
  profile_image_position?: string | null

  /** Public URL for guest-page blurred background. */
  memorial_background_image?: string | null
  /** "x,y" percents 0–100 for background `object-position`. */
  memorial_background_position?: string | null

  invitation_bio?: string | null
  invitation_contact_phone?: string | null
  music_url?: string | null
  bank_info?: string | null

  tier?: string | null
  is_premium?: boolean | null
  is_paid?: boolean | null
  video_credits?: number | null

  film_url?: string | null
  full_film_url?: string | null
  preview_film_url?: string | null
  full_film_requested_at?: string | null
  tribute_film_urls?: unknown | null
  video_status?: string | null

  invite_pdf_url?: string | null
  invite_pdf_urls?: Record<string, string> | null
}
