"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Copy, MessageSquare } from "lucide-react"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { getPrimaryMessenger, openInstagramMemorialShare, openLineWithText } from "@/lib/invitationShare"
import type { LandingLocale } from "@/lib/landingTranslations"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappInvite"

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconLine({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4C7.58 4 4 7.13 4 11c0 2.38 1.03 4.5 2.63 5.9L6 20l3.35-1.47c.95.26 1.96.4 3.01.4 4.42 0 8-3.13 8-7s-3.58-7-8-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function primaryInviteChannelLabel(
  locale: LandingLocale,
  kind: ReturnType<typeof getPrimaryMessenger>,
  whatsAppLabel: string
): string {
  if (kind === "whatsapp") return whatsAppLabel
  if (kind === "line") return "LINE"
  return locale === "ko" ? "인스타그램" : "Instagram"
}

function ShareInviteIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-[4.5rem] flex-col items-center gap-2.5 rounded-2xl px-1 py-1 transition-colors"
    >
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.04] text-[#e8e4dc] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-colors group-hover:border-[var(--aeterna-gold)]/40 group-hover:bg-[var(--aeterna-gold)]/10 group-hover:text-[var(--aeterna-gold)]">
        {children}
      </span>
      <span className="text-[9px] font-medium tracking-[0.18em] text-white/45 transition-colors group-hover:text-white/70">{label}</span>
    </button>
  )
}

/** Appends `share=1` so the memorial page opens the photo & story upload flow. */
export function memorialUploadUrlFromPageUrl(memorialPageUrl: string): string {
  const t = memorialPageUrl.trim()
  if (!t) return t
  try {
    const u = new URL(t)
    u.searchParams.set("share", "1")
    return u.toString()
  } catch {
    return t.includes("?") ? `${t}&share=1` : `${t}?share=1`
  }
}

/**
 * SMS / copy / feed share — premium invitation wording.
 * Link opens the memorial with the upload flow (`?share=1`).
 */
export function buildGlobalShareMessage(name: string, memorialPageUrl: string): string {
  const n = name.trim() || "our loved one"
  const link = memorialUploadUrlFromPageUrl(memorialPageUrl.trim())
  return `You are invited to contribute to the digital shrine of ${n}. Please share your favorite photos and stories here: ${link}`
}

type MemorialShareActionsProps = {
  name: string
  /** Public memorial page URL (origin + `/p/{slug}`). */
  guestUrl: string
  className?: string
}

async function tryNativeShareText(text: string): Promise<"shared" | "aborted" | "unavailable"> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return "unavailable"
  try {
    await navigator.share({ text })
    return "shared"
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return "aborted"
    return "unavailable"
  }
}

export function MemorialShareActions({ name, guestUrl, className = "" }: MemorialShareActionsProps) {
  const [copied, setCopied] = useState(false)
  const { locale, app: tx } = useLandingLocale()
  const primary = getPrimaryMessenger(locale)

  const memorial = guestUrl.trim()

  const getMessage = useCallback(() => buildGlobalShareMessage(name, memorial), [name, memorial])

  const copy = useCallback(async () => {
    const t = getMessage()
    try {
      await navigator.clipboard.writeText(t)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const input = document.createElement("input")
      input.value = t
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [getMessage])

  const shareViaPrimaryMessenger = useCallback(() => {
    const text = getMessage()
    const uploadUrl = memorialUploadUrlFromPageUrl(memorial)
    if (primary === "instagram") {
      openInstagramMemorialShare(text, uploadUrl)
      return
    }
    if (primary === "line") {
      openLineWithText(text)
      return
    }
    openWhatsAppWithPrefilledText(text)
  }, [getMessage, memorial, primary])

  const shareViaMessage = useCallback(async () => {
    const text = getMessage()
    const r = await tryNativeShareText(text)
    if (r === "shared" || r === "aborted") return
    if (typeof window === "undefined") return
    const body = encodeURIComponent(text)
    window.location.href = `sms:?&body=${body}`
  }, [getMessage])

  const primaryLabel = primaryInviteChannelLabel(locale, primary, tx.memorial.whatsApp)

  return (
    <div className={`flex max-w-md flex-wrap items-start justify-center gap-4 sm:gap-6 ${className}`}>
      <ShareInviteIconButton label={copied ? "Copied" : "Copy"} onClick={copy}>
        <Copy className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </ShareInviteIconButton>
      <ShareInviteIconButton label={primaryLabel} onClick={shareViaPrimaryMessenger}>
        {primary === "instagram" ? (
          <IconInstagram className="h-[22px] w-[22px]" />
        ) : primary === "line" ? (
          <IconLine className="h-[22px] w-[22px]" />
        ) : (
          <IconWhatsApp className="h-[22px] w-[22px]" />
        )}
      </ShareInviteIconButton>
      <ShareInviteIconButton label="Message" onClick={shareViaMessage}>
        <MessageSquare className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </ShareInviteIconButton>
    </div>
  )
}
