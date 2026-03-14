import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/** Browser-only Supabase client (anon key). For server-side use getSupabaseAdmin() from @/lib/supabaseAdmin. */
const supabaseUrl = "https://clnxgqhbejscniwhvmjc.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnhncWhiZWpzY25pd2h2bWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5Mzg5MTUsImV4cCI6MjA4NzUxNDkxNX0.oDR8Wf8fSwb00X-jgASuO47z9V6Al6I10gUZ1Tu2HK0"

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
