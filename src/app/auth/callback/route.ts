import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

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
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const nextPath = sanitizeNextParam(url.searchParams.get("next"))

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        `${url.origin}/create?auth_error=${encodeURIComponent(error.message)}`
      )
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin).toString())
}
