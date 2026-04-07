/**
 * WhatsApp deep links: native app on mobile (`whatsapp://`), universal web fallback (`wa.me`).
 */

export function openWhatsAppWithPrefilledText(text: string): void {
  if (typeof window === "undefined") return
  const encoded = encodeURIComponent(text)
  const ua = navigator.userAgent || ""
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  if (isMobile) {
    window.location.href = `whatsapp://send?text=${encoded}`
    return
  }
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer")
}
