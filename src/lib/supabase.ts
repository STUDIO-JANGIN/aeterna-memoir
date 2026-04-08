import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Anon Supabase client for Route Handlers / Node contexts without a browser cookie jar.
 * Client components should import `supabase` from `@/lib/supabase/browser` so sessions sync to cookies.
 *
 * **Google OAuth (production):** In Supabase Dashboard → Authentication → URL Configuration, set
 * Site URL to `https://aeternamemoir.com` and add Redirect URLs including
 * `https://aeternamemoir.com/auth/callback` (plus `http://localhost:3000/auth/callback` for local dev).
 * In Vercel, set `NEXT_PUBLIC_APP_URL=https://aeternamemoir.com` so `signInWithOAuth` never targets a stale `*.vercel.app` deployment (which can cause `DEPLOYMENT_NOT_FOUND` / 404).
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://clnxgqhbejscniwhvmjc.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnhncWhiZWpzY25pd2h2bWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg5MTUsImV4cCI6MjA4NzUxNDkxNX0.oDR8Wf8fSwb00X-jgASuO47z9V6Al6I10gUZ1Tu2HK0"

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
