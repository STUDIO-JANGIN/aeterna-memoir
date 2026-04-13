import type { LandingLocale } from "@/lib/landingTranslations"

export type PrimaryMessenger = "kakao" | "line" | "whatsapp"

/** Korea → Kakao; Japan & Traditional Chinese (Taiwan) → LINE; Hong Kong & default → WhatsApp. */
export function getPrimaryMessenger(locale: LandingLocale): PrimaryMessenger {
  if (locale === "ko") return "kakao"
  if (locale === "ja" || locale === "zh") return "line"
  return "whatsapp"
}

export type MemorialShareChannel = "kakao" | "line" | "whatsapp" | "sms" | "email" | "copy"

/** Primary + secondary share actions for the guest memorial modal (order: primary first). */
export function getMemorialShareChannelOrder(locale: LandingLocale): {
  primary: MemorialShareChannel
  secondary: MemorialShareChannel[]
} {
  switch (locale) {
    case "ko":
      return { primary: "kakao", secondary: ["sms", "copy"] }
    case "ja":
      return { primary: "line", secondary: ["sms", "email", "copy"] }
    case "zh":
      return { primary: "line", secondary: ["sms", "copy"] }
    case "zh-hk":
      return { primary: "whatsapp", secondary: ["sms", "copy"] }
    case "ar":
      return { primary: "whatsapp", secondary: ["sms", "copy"] }
    default:
      return { primary: "whatsapp", secondary: ["sms", "copy"] }
  }
}

/**
 * KakaoTalk / Kakao Story — no JS SDK. Mobile: deep link with prefilled text; desktop: Kakao Story share URL.
 */
export function openKakaoMemorialShare(shareText: string, pageUrl: string): void {
  if (typeof window === "undefined") return
  const text = shareText.trim()
  const url = pageUrl.trim()
  const payload = url && !text.includes(url) ? `${text}\n${url}` : text || url
  const ua = navigator.userAgent || ""
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua)
  if (isMobile) {
    window.location.href = `kakaotalk://send?text=${encodeURIComponent(payload)}`
    return
  }
  window.open(
    `https://story.kakao.com/share?url=${encodeURIComponent(url || window.location.href)}`,
    "_blank",
    "noopener,noreferrer",
  )
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

export function openWhatsAppWithText(text: string): void {
  const u = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(u, "_blank", "noopener,noreferrer")
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

export function runPrimaryMessengerFallback(
  kind: PrimaryMessenger,
  pdfUrl: string,
  shareLine: string
): void {
  const text = `${shareLine}\n${pdfUrl}`
  if (kind === "whatsapp") {
    openWhatsAppWithText(text)
    return
  }
  if (kind === "line") {
    openLineWithText(text)
    return
  }
  openKakaoStoryShareUrl(pdfUrl)
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
