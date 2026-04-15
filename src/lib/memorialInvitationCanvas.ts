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
/** Outer deckle frame (slightly richer so thicker stroke stays legible) */
const CHAMPAGNE_STROKE = "rgba(197, 160, 89, 0.58)"
const BORDER_INNER = "#c8c3bb"
/** Profile ring — champagne gold */
const GOLD_RING = "#D4AF37"

const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const FONT_SANS = "Inter, system-ui, -apple-system, sans-serif"

/** Typography scale (rem → px at 16px root) — print/PDF: larger body for readability */
const NAME_REM = 3.25
const NAME_SIZE_PX = Math.round(16 * NAME_REM) // 52
const DATE_QUOTE_REM = 1.3125
const DATE_QUOTE_SIZE_PX = Math.round(16 * DATE_QUOTE_REM) // 21
const SECTION_HEADER_REM = 1.0625
const SECTION_HEADER_SIZE_PX = Math.round(16 * SECTION_HEADER_REM) // 17
const SECTION_HEADER_TRACKING_EM = 0.2

const KICKER_SIZE_PX = 27 /** “In Loving Memory Of” */
const PLACEHOLDER_INITIAL_PX = 70 /** Letter in empty photo circle */
const SCAN_CTA_SIZE_PX = 28 /** “Scan to visit…” */
const URL_LINE_SIZE_PX = 23 /** Short URL under QR */
const FOOTER_BRAND_SIZE_PX = 19 /** “Aeterna” */

/** Outer champagne + inner gray frame strokes (px) */
const STROKE_OUTER_CHAMPAGNE = 3.25
const STROKE_INNER_GRAY = 2.75
const STROKE_PROFILE_RING = 2
const STROKE_QR_FRAME = 2
const STROKE_DIVIDER = 1.5

async function ensureInvitationFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return
  try {
    await Promise.all([
      document.fonts.load(`600 ${NAME_SIZE_PX}px 'Playfair Display'`),
      document.fonts.load(`400 ${KICKER_SIZE_PX}px Inter`),
      document.fonts.load(`italic 300 ${DATE_QUOTE_SIZE_PX}px 'Playfair Display'`),
      document.fonts.load(`300 ${DATE_QUOTE_SIZE_PX}px Inter`),
      document.fonts.load(`400 ${SCAN_CTA_SIZE_PX}px Inter`),
      document.fonts.load(`500 ${SECTION_HEADER_SIZE_PX}px Inter`),
      document.fonts.load(`400 ${URL_LINE_SIZE_PX}px Inter`),
      document.fonts.load(`400 ${FOOTER_BRAND_SIZE_PX}px 'Playfair Display'`),
      document.fonts.load(`600 ${PLACEHOLDER_INITIAL_PX}px 'Playfair Display'`),
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
    const t = src.trim()
    /** Blob / data URLs are same-origin; `crossOrigin = "anonymous"` breaks them in Safari/Chrome when drawing to canvas. */
    if (/^https?:\/\//i.test(t)) {
      img.crossOrigin = "anonymous"
    }
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
  /** Full sentence (localized), e.g. “Please contact … for further details.” — shown above the QR block. */
  contactDetailsLine?: string | null
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
    contactDetailsLine,
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
  ctx.lineWidth = STROKE_OUTER_CHAMPAGNE
  ctx.stroke()

  const innerM = margin + 28
  roundRectPath(ctx, innerM, innerM, W - innerM * 2, H - innerM * 2, 8)
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = STROKE_INNER_GRAY
  ctx.stroke()

  const contentW = W - innerM * 2 - 64
  const centerX = W / 2
  let y = innerM + 56

  ctx.textAlign = "center"
  ctx.fillStyle = INK_MUTED
  ctx.font = `400 ${KICKER_SIZE_PX}px ${FONT_SANS}`
  ctx.fillText("In Loving Memory Of", centerX, y)
  y += 48

  ctx.fillStyle = NAME_GOLD
  ctx.font = `600 ${NAME_SIZE_PX}px ${FONT_SERIF}`
  const displayName = name.trim() || "Beloved"
  const nameLines = wrapTitle(ctx, displayName, contentW)
  const nameLineHeight = Math.round(NAME_SIZE_PX * 1.25)
  nameLines.forEach((line) => {
    ctx.fillText(line, centerX, y)
    y += nameLineHeight
  })
  y += 46

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
    ctx.font = `600 ${PLACEHOLDER_INITIAL_PX}px ${FONT_SERIF}`
    ctx.textAlign = "center"
    ctx.fillText(displayName.charAt(0).toUpperCase() || "·", photoCx, photoCy + 6)
  }
  ctx.restore()

  /** Gold ring — portrait frame */
  ctx.save()
  ctx.beginPath()
  ctx.arc(photoCx, photoCy, photoRadius, 0, Math.PI * 2)
  ctx.strokeStyle = GOLD_RING
  ctx.lineWidth = STROKE_PROFILE_RING
  ctx.stroke()
  ctx.restore()

  const birth = formatDisplayDate(birthDate)
  const death = formatDisplayDate(deathDate)
  y = photoY + photoD + 40
  ctx.textAlign = "center"
  ctx.fillStyle = INK
  ctx.font = `500 ${DATE_QUOTE_SIZE_PX + 2}px ${FONT_SANS}`
  ctx.fillText(`${birth}  —  ${death}`, centerX, y)
  y += 56

  const drawGoldDivider = (dividerY: number) => {
    ctx.beginPath()
    ctx.strokeStyle = DIVIDER_GOLD
    ctx.lineWidth = STROKE_DIVIDER
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
    y += 52
  } else {
    y += 28
  }

  if (bioRaw) {
    const sepY = y + 20
    drawGoldDivider(sepY)
    y = sepY + 64
  } else {
    y += 40
  }

  /** Extra air between hero / bio block and SERVICE section */
  y += 52

  const fontDetailLine = `300 ${DATE_QUOTE_SIZE_PX}px ${FONT_SANS}`
  const fontScanCta = `500 ${SCAN_CTA_SIZE_PX}px ${FONT_SANS}`
  const fontUrlLine = `400 ${URL_LINE_SIZE_PX}px ${FONT_SANS}`

  const contactGap = Math.round(DATE_QUOTE_SIZE_PX * 1.45)
  const contactForQr = contactDetailsLine?.trim()
  ctx.font = fontDetailLine
  const contactLinesWrapped = contactForQr ? wrapLines(ctx, contactForQr, contentW, 4) : []

  /** Footer anchored to the bottom of the page (QR + caption + URL + brand), not the vertical center. */
  const qrPad = 22
  const qrMax = Math.round(176 * 0.85)
  const qrSize = qrMax
  const qrPaddedH = qrSize + 2 * qrPad
  const innerBottom = H - innerM
  const gapAeternaBottom = 30
  const gapUrlAeterna = 42
  const gapScanUrl = 42
  const gapQrToScan = 36
  const yAeterna = innerBottom - gapAeternaBottom
  const yUrl = yAeterna - gapUrlAeterna
  const yScan = yUrl - gapScanUrl
  const qrBoxBottom = yScan - 16 - gapQrToScan
  const qrTop = qrBoxBottom - qrPaddedH
  /** Space between “Please contact…” lines and the QR card */
  const gapContactToQr = 44
  const nContact = contactLinesWrapped.length
  const lastContactCenterY = qrTop - qrPad - gapContactToQr
  const firstContactCenterY = nContact > 0 ? lastContactCenterY - (nContact - 1) * contactGap : lastContactCenterY
  /** Do not draw main text below this y (centers); keeps service block above the footer stack. */
  const mainContentBottomY =
    nContact > 0 ? firstContactCenterY - Math.round(contactGap * 0.55) - 20 : qrTop - 28
  const approxServiceBlock = 280
  if (y + approxServiceBlock > mainContentBottomY) {
    y = Math.max(innerM + 120, mainContentBottomY - approxServiceBlock)
  }

  ctx.textAlign = "center"
  ctx.save()
  ctx.fillStyle = INK
  ctx.font = `500 ${SECTION_HEADER_SIZE_PX}px ${FONT_SANS}`
  ctx.letterSpacing = `${SECTION_HEADER_TRACKING_EM}em`
  ctx.fillText("SERVICE", centerX, y)
  ctx.letterSpacing = "0"
  ctx.restore()
  y += 46
  ctx.fillStyle = INK_MUTED
  ctx.font = fontDetailLine
  ctx.fillText(`Location: ${displayLocation(location)}`, centerX, y)
  y += 42
  ctx.fillText(`Service time: ${displayService(ceremonyTime)}`, centerX, y)
  /** Space after service details — extra gap before MEMORIAL FUND when present */
  y += 58

  const fund = fundLink?.trim()
  if (fund) {
    y += 40
    ctx.save()
    ctx.fillStyle = INK
    ctx.font = `500 ${SECTION_HEADER_SIZE_PX}px ${FONT_SANS}`
    ctx.letterSpacing = `${SECTION_HEADER_TRACKING_EM}em`
    ctx.fillText("MEMORIAL FUND", centerX, y)
    ctx.letterSpacing = "0"
    ctx.restore()
    y += 42
    ctx.fillStyle = INK_MUTED
    ctx.font = fontDetailLine
    const supLines = wrapLines(ctx, fund, contentW, 4)
    for (const ln of supLines) {
      if (y > mainContentBottomY - 8) break
      ctx.fillText(ln, centerX, y)
      y += Math.round(DATE_QUOTE_SIZE_PX * 1.58)
    }
    y += 32
  }

  if (nContact > 0) {
    ctx.textAlign = "center"
    ctx.fillStyle = INK_MUTED
    ctx.font = fontDetailLine
    let lineY = firstContactCenterY
    for (const ln of contactLinesWrapped) {
      ctx.fillText(ln, centerX, lineY)
      lineY += contactGap
    }
  }

  const qrCanvas = document.createElement("canvas")
  await QRCode.toCanvas(qrCanvas, guestUrl, {
    width: qrSize,
    margin: 4,
    color: { dark: "#333333", light: "#ffffff" },
    errorCorrectionLevel: "M",
  })

  const qrX = (W - qrSize) / 2
  ctx.save()
  roundRectPath(ctx, qrX - qrPad, qrTop - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2, 12)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.strokeStyle = BORDER_INNER
  ctx.lineWidth = STROKE_QR_FRAME
  ctx.stroke()
  ctx.restore()
  ctx.drawImage(qrCanvas, qrX, qrTop)

  ctx.textAlign = "center"
  ctx.fillStyle = INK
  ctx.font = fontScanCta
  ctx.fillText("Scan to visit the memorial", centerX, yScan)

  ctx.fillStyle = INK_MUTED
  ctx.font = fontUrlLine
  const short = guestUrl.replace(/^https?:\/\//, "")
  const display = short.length > 48 ? `${short.slice(0, 46)}…` : short
  ctx.fillText(display, centerX, yUrl)

  ctx.fillStyle = "#8a857c"
  ctx.font = `400 ${FOOTER_BRAND_SIZE_PX}px ${FONT_SERIF}`
  ctx.fillText("Aeterna", centerX, yAeterna)

  return canvas
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png", 0.95)
  })
}
