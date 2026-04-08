/**
 * Canonical app base URL for redirects, webhooks, and links.
 * Use this instead of hardcoding localhost so Vercel deployments never redirect to localhost.
 *
 * Order: NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL → Vercel’s VERCEL_URL → localhost
 *
 * In Vercel: set NEXT_PUBLIC_APP_URL to your production URL (e.g. https://aeternamemoir.com)
 * or leave unset to use the deployment URL (https://<VERCEL_URL>).
 * Do not set NEXT_PUBLIC_APP_URL to http://localhost:3000 in Vercel.
 *
 * Stripe Checkout `success_url` / `cancel_url` use this base. Wrong host = users return to
 * localhost or the wrong domain after payment. Set NEXT_PUBLIC_APP_URL in production.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`
  }
  return "http://localhost:3000"
}

/** Public production app origin (Vercel: set `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` to this). */
export const CANONICAL_SITE_ORIGIN = "https://aeternamemoir.com"

/**
 * OAuth redirect registered in Supabase → Auth → Redirect URLs.
 * `signInWithOAuth({ options: { redirectTo } })` uses {@link buildOAuthCallbackRedirectUrl} → this URL (+ query).
 */
export const PRODUCTION_OAUTH_CALLBACK_URL = `${CANONICAL_SITE_ORIGIN}/auth/callback`

function trimBase(url: string): string {
  return url.replace(/\/+$/, "")
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
}

function isVercelPreviewHost(hostname: string): boolean {
  return hostname.endsWith(".vercel.app")
}

/**
 * Base URL for Supabase OAuth `redirectTo` (must match an entry in Supabase Auth → Redirect URLs).
 *
 * Order: `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_SITE_URL` → (browser) localhost stays local;
 * **`*.vercel.app` always maps to {@link CANONICAL_SITE_ORIGIN}** so Google never returns to a dead preview URL.
 */
export function getOAuthRedirectBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return trimBase(process.env.NEXT_PUBLIC_APP_URL)
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return trimBase(process.env.NEXT_PUBLIC_SITE_URL)
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (isLocalHost(host)) {
      return window.location.origin
    }
    if (isVercelPreviewHost(host)) {
      return CANONICAL_SITE_ORIGIN
    }
    return window.location.origin
  }
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return CANONICAL_SITE_ORIGIN
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000"
  }
  return CANONICAL_SITE_ORIGIN
}

/** Supabase Google OAuth redirect: `/auth/callback` exchanges the code (SSR) then sends the user to `next`. */
export function buildOAuthCallbackRedirectUrl(nextPath: string): string {
  const base = getOAuthRedirectBaseUrl()
  const next = nextPath.startsWith("/") ? nextPath : "/create"
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`
}
