"use client"

import { useRef, useCallback } from "react"
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://aeterna.com"

type MemorialQRCardProps = {
  slug: string
  title?: string
  description?: string
  /** QR 코드 다운로드 파일명 접두사 */
  downloadName?: string
  className?: string
}

export function MemorialQRCard({ slug, title, description, downloadName = "memorial-qr", className = "" }: MemorialQRCardProps) {
  const qrCanvasRef = useRef<HTMLDivElement>(null)
  const guestUrl = `${BASE_URL.replace(/\/$/, "")}/p/${slug}`

  const handleSaveImage = useCallback(() => {
    const canvas = qrCanvasRef.current?.querySelector("canvas")
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = url
    a.download = `${downloadName}-${slug}.png`
    a.click()
  }, [slug, downloadName])

  const handlePrintPDF = useCallback(() => {
    const canvas = qrCanvasRef.current?.querySelector("canvas")
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    const win = window.open("", "_blank")
    if (!win) {
      window.print()
      return
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Memorial QR - ${slug}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center; }
          .qr { margin: 16px auto; }
          .qr img { display: block; width: 180px; height: 180px; margin: 0 auto; }
          .url { word-break: break-all; color: #666; font-size: 12px; margin-top: 12px; }
          @media print { body { padding: 12px; } .qr img { width: 160px; height: 160px; } }
        </style>
        </head>
        <body>
          ${title ? `<h2 style="margin-bottom:8px">${title}</h2>` : ""}
          ${description ? `<p style="color:#888;font-size:14px">${description}</p>` : ""}
          <div class="qr"><img src="${dataUrl}" alt="QR Code" /></div>
          <p class="url">${guestUrl}</p>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 300)
  }, [slug, title, description, guestUrl])

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        <div className="qr-wrap rounded-2xl border border-[var(--border-gold-subtle)] bg-white p-3">
          <QRCodeSVG value={guestUrl} size={140} level="M" includeMargin={false} />
        </div>
        {/* 숨겨진 캔버스: PNG 다운로드용 */}
        <div ref={qrCanvasRef} className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden>
          <QRCodeCanvas value={guestUrl} size={256} level="M" />
        </div>
        <p className="font-mono text-xs text-[var(--aeterna-gold-muted)] break-all text-center max-w-[280px]">
          {guestUrl}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleSaveImage}
            className="min-h-[40px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            Save image
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="min-h-[40px] px-4 py-2 rounded-full border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-[11px] uppercase tracking-[0.16em] hover:bg-[var(--aeterna-gold-pale)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            Print PDF
          </button>
        </div>
      </div>
    </div>
  )
}
