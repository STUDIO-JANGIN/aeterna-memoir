/**
 * 9:16 printable invitation — US/AU program style: centered, ink-friendly, portrait-forward.
 */

import QRCode from "qrcode"

const W = 1080
const H = 1920

const INK = "#2c2c2c"
const INK_SOFT = "#3d3d3d"
const INK_MUTED = "#5c5c5c"
const PAPER = "#fafafa"
const BORDER_GOLD = "#a89858"
const BORDER_INNER = "#d4d4d4"

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function formatDisplayDate(s: string | null | undefined): string {
  if (!s || s.trim() === "" || s === "—") return "—"
  const t = s.trim()
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(t)
  if (iso) {
    const d = new Date(t.length === 10 ? `${t}T12:00:00` : t)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    }
  }
  return t
}

function displayLocation(loc: string | null | undefined): string {
  const t = loc?.trim() ?? ""
  if (!t || /^location\s*tbd$/i.test(t)) return "TBD"
  return t
}

function displayService(ceremony: string | null | undefined): string {
  const t = ceremony?.trim() ?? ""
  if (!t || /^time\s*tbd$/i.test(t)) return "TBD"
  return t
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const t = text.trim()
  if (!t) return []
  const words = t.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width <= maxWidth) line = next
    else {
      if (line) lines.push(line)
      line = w
      if (lines.length >= maxLines - 1) break
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines.slice(0, maxLines)
}

function wrapTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const t = text.trim()
  if (!t) return [""]
  if (ctx.measureText(t).width <= maxWidth) return [t]
  const words = t.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (ctx.measureText(next).width <= maxWidth) line = next
    else {
      if (line) lines.push(line)
      line = w
      if (lines.length >= 2) break
    }
  }
  if (line && lines.length < 3) lines.push(line)
  return lines.slice(0, 3)
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export type MemorialInvitationCanvasInput = {
  name: string
  guestUrl: string
  birthDate?: string | null
  deathDate?: string | null
  location?: string | null
  ceremonyTime?: string | null
  fundLink?: string | null
  profileImageUrl?: string | null
  /** Words of remembrance — center of invitation */
  remembranceBio?: string | null
}

export async function renderMemorialInvitationCanvas(input: MemorialInvitationCanvasInput): Promise<HTMLCanvasElement> {
  const {
    name,
    guestUrl,
    birthDate,
    deathDate,
    location,
    ceremonyTime,
    fundLink,
    profileImageUrl,
    remembranceBio,
  } = input

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!
  ctx.textBaseline = "middle"

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)

  const margin = 40
  roundRectPath(ctx, margin, margin, W - margin * 2, H - margin * 2, 10)
  ctx.strokeStyle = BORDER_GOLD
  ctx.lineWidth = 2.5
  ctx.stroke()

  const innerM = margin + 20
  roundRectPath(ctx, innerM, innerM, W - innerM * 2, H - innerM * 2, 8)
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = 1
  ctx.stroke()

  const contentW = W - innerM * 2 - 56
  const centerX = W / 2
  let y = innerM + 48

  ctx.textAlign = "center"
  ctx.fillStyle = INK_MUTED
  ctx.font = "400 22px Georgia, 'Times New Roman', serif"
  ctx.fillText("In Loving Memory of", centerX, y)
  y += 36

  ctx.fillStyle = INK
  ctx.font = "600 44px Georgia, 'Times New Roman', serif"
  const displayName = name.trim() || "Beloved"
  wrapTitle(ctx, displayName, contentW).forEach((line) => {
    ctx.fillText(line, centerX, y)
    y += 52
  })
  y += 28

  /** Hero portrait — ≥60% of content width, centered */
  const photoW = Math.floor(contentW * 0.62)
  const photoH = Math.floor(photoW * 1.12)
  const photoX = (W - photoW) / 2
  const photoY = y

  ctx.save()
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 14)
  ctx.clip()
  let drewPhoto = false
  if (profileImageUrl?.trim()) {
    const img = await loadImage(profileImageUrl.trim())
    if (img && img.complete && img.naturalWidth > 0) {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const scale = Math.max(photoW / iw, photoH / ih)
      const dw = iw * scale
      const dh = ih * scale
      const dx = photoX + (photoW - dw) / 2
      const dy = photoY + (photoH - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
      drewPhoto = true
    }
  }
  if (!drewPhoto) {
    ctx.fillStyle = "#e8e8e8"
    ctx.fillRect(photoX, photoY, photoW, photoH)
    ctx.fillStyle = INK_MUTED
    ctx.font = "600 72px Georgia, serif"
    ctx.textAlign = "center"
    ctx.fillText(displayName.charAt(0).toUpperCase() || "·", centerX, photoY + photoH / 2 + 8)
  }
  ctx.restore()

  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = 1.5
  roundRectPath(ctx, photoX, photoY, photoW, photoH, 14)
  ctx.stroke()

  y += photoH + 36

  const birth = formatDisplayDate(birthDate)
  const death = formatDisplayDate(deathDate)
  ctx.textAlign = "center"
  ctx.fillStyle = INK_SOFT
  ctx.font = "400 26px Georgia, 'Times New Roman', serif"
  ctx.fillText(`${birth}  —  ${death}`, centerX, y)
  y += 48

  const bioRaw = remembranceBio?.trim()
  if (bioRaw) {
    ctx.fillStyle = INK_MUTED
    ctx.font = "italic 400 20px Georgia, 'Times New Roman', serif"
    ctx.fillText("Words of remembrance", centerX, y)
    y += 32

    ctx.fillStyle = INK
    ctx.font = "400 24px Georgia, 'Times New Roman', serif"
    const bioLines = wrapLines(ctx, bioRaw, contentW, 8)
    bioLines.forEach((ln) => {
      ctx.fillText(ln, centerX, y)
      y += 34
    })
    y += 24
  }

  y += 8

  ctx.textAlign = "center"
  ctx.fillStyle = INK_MUTED
  ctx.font = "600 18px system-ui, -apple-system, sans-serif"
  ctx.fillText("SERVICE", centerX, y)
  y += 28
  ctx.fillStyle = INK_SOFT
  ctx.font = "400 22px Georgia, 'Times New Roman', serif"
  ctx.fillText(`Location: ${displayLocation(location)}`, centerX, y)
  y += 32
  ctx.fillText(`Service time: ${displayService(ceremonyTime)}`, centerX, y)
  y += 40

  const fund = fundLink?.trim()
  if (fund) {
    ctx.fillStyle = INK_MUTED
    ctx.font = "600 18px system-ui, -apple-system, sans-serif"
    ctx.fillText("SUPPORT", centerX, y)
    y += 26
    ctx.fillStyle = INK
    ctx.font = "400 20px Georgia, 'Times New Roman', serif"
    const supLines = wrapLines(ctx, fund, contentW, 4)
    supLines.forEach((ln) => {
      ctx.fillText(ln, centerX, y)
      y += 28
    })
    y += 20
  }

  const qrMax = 280
  const reserveBottom = 200
  y = Math.min(y + 16, H - reserveBottom - qrMax)
  const qrSize = Math.min(qrMax, H - y - reserveBottom)

  const qrCanvas = document.createElement("canvas")
  await QRCode.toCanvas(qrCanvas, guestUrl, {
    width: qrSize,
    margin: 2,
    color: { dark: "#2c2c2c", light: "#ffffff" },
    errorCorrectionLevel: "M",
  })

  const qrX = (W - qrSize) / 2
  ctx.save()
  roundRectPath(ctx, qrX - 14, y - 14, qrSize + 28, qrSize + 28, 10)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
  ctx.drawImage(qrCanvas, qrX, y)

  y += qrSize + 22
  ctx.textAlign = "center"
  ctx.fillStyle = INK
  ctx.font = "500 22px Georgia, 'Times New Roman', serif"
  ctx.fillText("Scan to share a memory", centerX, y)

  y += 36
  ctx.fillStyle = INK_MUTED
  ctx.font = "18px ui-monospace, SFMono-Regular, Menlo, monospace"
  const short = guestUrl.replace(/^https?:\/\//, "")
  const display = short.length > 48 ? `${short.slice(0, 46)}…` : short
  ctx.fillText(display, centerX, y)

  ctx.fillStyle = "#8a8a8a"
  ctx.font = "15px Georgia, serif"
  ctx.fillText("Aeterna", centerX, H - innerM - 24)

  return canvas
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.95)
  })
}
