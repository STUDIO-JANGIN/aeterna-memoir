"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Download, Printer, X } from "lucide-react"
import {
  canvasToPngBlob,
  renderMemorialInvitationCanvas,
  type MemorialInvitationCanvasInput,
} from "@/lib/memorialInvitationCanvas"
import { renderMemorialInvitationPdfFromCanvasInput } from "@/lib/memorialInvitationPdfExport"
import { shareOrDownloadPng } from "@/lib/shareImage"
import { MemorialCard } from "@/components/MemorialCard"

export type MemorialInvitationCardProps = {
  name: string
  slug: string
  guestUrl: string
  className?: string
  birthDate?: string | null
  deathDate?: string | null
  location?: string | null
  ceremonyTime?: string | null
  fundLink?: string | null
  profileImageUrl?: string | null
  /** Framing for profile photo (matches create-flow drag). */
  profileImagePan?: { x: number; y: number } | null
  remembranceBio?: string | null
  /** Localized labels (defaults are English) */
  invitationInfo?: string
  saveImageLabel?: string
  printPdfLabel?: string
  preparingLabel?: string
  invitationShareTitle?: string
}

function buildCanvasInput(p: MemorialInvitationCardProps): MemorialInvitationCanvasInput {
  return {
    name: p.name,
    guestUrl: p.guestUrl,
    birthDate: p.birthDate,
    deathDate: p.deathDate,
    location: p.location,
    ceremonyTime: p.ceremonyTime,
    fundLink: p.fundLink,
    profileImageUrl: p.profileImageUrl,
    profileImagePan: p.profileImagePan,
    remembranceBio: p.remembranceBio,
  }
}

export function MemorialInvitationCard({
  name,
  slug,
  guestUrl,
  className = "",
  birthDate,
  deathDate,
  location,
  ceremonyTime,
  fundLink,
  profileImageUrl,
  profileImagePan,
  remembranceBio,
  invitationInfo = "Printable invitation · 9:16 · ink-friendly",
  saveImageLabel = "Save image",
  printPdfLabel = "Print PDF",
  preparingLabel = "Preparing invitation…",
  invitationShareTitle = "Memorial invitation",
}: MemorialInvitationCardProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)

  const renderCanvas = useCallback(async () => {
    return renderMemorialInvitationCanvas(
      buildCanvasInput({
        name,
        slug,
        guestUrl,
        birthDate,
        deathDate,
        location,
        ceremonyTime,
        fundLink,
        profileImageUrl,
        profileImagePan,
        remembranceBio,
      }),
    )
  }, [name, slug, guestUrl, birthDate, deathDate, location, ceremonyTime, fundLink, profileImageUrl, profileImagePan, remembranceBio])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const canvas = await renderCanvas()
        if (cancelled) return
        setPreviewSrc(canvas.toDataURL("image/png"))
      } catch {
        if (!cancelled) setPreviewSrc(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [renderCanvas])

  const handleSaveImage = useCallback(async () => {
    setBusy(true)
    try {
      const canvas = await renderCanvas()
      const blob = await canvasToPngBlob(canvas)
      await shareOrDownloadPng(blob, `memorial-invitation-${slug}.png`, invitationShareTitle)
    } finally {
      setBusy(false)
    }
  }, [renderCanvas, slug, invitationShareTitle])

  const handlePrintPdf = useCallback(async () => {
    setBusy(true)
    try {
      const input = buildCanvasInput({
        name,
        slug,
        guestUrl,
        birthDate,
        deathDate,
        location,
        ceremonyTime,
        fundLink,
        profileImageUrl,
        profileImagePan,
        remembranceBio,
      })
      const pdfBlob = await renderMemorialInvitationPdfFromCanvasInput(input)
      const url = URL.createObjectURL(pdfBlob)
      const w = window.open(url, "_blank", "noopener,noreferrer")
      if (w) {
        w.addEventListener(
          "load",
          () => {
            try {
              w.print()
            } catch {
              /* ignore */
            }
          },
          { once: true },
        )
        setTimeout(() => URL.revokeObjectURL(url), 120_000)
      } else {
        const a = document.createElement("a")
        a.href = url
        a.download = `memorial-invitation-${slug}.pdf`
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } finally {
      setBusy(false)
    }
  }, [
    name,
    slug,
    guestUrl,
    birthDate,
    deathDate,
    location,
    ceremonyTime,
    fundLink,
    profileImageUrl,
    profileImagePan,
    remembranceBio,
  ])

  useEffect(() => {
    if (!zoomOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [zoomOpen])

  const btnClass =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#c5a059]/40 bg-[#f2ebe0]/90 px-5 text-[13px] font-normal tracking-wide text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#ebe3d6] disabled:opacity-40 [font-family:var(--font-sans)]"

  const zoomLightbox =
    zoomOpen &&
    previewSrc &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-label="Invitation preview enlarged"
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#030303]/80 backdrop-blur-[2px]"
          aria-label="Close preview"
          onClick={() => setZoomOpen(false)}
        />
        <div className="relative z-[1] flex max-h-[min(92dvh,920px)] w-full max-w-[min(92vw,540px)] flex-col rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
          <button
            type="button"
            className="absolute right-2 top-2 z-[2] flex h-10 w-10 items-center justify-center rounded-full bg-[#030303]/65 text-[#f4f1ea] ring-1 ring-white/15 transition-colors hover:bg-[#030303]/85"
            aria-label="Close"
            onClick={() => setZoomOpen(false)}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt=""
            className="max-h-[min(92dvh,920px)] w-full rounded-2xl object-contain object-top"
          />
        </div>
      </div>,
      document.body,
    )

  return (
    <div className={`flex flex-col items-center gap-5 py-2 text-center ${className}`}>
      <button
        type="button"
        onClick={() => previewSrc && setZoomOpen(true)}
        disabled={!previewSrc}
        className="group relative w-full max-w-[min(200px,38vw)] shrink-0 cursor-zoom-in rounded-[32px] border-0 bg-transparent p-0 text-left shadow-[0_20px_50px_-18px_rgba(51,51,51,0.18),0_2px_8px_rgba(51,51,51,0.06)] transition-transform hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:cursor-wait disabled:opacity-70 [aspect-ratio:9/16]"
        aria-label={previewSrc ? "View invitation full size" : "Invitation preview loading"}
      >
        <MemorialCard className="h-full w-full rounded-[32px] border border-[rgba(197,160,89,0.38)] bg-[#faf8f5] [aspect-ratio:9/16]">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="pointer-events-none h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full min-h-[min(300px,40vh)] w-full items-center justify-center bg-[#f0ebe4] text-sm text-[#6b6b6b] [font-family:var(--font-sans)]">
              {preparingLabel}
            </div>
          )}
        </MemorialCard>
      </button>
      {zoomLightbox}

      <div className="h-px w-20 max-w-[40%] shrink-0 bg-[rgba(197,160,89,0.35)]" aria-hidden />

      <p className="max-w-[min(260px,88vw)] shrink-0 text-[11px] leading-relaxed tracking-[0.28em] text-[#8a857c] uppercase font-[var(--font-serif)]">
        {invitationInfo}
      </p>

      <div className="flex w-full max-w-sm shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={handleSaveImage} disabled={busy || !previewSrc} className={btnClass}>
          <Download className="h-4 w-4 shrink-0" strokeWidth={1} aria-hidden />
          {saveImageLabel}
        </button>
        <button type="button" onClick={handlePrintPdf} disabled={busy || !previewSrc} className={btnClass}>
          <Printer className="h-4 w-4 shrink-0" strokeWidth={1} aria-hidden />
          {printPdfLabel}
        </button>
      </div>
    </div>
  )
}
