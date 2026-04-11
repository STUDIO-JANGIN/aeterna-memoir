import { headers } from "next/headers"

/**
 * Returns ISO 3166-1 alpha-2 country for the requester (Vercel / Cloudflare compatible).
 * Used to pick default checkout currency on first landing visit.
 */
export async function GET() {
  const h = await headers()
  const country =
    h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("x-country-code") ?? null
  return Response.json({ country: country?.trim() || null })
}
