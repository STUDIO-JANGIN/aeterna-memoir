/**
 * Single source for Supabase project URL + anon key fallbacks (browser, server, legacy `supabase.ts`).
 * Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel to the **Project URL** from Supabase → Settings → API
 * (e.g. `https://<ref>.supabase.co`).
 */
export const SUPABASE_PROJECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://clnxgqhbejscniwhvmjc.supabase.co"

export const SUPABASE_ANON_KEY_FALLBACK =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnhncWhiZWpzY25pd2h2bWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg5MTUsImV4cCI6MjA4NzUxNDkxNX0.oDR8Wf8fSwb00X-jgASuO47z9V6Al6I10gUZ1Tu2HK0"
