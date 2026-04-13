"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link2, Mail, MessageSquare } from "lucide-react"
import type { LandingLocale } from "@/lib/landingTranslations"
import type { AppStrings } from "@/lib/appTranslations"
import {
  getMemorialShareChannelOrder,
  openKakaoMemorialShare,
  openLineWithText,
  type MemorialShareChannel,
} from "@/lib/invitationShare"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappInvite"

type MemorialTx = AppStrings["memorial"]

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

function IconKakao({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4c-4.42 0-8 2.69-8 6.01 0 2.05 1.33 3.87 3.39 5.03L6.5 20l4.47-2.47c.65.09 1.32.14 2.03.14 4.42 0 8-2.69 8-6s-3.58-6-8-6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function channelIcon(ch: MemorialShareChannel, cls: string) {
  switch (ch) {
    case "whatsapp":
      return <IconWhatsApp className={cls} />
    case "line":
      return <IconLine className={cls} />
    case "kakao":
      return <IconKakao className={cls} />
    case "sms":
      return <MessageSquare className={cls} strokeWidth={1.5} />
    case "email":
      return <Mail className={cls} strokeWidth={1.5} />
    case "copy":
      return <Link2 className={cls} strokeWidth={1.5} />
    default:
      return null
  }
}

function channelLabel(ch: MemorialShareChannel, m: MemorialTx): string {
  switch (ch) {
    case "kakao":
      return "KakaoTalk"
    case "line":
      return "LINE"
    case "whatsapp":
      return m.whatsApp
    case "sms":
      return m.message
    case "email":
      return m.shareChannelEmail
    case "copy":
      return m.copyLink
    default:
      return ""
  }
}

export function ShareMemorialModal({
  open,
  onClose,
  locale,
  shareText,
  pageUrl,
  memorial,
}: {
  open: boolean
  onClose: () => void
  locale: LandingLocale
  shareText: string
  pageUrl: string
  memorial: MemorialTx
}) {
  const [copiedToast, setCopiedToast] = useState(false)
  const { primary, secondary } = getMemorialShareChannelOrder(locale)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const runChannel = useCallback(
    (ch: MemorialShareChannel) => {
      const text = (shareText.trim() || pageUrl.trim()).trim()
      const url = pageUrl.trim()

      if (ch === "copy") {
        void navigator.clipboard.writeText(url).then(() => {
          setCopiedToast(true)
          window.setTimeout(() => setCopiedToast(false), 2400)
        })
        return
      }

      switch (ch) {
        case "kakao":
          openKakaoMemorialShare(text, url)
          break
        case "line":
          openLineWithText(text)
          break
        case "whatsapp":
          openWhatsAppWithPrefilledText(text)
          break
        case "sms":
          window.location.href = `sms:?&body=${encodeURIComponent(text)}`
          break
        case "email":
          window.location.href = `mailto:?body=${encodeURIComponent(text)}`
          break
        default:
          break
      }
      onClose()
    },
    [onClose, pageUrl, shareText],
  )

  if (!open || typeof document === "undefined") return null

  const iconCls = "h-[18px] w-[18px] shrink-0 opacity-90"
  const primaryBtn =
    "flex w-full items-center justify-center gap-2.5 rounded-xl border px-4 py-3.5 text-[13px] font-medium tracking-wide transition-colors min-h-[48px]"
  const secondaryBtn =
    "flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-2 py-3 text-[10px] font-medium tracking-wide text-white/85 transition-colors hover:bg-white/[0.07] min-h-[76px]"

  const secGridClass =
    secondary.length >= 3 ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="memorial-share-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0a0a0a]/96 px-6 py-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="memorial-share-title"
          className="font-[var(--font-serif)] text-[1.05rem] font-medium leading-snug text-[var(--landing-text-hero)]"
        >
          {memorial.shareModalTitle}
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-white/68">{memorial.shareModalBody}</p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => runChannel(primary)}
            className={`${primaryBtn} border-[var(--aeterna-gold)]/45 bg-[var(--aeterna-gold)]/12 text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold)]/18`}
          >
            {channelIcon(primary, iconCls)}
            {channelLabel(primary, memorial)}
          </button>

          <div className={secGridClass}>
            {secondary.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => runChannel(ch)}
                className={secondaryBtn}
              >
                {channelIcon(ch, "h-5 w-5 text-white/75")}
                <span className="leading-tight">{channelLabel(ch, memorial)}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full min-h-[42px] rounded-full border border-white/15 text-[12px] font-medium tracking-wide text-white/78 hover:bg-white/[0.06] transition-colors"
        >
          {memorial.close}
        </button>

        {copiedToast ? (
          <div
            role="status"
            className="pointer-events-none absolute bottom-[4.25rem] left-1/2 z-10 -translate-x-1/2 rounded-full border border-[var(--border-gold)] bg-[#1e1e1e]/95 px-4 py-2 text-[11px] text-[var(--landing-text-body)] shadow-lg"
          >
            {memorial.linkCopied}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
