/** Detect common donation / support hosts for URL validation and favicon display. */

export type SupportProviderId =
  | "gofundme"
  | "paypal"
  | "venmo"
  | "cashapp"
  | "kofi"
  | "stripe"
  | "facebook"
  | "givebutter"
  | "generic"

export type SupportLinkParse = {
  ok: boolean
  href: string | null
  provider: SupportProviderId
  /** Host for favicon lookup, e.g. gofundme.com */
  faviconHost: string
}

function providerFromHost(host: string): SupportProviderId {
  const h = host.toLowerCase()
  if (h.includes("gofundme")) return "gofundme"
  if (h.includes("paypal") || h.includes("paypal.me")) return "paypal"
  if (h.includes("venmo")) return "venmo"
  if (h.includes("cash.app") || h.includes("cashapp")) return "cashapp"
  if (h.includes("ko-fi") || h.includes("kofi")) return "kofi"
  if (h.includes("stripe")) return "stripe"
  if (h.includes("facebook.com")) return "facebook"
  if (h.includes("givebutter")) return "givebutter"
  return "generic"
}

/**
 * Empty string → ok (user skipped). Non-empty must be a valid http(s) URL.
 */
export function parseSupportUrl(raw: string): SupportLinkParse {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: true, href: null, provider: "generic", faviconHost: "" }
  }
  try {
    const withProto = trimmed.includes("://") ? trimmed : `https://${trimmed}`
    const u = new URL(withProto)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, href: null, provider: "generic", faviconHost: "" }
    }
    const host = u.hostname.replace(/^www\./, "")
    if (!host) {
      return { ok: false, href: null, provider: "generic", faviconHost: "" }
    }
    return {
      ok: true,
      href: u.href,
      provider: providerFromHost(host),
      faviconHost: host,
    }
  } catch {
    return { ok: false, href: null, provider: "generic", faviconHost: "" }
  }
}

export function faviconUrlForHost(host: string, size = 64): string {
  if (!host) return ""
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}`
}
