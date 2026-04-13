"use client"

import { useCallback, useEffect, useId, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Download, MessageCircle, Share2, X } from "lucide-react"
import { generateInvitePdfAction } from "@/app/actions/generateInvitePdf"
import type { AppStrings } from "@/lib/appTranslations"
import {
  buildInvitationPdfFilename,
  buildInvitationShareMessage,
  copyTextToClipboard,
  downloadPdfBlob,
  getPrimaryMessenger,
  runPrimaryMessengerFallback,
  shareInvitationUrl,
  sharePdfAsFile,
  type PrimaryMessenger,
} from "@/lib/invitationShare"
import type { LandingLocale } from "@/lib/landingTranslations"

type MemorialTx = AppStrings["memorial"]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
  deceasedName: string | null
  locale: LandingLocale
  memorial: MemorialTx
}

type LoadState = "idle" | "loading" | "ready" | "error"

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return isDesktop
}

function primaryLabel(m: PrimaryMessenger, tx: MemorialTx): string {
  if (m === "kakao") return tx.adminInvitationShareKakao
  if (m === "line") return tx.adminInvitationShareLine
  return tx.adminInvitationShareWhatsApp
}

function PrimaryIcon({ kind }: { kind: PrimaryMessenger }) {
  if (kind === "line") {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d="M4 10.5c0-3.5 3.5-6.5 8-6.5s8 3 8 6.5-3.5 6.5-8 6.5c-.8 0-1.6-.1-2.3-.3L6 20l1.2-3.5C4.8 15.2 4 13 4 10.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === "kakao") {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <ellipse cx="12" cy="11" rx="8" ry="7" />
        <path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01M9 13c1 1 2.5 1.5 4 1s2.5-1 3-2" strokeLinecap="round" />
      </svg>
    )
  }
  return <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
}

export function InvitationActionSheet({
  open,
  onOpenChange,
  slug,
  deceasedName,
  locale,
  memorial: m,
}: Props) {
  const titleId = useId()
  const isDesktop = useIsDesktop()
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState<"primary" | "native" | "download" | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const primary = getPrimaryMessenger(locale)
  const filename = buildInvitationPdfFilename(deceasedName)
  const shareTitle = "Invitation"
  const shareText = m.adminInvitationShareText(deceasedName?.trim() || "")

  const reset = useCallback(() => {
    setLoadState("idle")
    setErrorMsg(null)
    setPdfBlob(null)
    setPdfUrl(null)
    setBusy(null)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    let cancelled = false
    setLoadState("loading")
    setErrorMsg(null)
    ;(async () => {
      try {
        const result = await generateInvitePdfAction(slug)
        if (cancelled) return
        if (!result.ok) {
          setErrorMsg(result.error)
          setLoadState("error")
          return
        }
        const url = result.urls?.[locale] ?? result.url
        const res = await fetch(url)
        if (!res.ok) throw new Error("fetch failed")
        const blob = await res.blob()
        if (cancelled) return
        setPdfBlob(blob)
        setPdfUrl(url)
        setLoadState("ready")
      } catch {
        if (!cancelled) {
          setErrorMsg(m.adminInvitationError)
          setLoadState("error")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, slug, locale, m.adminInvitationError, reset])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  const handlePrimary = async () => {
    if (!pdfBlob || !pdfUrl || busy) return
    setBusy("primary")
    try {
      const okFile = await sharePdfAsFile(pdfBlob, filename, shareTitle, shareText)
      if (okFile) return
      const okUrl = await shareInvitationUrl(pdfUrl, shareText)
      if (okUrl) return
      runPrimaryMessengerFallback(primary, pdfUrl, shareText)
    } finally {
      setBusy(null)
    }
  }

  const handleNativeShare = async () => {
    if (!pdfBlob || !pdfUrl || busy) return
    setBusy("native")
    try {
      const okFile = await sharePdfAsFile(pdfBlob, filename, shareTitle, shareText)
      if (okFile) return
      const okUrl = await shareInvitationUrl(pdfUrl, shareText)
      if (okUrl) return
      const copied = await copyTextToClipboard(`${shareText}\n${pdfUrl}`)
      setToast(copied ? m.adminInvitationCopied : m.adminInvitationError)
    } finally {
      setBusy(null)
    }
  }

  const handleDownload = () => {
    if (!pdfBlob || busy) return
    setBusy("download")
    try {
      downloadPdfBlob(pdfBlob, filename)
    } finally {
      setBusy(null)
    }
  }

  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, close])

  const sheetContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="flex max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-t-2xl border border-[#E2E2E2] bg-[#F9F9F7] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:rounded-2xl sm:shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center justify-between border-b border-[#E2E2E2] px-5 py-4">
        <h2 id={titleId} className="font-[family-name:var(--font-serif)] text-lg font-normal tracking-[-0.02em] text-[#1a1a1a]">
          {m.adminInvitationSheetTitle}
        </h2>
        <button
          type="button"
          onClick={close}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#1a1a1a]/70 transition hover:bg-black/[0.04] hover:text-[#1a1a1a]"
          aria-label={m.adminInvitationClose}
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {loadState === "loading" && (
          <p className="font-[family-name:var(--font-serif)] text-sm text-[#1a1a1a]/65">{m.adminInvitationSheetPreparing}</p>
        )}
        {loadState === "error" && (
          <p className="text-sm text-red-700" role="alert">
            {errorMsg ?? m.adminInvitationError}
          </p>
        )}
        {loadState === "ready" && pdfBlob && pdfUrl && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => void handlePrimary()}
              disabled={busy !== null}
              className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#C5A059]/50 bg-[#1a1a1a] px-4 text-sm font-medium tracking-wide text-[#F9F9F7] transition hover:bg-[#2a2a2a] disabled:opacity-50"
            >
              <PrimaryIcon kind={primary} />
              {busy === "primary" ? m.adminPdfGenerating : primaryLabel(primary, m)}
            </button>

            <button
              type="button"
              onClick={() => void handleNativeShare()}
              disabled={busy !== null}
              className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#E2E2E2] bg-white px-4 text-sm font-medium tracking-wide text-[#1a1a1a] transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              <Share2 className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span className="flex flex-col items-start text-left">
                <span className="font-[family-name:var(--font-serif)]">{m.adminInvitationNativeShare}</span>
                <span className="text-[11px] font-normal text-[#1a1a1a]/55">{m.adminInvitationNativeShareHint}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={busy !== null}
              className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#E2E2E2] bg-white px-4 text-sm font-medium tracking-wide text-[#1a1a1a] transition hover:bg-[#fafafa] disabled:opacity-50"
            >
              <Download className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              {busy === "download" ? m.adminPdfGenerating : m.adminInvitationDownload}
            </button>

            <p className="pt-1 text-center text-[11px] leading-relaxed text-[#1a1a1a]/45">
              {buildInvitationShareMessage(deceasedName)}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.button
            type="button"
            aria-label={m.adminInvitationClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          {isDesktop ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <motion.div
                className="pointer-events-auto w-full max-w-md"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              >
                {sheetContent}
              </motion.div>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 flex justify-center p-0 pt-8 pointer-events-none">
              <motion.div
                className="pointer-events-auto w-full max-w-lg"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 380 }}
              >
                {sheetContent}
              </motion.div>
            </div>
          )}
          {toast ? (
            <div
              role="status"
              className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[101] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-[#E2E2E2] bg-[#F9F9F7] px-4 py-3 text-center text-sm text-[#1a1a1a] shadow-lg"
            >
              {toast}
            </div>
          ) : null}
        </div>
      )}
    </AnimatePresence>
  )
}
