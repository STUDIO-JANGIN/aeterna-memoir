import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY_FALLBACK, SUPABASE_PROJECT_URL } from "@/lib/supabaseEnv"

/**
 * Browser Supabase client with cookie-based session (via @supabase/ssr).
 * Use this from client components so Server Actions that call `createSupabaseServerClient()`
 * see the same session as `getUser()`.
 */
export const supabase: SupabaseClient = createBrowserClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY_FALLBACK)
