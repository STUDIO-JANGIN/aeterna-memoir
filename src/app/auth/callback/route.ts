import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_ANON_KEY_FALLBACK, SUPABASE_PROJECT_URL } from "@/lib/supabaseEnv"

/** Only allow same-origin relative redirects (path + optional query). */
function sanitizeNextParam(param: string | null): string {
  if (!param) return "/create"
  const t = param.trim()
  if (!t.startsWith("/") || t.startsWith("//")) return "/create"
  return t
}

/**
 * PKCE OAuth return URL. Add to Supabase Dashboard → Authentication → URL Configuration:
 * - Redirect URLs: https://aeternamemoir.com/auth/callback (and http://localhost:3000/auth/callback for dev)
 * - Site URL: https://aeternamemoir.com
 *
 * Session cookies must be applied to the **same** `NextResponse` as the redirect. Using `cookies().set()`
 * from `next/headers` in a Route Handler often fails to attach auth cookies to the redirect, which causes
 * intermittent “signed out after Google” until retry (race with PKCE / cookie timing).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextPath = sanitizeNextParam(url.searchParams.get("next"))

  if (code) {
    const redirectTarget = new URL(nextPath, url.origin).toString()
    const response = NextResponse.redirect(redirectTarget)

    const supabase = createServerClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY_FALLBACK, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        `${url.origin}/create?auth_error=${encodeURIComponent(error.message)}`
      )
    }
    return response
  }

  return NextResponse.redirect(new URL(nextPath, url.origin).toString())
}
