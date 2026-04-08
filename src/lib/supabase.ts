import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_ANON_KEY_FALLBACK, SUPABASE_PROJECT_URL } from "@/lib/supabaseEnv"

/**
 * Anon Supabase client for Route Handlers / Node contexts without a browser cookie jar.
 * Client components should import `supabase` from `@/lib/supabase/browser` so sessions sync to cookies.
 *
 * **Vercel:** `NEXT_PUBLIC_SUPABASE_URL` = Supabase → Settings → API → Project URL.
 * **Google OAuth:** `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` = `https://aeternamemoir.com`.
 * Supabase Dashboard → Auth → Site URL + Redirect URLs must include `https://aeternamemoir.com/auth/callback`.
 * OAuth `redirectTo` is built in `@/lib/appUrl` (`buildOAuthCallbackRedirectUrl`) — never rely on `*.vercel.app`.
 */
export const supabase: SupabaseClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY_FALLBACK)
