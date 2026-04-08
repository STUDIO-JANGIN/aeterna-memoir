"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, Printer } from "lucide-react"
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

  const btnClass =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#c5a059]/40 bg-[#f2ebe0]/90 px-5 text-[13px] font-normal tracking-wide text-[#333] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-colors hover:bg-[#ebe3d6] disabled:opacity-40 [font-family:var(--font-sans)]"

  return (
    <div className={`flex flex-col items-center gap-5 py-2 text-center ${className}`}>
      <div
        className="relative w-full max-w-[min(200px,38vw)] shrink-0 overflow-hidden rounded-[1.35rem] border border-[rgba(197,160,89,0.38)] bg-[#faf8f5] shadow-[0_20px_50px_-18px_rgba(51,51,51,0.18),0_2px_8px_rgba(51,51,51,0.06)]"
        style={{ aspectRatio: "9 / 16" }}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full min-h-[min(300px,40vh)] w-full items-center justify-center bg-[#f0ebe4] text-sm text-[#6b6b6b] [font-family:var(--font-sans)]">
            Preparing invitation…
          </div>
        )}
      </div>

      <div className="h-px w-20 max-w-[40%] shrink-0 bg-[rgba(197,160,89,0.35)]" aria-hidden />

      <p className="max-w-[min(260px,88vw)] shrink-0 text-[11px] leading-relaxed tracking-[0.28em] text-[#8a857c] uppercase font-[var(--font-serif)]">
        Printable invitation · 9:16 · ink-friendly
      </p>

      <div className="flex w-full max-w-sm shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <button type="button" onClick={handleSaveImage} disabled={busy || !previewSrc} className={btnClass}>
          <Download className="h-4 w-4 shrink-0" strokeWidth={1} aria-hidden />
          Save image
        </button>
        <button type="button" onClick={handlePrintPdf} disabled={busy || !previewSrc} className={btnClass}>
          <Printer className="h-4 w-4 shrink-0" strokeWidth={1} aria-hidden />
          Print PDF
        </button>
      </div>
    </div>
  )
}
