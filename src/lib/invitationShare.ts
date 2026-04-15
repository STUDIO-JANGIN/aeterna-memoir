import type { LandingLocale } from "@/lib/landingTranslations"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappInvite"

export type PrimaryMessenger = "instagram" | "line" | "whatsapp"

/** Korea → Instagram (system share / paste); Japan & Chinese locales → LINE; default → WhatsApp. */
export function getPrimaryMessenger(locale: LandingLocale): PrimaryMessenger {
  if (locale === "ko") return "instagram"
  if (locale === "ja" || locale === "zh" || locale === "zh-hk") return "line"
  return "whatsapp"
}

export type MemorialShareChannel = "instagram" | "line" | "whatsapp" | "sms" | "email" | "copy"

/** Primary + secondary share actions for the guest memorial modal (order: primary first). */
export function getMemorialShareChannelOrder(locale: LandingLocale): {
  primary: MemorialShareChannel
  secondary: MemorialShareChannel[]
} {
  switch (locale) {
    case "ko":
      return { primary: "instagram", secondary: ["sms", "copy"] }
    case "ja":
      return { primary: "line", secondary: ["sms", "email", "copy"] }
    case "zh":
      return { primary: "line", secondary: ["sms", "copy"] }
    case "zh-hk":
      return { primary: "line", secondary: ["sms", "copy"] }
    case "ar":
      return { primary: "whatsapp", secondary: ["sms", "copy"] }
    default:
      return { primary: "whatsapp", secondary: ["sms", "copy"] }
  }
}

/**
 * Instagram has no URL scheme to prefill DMs from the web. Uses the Web Share API so the user can
 * pick Instagram from the system sheet (common on mobile); otherwise copies the message for paste into IG.
 */
export function openInstagramMemorialShare(shareText: string, pageUrl: string): void {
  if (typeof window === "undefined") return
  const text = shareText.trim()
  const url = pageUrl.trim()
  const payload = url && !text.includes(url) ? `${text}\n${url}` : text || url

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    const shareData: ShareData = { text: payload }
    if (url) shareData.url = url
    void navigator.share(shareData).catch(() => {
      void copyTextToClipboard(payload)
    })
    return
  }
  void copyTextToClipboard(payload)
}

/**
 * @deprecated Legacy Kakao path; prefer {@link openInstagramMemorialShare} for Korea.
 */
export function openKakaoMemorialShare(shareText: string, pageUrl: string): void {
  openInstagramMemorialShare(shareText, pageUrl)
}

export function sanitizeInvitationFilenameSegment(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return "Memorial"
  const cleaned = trimmed
    .replace(/[^\p{L}\p{N}\s\-_.]/gu, "")
    .replace(/\s+/g, "_")
    .slice(0, 48)
  return cleaned || "Memorial"
}

export function buildInvitationPdfFilename(deceasedName: string | null): string {
  const base = sanitizeInvitationFilenameSegment(deceasedName ?? "")
  return `Aeterna_Invitation_${base}.pdf`
}

export function buildInvitationShareMessage(deceasedName: string | null): string {
  const n = deceasedName?.trim() || "our loved one"
  return `Memorial invitation — ${n}`
}

/** Whether `navigator.share` can accept our PDF as a `File`. */
export function canSharePdfFile(file: File): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false
  if (typeof navigator.canShare !== "function") return true
  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

export async function sharePdfAsFile(
  blob: Blob,
  filename: string,
  title: string,
  text: string
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false
  const file = new File([blob], filename, { type: "application/pdf" })
  if (!canSharePdfFile(file)) return false
  try {
    await navigator.share({
      files: [file],
      title,
      text,
    })
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return true
    return false
  }
}

export async function shareInvitationUrl(url: string, text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false
  try {
    await navigator.share({ url, text })
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return true
    return false
  }
}

const WHATSAPP_URL_SAFE_CHARS = 2000

/**
 * Opens WhatsApp with prefilled text — native app on phones/tablets (`whatsapp://send`),
 * `wa.me` on desktop (see {@link openWhatsAppWithPrefilledText}). Truncates very long payloads.
 */
export function openWhatsAppWithText(text: string): void {
  if (typeof window === "undefined") return
  let t = text.trim()
  while (encodeURIComponent(t).length > WHATSAPP_URL_SAFE_CHARS && t.length > 80) {
    t = `${t.slice(0, Math.floor(t.length * 0.85))}…`
  }
  openWhatsAppWithPrefilledText(t)
}

export function openLineWithText(text: string): void {
  const u = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`
  window.open(u, "_blank", "noopener,noreferrer")
}

/** Link-based share to Kakao Story (no SDK). Opens in a new tab. */
export function openKakaoStoryShareUrl(pdfUrl: string): void {
  const u = `https://story.kakao.com/share?url=${encodeURIComponent(pdfUrl)}`
  window.open(u, "_blank", "noopener,noreferrer")
}

/**
 * When native share / PDF file share is unavailable, open the primary chat app or share sheet.
 * Prefer `primaryLink` (e.g. memorial guest URL). Optional `storyShareUrl` is unused for Instagram;
 * kept for API compatibility.
 */
export function runPrimaryMessengerFallback(
  kind: PrimaryMessenger,
  shareLine: string,
  primaryLink: string,
  storyShareUrl?: string | null
): void {
  const main = primaryLink.trim()
  const text = `${shareLine.trim()}\n\n${main}`
  if (kind === "whatsapp") {
    openWhatsAppWithText(text)
    return
  }
  if (kind === "line") {
    openLineWithText(text)
    return
  }
  openInstagramMemorialShare(text, main)
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}
