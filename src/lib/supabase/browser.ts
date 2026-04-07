import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://clnxgqhbejscniwhvmjc.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnhncWhiZWpzY25pd2h2bWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg5MTUsImV4cCI6MjA4NzUxNDkxNX0.oDR8Wf8fSwb00X-jgASuO47z9V6Al6I10gUZ1Tu2HK0"

/**
 * Browser Supabase client with cookie-based session (via @supabase/ssr).
 * Use this from client components so Server Actions that call `createSupabaseServerClient()`
 * see the same session as `getUser()`.
 */
export const supabase: SupabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
