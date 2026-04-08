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

/** Production site when env is missing (SSR / CLI). OAuth should still use a stable host. */
const CANONICAL_PRODUCTION_ORIGIN = "https://aeternamemoir.com"

/**
 * Base URL for Supabase OAuth `redirectTo` (must match an entry in Supabase Auth → Redirect URLs).
 * Prefer NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL so production never sends users to a stale *.vercel.app URL.
 */
export function getOAuthRedirectBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000"
  }
  return CANONICAL_PRODUCTION_ORIGIN
}

/** Supabase Google OAuth redirect: `/auth/callback` exchanges the code (SSR) then sends the user to `next`. */
export function buildOAuthCallbackRedirectUrl(nextPath: string): string {
  const base = getOAuthRedirectBaseUrl()
  const next = nextPath.startsWith("/") ? nextPath : "/create"
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`
}
