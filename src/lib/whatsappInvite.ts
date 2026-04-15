/**
 * WhatsApp deep links: native app on phones/tablets (`whatsapp://`), `wa.me` on desktop
 * (opens WhatsApp Desktop app when installed, else WhatsApp Web).
 */

function prefersWhatsAppDeepLink(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent || ""
  if (/Android|iPhone|iPod|Mobile/i.test(ua)) return true
  if (/iPad/i.test(ua)) return true
  /** iPadOS 13+ Safari reports as Mac; treat touch Mac as tablet. */
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true
  return false
}

export function openWhatsAppWithPrefilledText(text: string): void {
  if (typeof window === "undefined") return
  const encoded = encodeURIComponent(text)
  if (prefersWhatsAppDeepLink()) {
    window.location.href = `whatsapp://send?text=${encoded}`
    return
  }
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer")
}
