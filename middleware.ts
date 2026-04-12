import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_ANON_KEY_FALLBACK, SUPABASE_PROJECT_URL } from "@/lib/supabaseEnv"

/**
 * Refreshes Supabase auth cookies on every navigation so Server Components and Route Handlers
 * (e.g. `/p/[slug]/admin` owner check) see the same session as the browser.
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY_FALLBACK, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // Required: refreshes expired sessions so getUser() works in layouts / server actions
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and API (API routes can create their own Supabase client).
     */
    "/((?!_next/static|_next/image|favicon|api|.*\\..*).*)",
  ],
}
