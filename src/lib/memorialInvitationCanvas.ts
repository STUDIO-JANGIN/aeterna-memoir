/**
 * 9:16 printable invitation — ivory / charcoal / champagne gold, gallery-style spacing.
 */

import QRCode from "qrcode"

const W = 1080
const H = 1920

const PAPER = "#fcf8f5"
const INK = "#333333"
const INK_SOFT = "#4a4a6a"
const INK_MUTED = "#6b6b6b"
/** Gentle gold for the name (aligned with invitation PDF) */
const NAME_GOLD = "#C5A059"
/** Subtle monument dividers */
const DIVIDER_GOLD = "rgba(212, 175, 55, 0.1)"
/** Outer deckle frame */
const CHAMPAGNE_STROKE = "rgba(197, 160, 89, 0.42)"
const BORDER_INNER = "#d9d4cc"
/** Profile ring — champagne gold */
const GOLD_RING = "#D4AF37"

const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const FONT_SANS = "Inter, system-ui, -apple-system, sans-serif"

/** Typography scale (rem → px at 16px root) */
const NAME_REM = 2.5
const NAME_SIZE_PX = Math.round(16 * NAME_REM) // 40
const DATE_QUOTE_REM = 0.9
const DATE_QUOTE_SIZE_PX = Math.round(16 * DATE_QUOTE_REM) // ~14
const SECTION_HEADER_REM = 0.75
const SECTION_HEADER_SIZE_PX = Math.round(16 * SECTION_HEADER_REM) // 12
const SECTION_HEADER_TRACKING_EM = 0.2

async function ensureInvitationFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return
  try {
    await Promise.all([
      document.fonts.load(`600 ${NAME_SIZE_PX}px 'Playfair Display'`),
      document.fonts.load(`400 20px 'Playfair Display'`),
      document.fonts.load(`italic 300 ${DATE_QUOTE_SIZE_PX}px 'Playfair Display'`),
      document.fonts.load(`300 ${DATE_QUOTE_SIZE_PX}px Inter`),
      document.fonts.load(`400 22px Inter`),
      document.fonts.load(`500 ${SECTION_HEADER_SIZE_PX}px Inter`),
      document.fonts.load(`300 ${DATE_QUOTE_SIZE_PX}px Inter`),
      document.fonts.load(`400 17px Inter`),
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
  /** 0–100 each, matches CSS `object-position` (50 = centered). */
  profileImagePan?: { x: number; y: number } | null
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
    profileImagePan,
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
  ctx.fillText("In Loving Memory Of", centerX, y)
  y += 44

  ctx.fillStyle = NAME_GOLD
  ctx.font = `600 ${NAME_SIZE_PX}px ${FONT_SERIF}`
  const displayName = name.trim() || "Beloved"
  const nameLines = wrapTitle(ctx, displayName, contentW)
  const nameLineHeight = Math.round(NAME_SIZE_PX * 1.25)
  nameLines.forEach((line) => {
    ctx.fillText(line, centerX, y)
    y += nameLineHeight
  })
  y += 40

  /** Circular portrait — slightly smaller than legacy rectangular frame */
  const photoD = Math.floor(contentW * 0.28)
  const photoX = (W - photoD) / 2
  const photoY = y
  const photoCx = centerX
  const photoCy = photoY + photoD / 2
  const photoRadius = photoD / 2

  ctx.save()
  ctx.shadowColor = "rgba(51, 51, 51, 0.1)"
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 10
  ctx.shadowOffsetX = 0
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2)
  ctx.fillStyle = "#f0ebe4"
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2)
  ctx.clip()
  let drewPhoto = false
  if (profileImageUrl?.trim()) {
    const img = await loadImage(profileImageUrl.trim())
    if (img && img.complete && img.naturalWidth > 0) {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const scale = Math.max(photoD / iw, photoD / ih)
      const dw = iw * scale
      const dh = ih * scale
      const px = Math.min(100, Math.max(0, profileImagePan?.x ?? 50))
      const py = Math.min(100, Math.max(0, profileImagePan?.y ?? 50))
      const dx = photoX + (photoD - dw) + (px / 100) * (dw - photoD)
      const dy = photoY + (photoD - dh) + (py / 100) * (dh - photoD)
      ctx.drawImage(img, dx, dy, dw, dh)
      drewPhoto = true
    }
  }
  if (!drewPhoto) {
    ctx.fillStyle = "#ebe6df"
    ctx.beginPath()
    ctx.rect(photoX, photoY, photoD, photoD)
    ctx.fill()
    ctx.fillStyle = INK_MUTED
    ctx.font = `600 56px ${FONT_SERIF}`
    ctx.textAlign = "center"
    ctx.fillText(displayName.charAt(0).toUpperCase() || "·", photoCx, photoCy + 6)
  }
  ctx.restore()

  /** 1px gold ring — high-end monument frame */
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2)
  ctx.strokeStyle = GOLD_RING
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()

  const birth = formatDisplayDate(birthDate)
  const death = formatDisplayDate(deathDate)
  y = photoY + photoD + 36
  ctx.textAlign = "center"
  ctx.fillStyle = INK
  ctx.font = `500 ${DATE_QUOTE_SIZE_PX + 1}px ${FONT_SANS}`
  ctx.fillText(`${birth}  —  ${death}`, centerX, y)
  y += 52

  const drawGoldDivider = (dividerY: number) => {
    ctx.beginPath()
    ctx.strokeStyle = DIVIDER_GOLD
    ctx.lineWidth = 1
    ctx.moveTo(innerM + 56, dividerY)
    ctx.lineTo(W - innerM - 56, dividerY)
    ctx.stroke()
  }

  const bioRaw = remembranceBio?.trim()
  if (bioRaw) {
    const dividerY = y + 16
    drawGoldDivider(dividerY)
    y = dividerY + 36

    ctx.fillStyle = INK
    ctx.font = `italic 300 ${DATE_QUOTE_SIZE_PX}px ${FONT_SERIF}`
    const bioLines = wrapLines(ctx, bioRaw, contentW, 14)
    const quoteLineGap = Math.round(DATE_QUOTE_SIZE_PX * 1.45)
    bioLines.forEach((ln) => {
      ctx.fillText(ln, centerX, y)
      y += quoteLineGap
    })
    y += 36
  } else {
    y += 28
  }

  if (bioRaw) {
    const sepY = y + 12
    drawGoldDivider(sepY)
    y = sepY + 48
  } else {
    y += 32
  }

  /** Extra air between hero block and service / QR */
  y += 28

  const fontDetailLine = `300 ${DATE_QUOTE_SIZE_PX}px ${FONT_SANS}`
  const fontScanCta = `500 21px ${FONT_SANS}`
  const fontUrlLine = `400 17px ${FONT_SANS}`

  ctx.textAlign = "center"
  ctx.save()
  ctx.fillStyle = INK
  ctx.font = `500 ${SECTION_HEADER_SIZE_PX}px ${FONT_SANS}`
  ctx.letterSpacing = `${SECTION_HEADER_TRACKING_EM}em`
  ctx.fillText("SERVICE", centerX, y)
  ctx.letterSpacing = "0"
  ctx.restore()
  y += 40
  ctx.fillStyle = INK_MUTED
  ctx.font = fontDetailLine
  ctx.fillText(`Location: ${displayLocation(location)}`, centerX, y)
  y += 32
  ctx.fillText(`Service time: ${displayService(ceremonyTime)}`, centerX, y)
  y += 44

  const fund = fundLink?.trim()
  if (fund) {
    ctx.save()
    ctx.fillStyle = INK
    ctx.font = `500 ${SECTION_HEADER_SIZE_PX}px ${FONT_SANS}`
    ctx.letterSpacing = `${SECTION_HEADER_TRACKING_EM}em`
    ctx.fillText("MEMORIAL FUND", centerX, y)
    ctx.letterSpacing = "0"
    ctx.restore()
    y += 36
    ctx.fillStyle = INK_MUTED
    ctx.font = fontDetailLine
    const supLines = wrapLines(ctx, fund, contentW, 4)
    supLines.forEach((ln) => {
      ctx.fillText(ln, centerX, y)
      y += Math.round(DATE_QUOTE_SIZE_PX * 1.5)
    })
    y += 28
  }

  /** QR — ~15% smaller, placed lower for text breathing room */
  const qrMax = Math.round(176 * 0.85)
  const reserveBottom = 200
  y = Math.min(y + 52, H - reserveBottom - qrMax - 56)
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
  ctx.font = fontScanCta
  ctx.fillText("Scan to visit the memorial", centerX, y)

  y += 40
  ctx.fillStyle = INK_MUTED
  ctx.font = fontUrlLine
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
