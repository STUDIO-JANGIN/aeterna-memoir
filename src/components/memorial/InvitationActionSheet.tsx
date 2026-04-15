"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Download, MessageCircle, Share2, X } from "lucide-react"
import type { AppStrings } from "@/lib/appTranslations"
import { getAppBaseUrl } from "@/lib/appUrl"
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
import { renderMemorialInvitationPdfFromCanvasInput } from "@/lib/memorialInvitationPdfExport"
import type { LandingLocale } from "@/lib/landingTranslations"
import { ARTISAN_SPRING } from "@/lib/artisanMotion"

type MemorialTx = AppStrings["memorial"]

/** Matches create-flow {@link MemorialInvitationCard} / canvas PDF export. */
export type InvitationCanvasData = {
  name: string
  birthDate: string | null
  deathDate: string | null
  location: string | null
  ceremonyTime: string | null
  fundLink: string | null
  profileImageUrl: string | null
  profileImagePan: { x: number; y: number } | null
  remembranceBio: string | null
  /** Localized contact line for canvas PDF — above QR */
  contactDetailsLine: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  slug: string
  deceasedName: string | null
  locale: LandingLocale
  memorial: MemorialTx
  /** Required — same inputs as the create wizard invitation preview (9:16 canvas → PDF). */
  invitationCanvasData: InvitationCanvasData | null
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
  if (m === "instagram") return tx.adminInvitationShareInstagram
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
  if (kind === "instagram") {
    return (
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
}

function guestMemorialUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : getAppBaseUrl())
  const origin = String(base || getAppBaseUrl()).replace(/\/+$/, "")
  return `${origin}/p/${encodeURIComponent(slug.trim())}`
}

export function InvitationActionSheet({
  open,
  onOpenChange,
  slug,
  deceasedName,
  locale,
  memorial: m,
  invitationCanvasData,
}: Props) {
  const titleId = useId()
  const isDesktop = useIsDesktop()
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [guestPageUrl, setGuestPageUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState<"primary" | "native" | "download" | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pdfPreviewObjectUrl, setPdfPreviewObjectUrl] = useState<string | null>(null)

  const primary = getPrimaryMessenger(locale)
  const filename = buildInvitationPdfFilename(deceasedName)
  const shareTitle = "Invitation"
  const shareText = m.adminInvitationShareText(deceasedName?.trim() || "")

  const reset = useCallback(() => {
    setLoadState("idle")
    setErrorMsg(null)
    setPdfBlob(null)
    setGuestPageUrl(null)
    setBusy(null)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    if (!invitationCanvasData) {
      setErrorMsg(m.adminInvitationError)
      setLoadState("error")
      return
    }
    let cancelled = false
    setLoadState("loading")
    setErrorMsg(null)
    ;(async () => {
      try {
        const gu = guestMemorialUrl(slug)
        const blob = await renderMemorialInvitationPdfFromCanvasInput({
          name: invitationCanvasData.name.trim() || "Beloved",
          guestUrl: gu,
          birthDate: invitationCanvasData.birthDate,
          deathDate: invitationCanvasData.deathDate,
          location: invitationCanvasData.location,
          ceremonyTime: invitationCanvasData.ceremonyTime,
          fundLink: invitationCanvasData.fundLink,
          profileImageUrl: invitationCanvasData.profileImageUrl,
          profileImagePan: invitationCanvasData.profileImagePan,
          remembranceBio: invitationCanvasData.remembranceBio,
          contactDetailsLine: invitationCanvasData.contactDetailsLine,
        })
        if (cancelled) return
        setPdfBlob(blob)
        setGuestPageUrl(gu)
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
  }, [open, slug, invitationCanvasData, m.adminInvitationError, reset])

  useEffect(() => {
    if (!pdfBlob) {
      setPdfPreviewObjectUrl(null)
      return
    }
    const u = URL.createObjectURL(pdfBlob)
    setPdfPreviewObjectUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [pdfBlob])

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

  const shareBodyWithLink = useMemo(() => {
    if (!guestPageUrl) return shareText
    return `${shareText}\n\n${guestPageUrl}`
  }, [shareText, guestPageUrl])

  const handlePrimary = async () => {
    if (!pdfBlob || busy) return
    setBusy("primary")
    try {
      const okFile = await sharePdfAsFile(pdfBlob, filename, shareTitle, shareText)
      if (okFile) return
      if (guestPageUrl) {
        /**
         * WhatsApp has no URL scheme to attach a PDF. If Web Share with a file failed, save the PDF
         * locally and open WhatsApp with the memorial link so the user can attach the file from
         * their downloads / Files app.
         */
        if (primary === "whatsapp") {
          downloadPdfBlob(pdfBlob, filename)
          runPrimaryMessengerFallback(primary, shareText, guestPageUrl, null)
          return
        }
        const okUrl = await shareInvitationUrl(guestPageUrl, shareBodyWithLink)
        if (okUrl) return
        runPrimaryMessengerFallback(primary, shareText, guestPageUrl, null)
        return
      }
    } finally {
      setBusy(null)
    }
  }

  const handleNativeShare = async () => {
    if (!pdfBlob || busy) return
    setBusy("native")
    try {
      const okFile = await sharePdfAsFile(pdfBlob, filename, shareTitle, shareText)
      if (okFile) return
      if (guestPageUrl) {
        const okUrl = await shareInvitationUrl(guestPageUrl, shareBodyWithLink)
        if (okUrl) return
        const copied = await copyTextToClipboard(shareBodyWithLink)
        setToast(copied ? m.adminInvitationCopied : m.adminInvitationError)
        return
      }
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
    <div className="card-treasure max-h-[min(92dvh,720px)] w-full rounded-t-2xl p-[1px] shadow-[0_-16px_56px_rgba(0,0,0,0.55)] sm:rounded-[var(--radius-artisan)] sm:shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(92dvh,720px)] flex-col overflow-hidden rounded-t-[calc(var(--radius-artisan)-1px)] card-treasure-inner sm:rounded-[calc(var(--radius-artisan)-1px)]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h2
            id={titleId}
            className="font-[var(--font-serif)] text-[1.05rem] font-medium leading-snug tracking-tight text-[var(--landing-text-hero)]"
          >
            {m.adminInvitationSheetTitle}
          </h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/65 transition hover:bg-white/[0.06] hover:text-[var(--landing-text-hero)]"
            aria-label={m.adminInvitationClose}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loadState === "loading" && (
            <div
              className="flex min-h-[min(280px,42dvh)] flex-col items-center justify-center gap-8 px-2 py-6"
              aria-busy
              aria-live="polite"
            >
              <div className="w-full max-w-[240px] space-y-3 text-center">
                <div className="relative mx-auto h-1 overflow-hidden rounded-full bg-[var(--aeterna-charcoal-muted)]">
                  <div
                    className="absolute inset-y-0 left-0 w-[42%] rounded-full bg-gradient-to-r from-transparent via-[var(--aeterna-gold)] to-transparent shadow-[0_0_14px_rgba(197,160,89,0.45)] animate-[goldLoad_2s_ease-in-out_infinite]"
                    aria-hidden
                  />
                </div>
                <p className="font-[var(--font-serif)] text-sm leading-relaxed text-[var(--landing-text-body)]">
                  {m.adminInvitationSheetPreparing}
                </p>
                <p className="text-[10px] label-uppercase tracking-[0.22em] text-[var(--landing-text-muted)]">
                  {m.adminSharePdfInvitation}
                </p>
              </div>
            </div>
          )}
          {loadState === "error" && (
            <p className="rounded-xl border border-red-500/25 bg-red-950/30 px-4 py-3 text-sm text-red-200/95" role="alert">
              {errorMsg ?? m.adminInvitationError}
            </p>
          )}
          {loadState === "ready" && pdfBlob && guestPageUrl && (
            <div className="flex flex-col gap-3">
              <div className="h-[min(50vh,420px)] w-full overflow-hidden rounded-xl border border-[var(--border-gold-subtle)]/55 bg-[#080808]/95 ring-1 ring-[var(--aeterna-gold)]/10">
                <iframe
                  title={m.adminInvitationSheetTitle}
                  src={pdfPreviewObjectUrl ?? undefined}
                  className="h-full min-h-[240px] w-full bg-[#faf8f5]"
                />
              </div>
              <button
                type="button"
                onClick={() => void handlePrimary()}
                disabled={busy !== null}
                className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[var(--aeterna-gold)]/45 bg-[var(--aeterna-gold)]/12 px-4 text-sm font-medium tracking-wide text-[var(--aeterna-gold)] transition hover:bg-[var(--aeterna-gold)]/18 disabled:opacity-50"
              >
                <PrimaryIcon kind={primary} />
                {busy === "primary" ? m.adminPdfGenerating : primaryLabel(primary, m)}
              </button>

              <button
                type="button"
                onClick={() => void handleNativeShare()}
                disabled={busy !== null}
                className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-sm font-medium tracking-wide text-[var(--landing-text-hero)] transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                <Share2 className="h-5 w-5 shrink-0 text-[var(--aeterna-gold)]/90" strokeWidth={1.5} />
                <span className="flex flex-col items-start text-left">
                  <span className="font-[var(--font-serif)]">{m.adminInvitationNativeShare}</span>
                  <span className="text-[11px] font-normal text-[var(--landing-text-muted)]">
                    {m.adminInvitationNativeShareHint}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={busy !== null}
                className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 text-sm font-medium tracking-wide text-[var(--landing-text-hero)] transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                <Download className="h-5 w-5 shrink-0 text-[var(--aeterna-gold)]/90" strokeWidth={1.5} />
                {busy === "download" ? m.adminPdfGenerating : m.adminInvitationDownload}
              </button>

              <p className="pt-1 text-center text-[11px] leading-relaxed text-[var(--landing-text-muted)]">
                {buildInvitationShareMessage(deceasedName)}
              </p>
            </div>
          )}
        </div>
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
            className="absolute inset-0 bg-black/65 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />
          {isDesktop ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <motion.div
                className="pointer-events-auto w-full max-w-[min(100vw-2rem,26rem)]"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={ARTISAN_SPRING}
              >
                {sheetContent}
              </motion.div>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-0 pt-10">
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
              className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[101] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-[var(--border-gold)] bg-[#1e1e1e]/95 px-4 py-2.5 text-center text-[12px] text-[var(--landing-text-body)] shadow-lg backdrop-blur-sm"
            >
              {toast}
            </div>
          ) : null}
        </div>
      )}
    </AnimatePresence>
  )
}
