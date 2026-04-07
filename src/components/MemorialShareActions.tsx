"use client"

import { useCallback, useState, type ReactNode } from "react"
import { Copy, MessageSquare } from "lucide-react"

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
 * SMS / WhatsApp / copy — concise English for U.S., Australia, and other English-speaking guests.
 * Link opens the memorial with the upload flow (`?share=1`).
 */
export function buildGlobalShareMessage(name: string, memorialPageUrl: string): string {
  const n = name.trim() || "our loved one"
  const link = memorialUploadUrlFromPageUrl(memorialPageUrl.trim())
  return `We are celebrating the life of ${n}. Please share your photos and memories here: ${link}`
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

  const shareViaWhatsApp = useCallback(async () => {
    const text = getMessage()
    const r = await tryNativeShareText(text)
    if (r === "shared" || r === "aborted") return
    if (typeof window === "undefined") return
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }, [getMessage])

  const shareViaMessage = useCallback(async () => {
    const text = getMessage()
    const r = await tryNativeShareText(text)
    if (r === "shared" || r === "aborted") return
    if (typeof window === "undefined") return
    const body = encodeURIComponent(text)
    window.location.href = `sms:?&body=${body}`
  }, [getMessage])

  return (
    <div className={`flex max-w-md flex-wrap items-start justify-center gap-4 sm:gap-6 ${className}`}>
      <ShareInviteIconButton label={copied ? "Copied" : "Copy"} onClick={copy}>
        <Copy className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </ShareInviteIconButton>
      <ShareInviteIconButton label="WhatsApp" onClick={shareViaWhatsApp}>
        <IconWhatsApp className="h-[22px] w-[22px]" />
      </ShareInviteIconButton>
      <ShareInviteIconButton label="Message" onClick={shareViaMessage}>
        <MessageSquare className="h-[22px] w-[22px]" strokeWidth={1.75} />
      </ShareInviteIconButton>
    </div>
  )
}
