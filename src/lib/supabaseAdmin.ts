import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL"
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY"

let _adminClient: SupabaseClient | null = null

/**
 * Server-only Supabase client (service role). Use in Server Actions and API routes.
 * Lazy-initialized so env is read at first use, not at module load (avoids "supabaseKey is required" during prerender).
 * Throws a clear error if env vars are missing.
 *
 * RULE (src/app/actions): Every function that uses `supabase` MUST declare it at the start of that function:
 *   const supabase = getSupabaseAdmin()
 * Do not use a module-level supabase; each action/function needs its own declaration.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_adminClient) return _adminClient

  const url = process.env[SUPABASE_URL_ENV]
  const key = process.env[SUPABASE_SERVICE_ROLE_KEY_ENV]

  const missing: string[] = []
  if (!url || (typeof url === "string" && url.trim() === "")) missing.push(SUPABASE_URL_ENV)
  if (!key || (typeof key === "string" && key.trim() === "")) missing.push(SUPABASE_SERVICE_ROLE_KEY_ENV)

  if (missing.length > 0) {
    throw new Error(
      `Supabase server config missing: ${missing.join(", ")}. ` +
        `Add them in Vercel → Project → Settings → Environment Variables (Production/Preview), then redeploy.`
    )
  }

  _adminClient = createClient(url as string, key as string, {
    auth: { persistSession: false },
  })
  return _adminClient
}
