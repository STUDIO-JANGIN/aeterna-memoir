/**
 * Canonical app base URL for redirects, webhooks, and links.
 * Use this instead of hardcoding localhost so Vercel deployments never redirect to localhost.
 *
 * Order: NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL → Vercel’s VERCEL_URL → localhost
 *
 * In Vercel: set NEXT_PUBLIC_APP_URL to your production URL (e.g. https://aeterna.com)
 * or leave unset to use the deployment URL (https://<VERCEL_URL>).
 * Do not set NEXT_PUBLIC_APP_URL to http://localhost:3000 in Vercel.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`
  }
  return "http://localhost:3000"
}
