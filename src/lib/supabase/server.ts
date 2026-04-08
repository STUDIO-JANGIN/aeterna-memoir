import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SUPABASE_ANON_KEY_FALLBACK, SUPABASE_PROJECT_URL } from "@/lib/supabaseEnv"

/** Server-only Supabase client with user session from cookies (App Router). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY_FALLBACK, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component — read-only cookie context
        }
      },
    },
  })
}
