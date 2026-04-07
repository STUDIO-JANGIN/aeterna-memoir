import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Anon Supabase client for Route Handlers / Node contexts without a browser cookie jar.
 * Client components should import `supabase` from `@/lib/supabase/browser` so sessions sync to cookies.
 */
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://clnxgqhbejscniwhvmjc.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnhncWhiZWpzY25pd2h2bWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg5MTUsImV4cCI6MjA4NzUxNDkxNX0.oDR8Wf8fSwb00X-jgASuO47z9V6Al6I10gUZ1Tu2HK0"

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
