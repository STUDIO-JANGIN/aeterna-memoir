/**
 * 9:16 printable invitation — ivory / charcoal / champagne gold, gallery-style spacing.
 */

import QRCode from "qrcode"

const W = 1080
const H = 1920

const PAPER = "#faf8f5"
const INK = "#333333"
const INK_SOFT = "#4a4a6a"
const INK_MUTED = "#6b6b6b"
const CHAMPAGNE_STROKE = "rgba(197, 160, 89, 0.42)"
const BORDER_INNER = "#d9d4cc"

const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const FONT_SANS = "Inter, system-ui, -apple-system, sans-serif"

async function ensureInvitationFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return
  try {
    await Promise.all([
      document.fonts.load("600 52px 'Playfair Display'"),
      document.fonts.load("400 28px 'Playfair Display'"),
      document.fonts.load("italic 400 24px 'Playfair Display'"),
      document.fonts.load("400 22px Inter"),
      document.fonts.load("500 21px Inter"),
      document.fonts.load("600 11px Inter"),
    ])
  } catch {
    /* fall back to system fonts */
  }
  await document.fonts.ready
}

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
  remembranceBio?: string | null
}

export async function renderMemorialInvitationCanvas(input: MemorialInvitationCanvasInput): Promise<HTMLCanvasElement> {
  await ensureInvitationFonts()

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

  const margin = 44
  roundRectPath(ctx, margin, margin, W - margin * 2, H - margin * 2, 12)
  ctx.strokeStyle = CHAMPAGNE_STROKE
  ctx.lineWidth = 1.5
  ctx.stroke()

  const innerM = margin + 28
  roundRectPath(ctx, innerM, innerM, W - innerM * 2, H - innerM * 2, 8)
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = 1
  ctx.stroke()

  const contentW = W - innerM * 2 - 64
  const centerX = W / 2
  let y = innerM + 56

  ctx.textAlign = "center"
  ctx.fillStyle = INK_MUTED
  ctx.font = `400 20px ${FONT_SANS}`
  ctx.fillText("In Loving Memory of", centerX, y)
  y += 40

  ctx.fillStyle = INK
  ctx.font = `600 48px ${FONT_SERIF}`
  const displayName = name.trim() || "Beloved"
  const nameLines = wrapTitle(ctx, displayName, contentW)
  nameLines.forEach((line) => {
    ctx.fillText(line, centerX, y)
    y += 58
  })
  y += 32

  /** Portrait frame ~35% of content width, graceful vertical proportion */
  const photoW = Math.floor(contentW * 0.36)
  const photoH = Math.floor(photoW * 1.42)
  const photoX = (W - photoW) / 2
  const photoY = y
  const photoR = 18

  ctx.save()
  ctx.shadowColor = "rgba(51, 51, 51, 0.1)"
  ctx.shadowBlur = 32
  ctx.shadowOffsetY = 12
  ctx.shadowOffsetX = 0
  roundRectPath(ctx, photoX, photoY, photoW, photoH, photoR)
  ctx.fillStyle = "#f0ebe4"
  ctx.fill()
  ctx.restore()

  ctx.save()
  roundRectPath(ctx, photoX, photoY, photoW, photoH, photoR)
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
    ctx.fillStyle = "#ebe6df"
    ctx.fillRect(photoX, photoY, photoW, photoH)
    ctx.fillStyle = INK_MUTED
    ctx.font = `600 64px ${FONT_SERIF}`
    ctx.textAlign = "center"
    ctx.fillText(displayName.charAt(0).toUpperCase() || "·", centerX, photoY + photoH / 2 + 6)
  }
  ctx.restore()

  ctx.save()
  roundRectPath(ctx, photoX, photoY, photoW, photoH, photoR)
  ctx.strokeStyle = CHAMPAGNE_STROKE
  ctx.lineWidth = 1.25
  ctx.stroke()
  ctx.restore()

  const dividerY = photoY + photoH + 32
  ctx.beginPath()
  ctx.strokeStyle = "rgba(197, 160, 89, 0.35)"
  ctx.lineWidth = 1
  ctx.moveTo(innerM + 56, dividerY)
  ctx.lineTo(W - innerM - 56, dividerY)
  ctx.stroke()

  y = dividerY + 40

  const birth = formatDisplayDate(birthDate)
  const death = formatDisplayDate(deathDate)
  ctx.textAlign = "center"
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 24px ${FONT_SANS}`
  ctx.fillText(`${birth}  —  ${death}`, centerX, y)
  y += 52

  const bioRaw = remembranceBio?.trim()
  if (bioRaw) {
    ctx.fillStyle = INK_MUTED
    ctx.font = `600 11px ${FONT_SANS}`
    ctx.letterSpacing = "0.28em"
    ctx.fillText("WORDS OF REMEMBRANCE", centerX, y)
    ctx.letterSpacing = "0"
    y += 36

    ctx.fillStyle = INK
    ctx.font = `italic 400 24px ${FONT_SERIF}`
    const bioLines = wrapLines(ctx, bioRaw, contentW, 8)
    bioLines.forEach((ln) => {
      ctx.fillText(ln, centerX, y)
      y += 38
    })
    y += 28
  }

  y += 12

  ctx.textAlign = "center"
  ctx.fillStyle = INK_MUTED
  ctx.font = `600 11px ${FONT_SANS}`
  ctx.letterSpacing = "0.22em"
  ctx.fillText("SERVICE", centerX, y)
  ctx.letterSpacing = "0"
  y += 34
  ctx.fillStyle = INK_SOFT
  ctx.font = `400 22px ${FONT_SANS}`
  ctx.fillText(`Location: ${displayLocation(location)}`, centerX, y)
  y += 36
  ctx.fillText(`Service time: ${displayService(ceremonyTime)}`, centerX, y)
  y += 44

  const fund = fundLink?.trim()
  if (fund) {
    ctx.fillStyle = INK_MUTED
    ctx.font = `600 11px ${FONT_SANS}`
    ctx.letterSpacing = "0.22em"
    ctx.fillText("SUPPORT", centerX, y)
    ctx.letterSpacing = "0"
    y += 30
    ctx.fillStyle = INK
    ctx.font = `400 20px ${FONT_SANS}`
    const supLines = wrapLines(ctx, fund, contentW, 4)
    supLines.forEach((ln) => {
      ctx.fillText(ln, centerX, y)
      y += 30
    })
    y += 24
  }

  /** QR: ~20% smaller than legacy 280px cap; generous quiet zone */
  const qrMax = 224
  const reserveBottom = 200
  y = Math.min(y + 20, H - reserveBottom - qrMax - 48)
  const qrSize = Math.min(qrMax, H - y - reserveBottom)

  const qrCanvas = document.createElement("canvas")
  await QRCode.toCanvas(qrCanvas, guestUrl, {
    width: qrSize,
    margin: 4,
    color: { dark: "#333333", light: "#ffffff" },
    errorCorrectionLevel: "M",
  })

  const qrPad = 22
  const qrX = (W - qrSize) / 2
  ctx.save()
  roundRectPath(ctx, qrX - qrPad, y - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2, 12)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
  ctx.drawImage(qrCanvas, qrX, y)

  y += qrSize + qrPad + 22
  ctx.textAlign = "center"
  ctx.fillStyle = INK
  ctx.font = `500 21px ${FONT_SANS}`
  ctx.fillText("Scan to share a memory", centerX, y)

  y += 40
  ctx.fillStyle = INK_MUTED
  ctx.font = `400 17px ${FONT_SANS}`
  const short = guestUrl.replace(/^https?:\/\//, "")
  const display = short.length > 48 ? `${short.slice(0, 46)}…` : short
  ctx.fillText(display, centerX, y)

  ctx.fillStyle = "#8a857c"
  ctx.font = `400 14px ${FONT_SERIF}`
  ctx.fillText("Aeterna", centerX, H - innerM - 28)

  return canvas
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.95)
  })
}
