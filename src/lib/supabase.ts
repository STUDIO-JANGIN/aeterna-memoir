import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY_FALLBACK, SUPABASE_PROJECT_URL } from "@/lib/supabaseEnv"

/**
 * Anon Supabase client for Route Handlers / Node contexts without a browser cookie jar.
 * Client components should import `supabase` from `@/lib/supabase/browser` so sessions sync to cookies.
 *
 * **Vercel:** `NEXT_PUBLIC_SUPABASE_URL` = Supabase API URL (`*.supabase.co`). App domain = `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` = `https://aeternamemoir.com`.
 * **Google OAuth:** `signInWithOAuth` uses `buildOAuthCallbackRedirectUrl` → `https://aeternamemoir.com/auth/callback?next=...` (see `PRODUCTION_OAUTH_CALLBACK_URL` in `@/lib/appUrl`).
 */
export const supabase: SupabaseClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY_FALLBACK)
