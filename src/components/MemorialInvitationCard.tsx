"use client"

import { useCallback, useEffect, useState } from "react"
import { PDFDocument } from "pdf-lib"
import {
  canvasToPngBlob,
  renderMemorialInvitationCanvas,
  type MemorialInvitationCanvasInput,
} from "@/lib/memorialInvitationCanvas"

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
  /** Words of remembrance — center of printable invitation */
  remembranceBio?: string | null
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
  remembranceBio,
}: MemorialInvitationCardProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
        remembranceBio,
      }),
    )
  }, [name, slug, guestUrl, birthDate, deathDate, location, ceremonyTime, fundLink, profileImageUrl, remembranceBio])

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
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `memorial-invitation-${slug}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }, [renderCanvas, slug])

  const handlePrintPdf = useCallback(async () => {
    setBusy(true)
    try {
      const canvas = await renderCanvas()
      const blob = await canvasToPngBlob(canvas)
      const bytes = new Uint8Array(await blob.arrayBuffer())
      const pdfDoc = await PDFDocument.create()
      const png = await pdfDoc.embedPng(bytes)
      const page = pdfDoc.addPage([png.width, png.height])
      page.drawImage(png, { x: 0, y: 0, width: png.width, height: png.height })
      const pdfBytes = await pdfDoc.save()
      const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
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
  }, [renderCanvas, slug])

  return (
    <div className={`flex flex-col items-center gap-4 py-1 ${className}`}>
      <div
        className="relative w-full max-w-[min(224px,72vw)] shrink-0 overflow-hidden rounded-2xl border-2 border-[#b8a050]/80 bg-[#f9f9f9] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.35)] sm:max-w-[min(238px,50vw)]"
        style={{ aspectRatio: "9 / 16" }}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full min-h-[min(320px,42vh)] w-full items-center justify-center bg-[#f0f0f0] text-sm text-[#666]">
            Preparing invitation…
          </div>
        )}
      </div>
      <p className="shrink-0 text-center text-[10px] tracking-[0.22em] uppercase text-white/40">
        Printable invitation · 9:16 · ink-friendly
      </p>
      <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
        <button
          type="button"
          onClick={handleSaveImage}
          disabled={busy || !previewSrc}
          className="min-h-[46px] rounded-xl bg-[#1a2332] px-5 text-sm font-semibold tracking-wide text-white shadow-sm transition-opacity hover:bg-[#243044] disabled:opacity-40"
        >
          Save image
        </button>
        <button
          type="button"
          onClick={handlePrintPdf}
          disabled={busy || !previewSrc}
          className="min-h-[46px] rounded-xl bg-[#1a2332] px-5 text-sm font-semibold tracking-wide text-white shadow-sm transition-opacity hover:bg-[#243044] disabled:opacity-40"
        >
          Print PDF
        </button>
      </div>
    </div>
  )
}
