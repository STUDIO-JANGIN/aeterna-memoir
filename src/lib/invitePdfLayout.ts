import { PDFDocument, rgb } from "pdf-lib"
import type { PDFPage, PDFFont } from "pdf-lib"
import QRCode from "qrcode"
import sharp from "sharp"
import { parseCeremonyForInvitePdf, type CeremonyParts } from "@/lib/invitePdfCeremony"
import { shapeArabicLineForPdf } from "@/lib/invitePdfArabic"
import { formatInvitePdfIsoDate } from "@/lib/invitePdfFormat"
import {
  embedInvitePdfFont,
  embedInvitePdfFontBold,
  embedInvitePdfFontItalic,
  fontkit,
} from "@/lib/invitePdfFonts"
import type { LandingLocale } from "@/lib/landingTranslations"
import { formatInvitePdfContactLine, getInvitePdfStrings } from "@/lib/invitePdfTranslations"

/** A5 portrait (pt); print-friendly memorial invitation. */
const PAGE_WIDTH = 420
const PAGE_HEIGHT = 595

/** Warm cream paper (reference-style). */
const PAPER = rgb(252 / 255, 250 / 255, 245 / 255)
const INK = rgb(26 / 255, 26 / 255, 26 / 255)
const INK_MUTED = rgb(95 / 255, 90 / 255, 86 / 255)
/** Dusty rose / terracotta for the name (reference). */
const NAME_ACCENT = rgb(175 / 255, 105 / 255, 98 / 255)

const FRAME_INSET = 34
const CONTENT_PAD = 26
const MARGIN = FRAME_INSET + CONTENT_PAD

function pdfSafeLine(s: string): string {
  return s
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function prepareLineForPdf(s: string, locale: LandingLocale): string {
  const cleaned = pdfSafeLine(s)
  if (!cleaned) return ""
  if (locale === "ar") return shapeArabicLineForPdf(cleaned)
  return cleaned
}

function wrapText(
  font: PDFFont,
  text: string,
  fontSize: number,
  maxWidth: number,
  locale: LandingLocale
): string[] {
  const cleaned = prepareLineForPdf(text, locale)
  if (!cleaned) return []

  if (!/\s/.test(cleaned)) {
    const lines: string[] = []
    let chunk = ""
    for (const ch of cleaned) {
      const test = chunk + ch
      if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
        chunk = test
      } else {
        if (chunk) lines.push(chunk)
        chunk = ch
      }
    }
    if (chunk) lines.push(chunk)
    return lines
  }

  const words = cleaned.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const w of words) {
    const test = current ? `${current} ${w}` : w
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  return lines
}

type Align = "left" | "center" | "right"

function textX(align: Align, pageWidth: number, margin: number, lineWidth: number): number {
  if (align === "center") return (pageWidth - lineWidth) / 2
  if (align === "right") return pageWidth - margin - lineWidth
  return margin
}

function drawLines(
  page: PDFPage,
  font: PDFFont,
  lines: string[],
  fontSize: number,
  pageWidth: number,
  margin: number,
  yTop: number,
  color: ReturnType<typeof rgb>,
  lineGap: number,
  align: Align
): number {
  let y = yTop
  const gap = lineGap
  for (const line of lines) {
    if (!line) continue
    const w = font.widthOfTextAtSize(line, fontSize)
    page.drawText(line, {
      x: textX(align, pageWidth, margin, w),
      y,
      size: fontSize,
      font,
      color,
    })
    y -= gap
  }
  return y
}

async function toCircularProfilePng(bytes: Uint8Array, diameter: number): Promise<Uint8Array> {
  const d = Math.max(64, Math.round(diameter * 2))
  const r = d / 2
  const svgMask = Buffer.from(
    `<svg width="${d}" height="${d}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
  )
  const out = await sharp(Buffer.from(bytes))
    .resize(d, d, { fit: "cover", position: "centre" })
    .composite([{ input: svgMask, blend: "dest-in" }])
    .png()
    .toBuffer()
  return new Uint8Array(out)
}

function buildServiceLines(
  ceremonyTime: string | null | undefined,
  ceremony: CeremonyParts,
  locale: LandingLocale
): string[] {
  const raw = ceremonyTime?.trim()
  if (!raw || /^time\s*tbd$/i.test(raw)) return []
  if (raw.includes("·")) {
    return raw
      .split("·")
      .map((s) => prepareLineForPdf(s.trim(), locale))
      .filter(Boolean)
  }
  const out: string[] = []
  if (ceremony.dateLine && ceremony.dateLine !== "—") {
    out.push(prepareLineForPdf(ceremony.dateLine, locale))
  }
  if (ceremony.timeLine) {
    out.push(prepareLineForPdf(ceremony.timeLine, locale))
  }
  if (out.length === 0) {
    out.push(prepareLineForPdf(raw, locale))
  }
  return out
}

export type InvitePdfRenderInput = {
  guestUrl: string
  name: string | null
  birthDate: string | null
  deathDate: string | null
  location: string | null
  ceremonyTime: string | null
  invitationBio: string | null
  invitationContactPhone: string | null
  bankInfo: string | null
  profileImageUrl: string | null
  locale: LandingLocale
}

export async function renderInvitePdfBytes(input: InvitePdfRenderInput): Promise<Uint8Array> {
  const {
    guestUrl,
    name,
    birthDate,
    deathDate,
    location,
    ceremonyTime,
    invitationContactPhone,
    profileImageUrl,
    locale,
  } = input

  const strings = getInvitePdfStrings(locale)
  const align: Align = locale === "ar" ? "right" : "center"

  const qrDataUrl = await QRCode.toDataURL(guestUrl, {
    margin: 1,
    scale: 10,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1a1a", light: "#fcf8f5" },
  })
  const qrBase64 = qrDataUrl.split(",")[1]
  const qrBytes = Buffer.from(qrBase64, "base64")

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const font = await embedInvitePdfFont(pdfDoc, locale)
  const fontBold = await embedInvitePdfFontBold(pdfDoc, locale)
  const fontItalic = await embedInvitePdfFontItalic(pdfDoc, locale)
  const emphasis = fontBold ?? font
  const remembranceFont = fontItalic ?? font

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const width = PAGE_WIDTH
  const height = PAGE_HEIGHT
  const margin = MARGIN
  const textW = width - margin * 2

  page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER })

  const fw = width - FRAME_INSET * 2
  const fh = height - FRAME_INSET * 2
  const fx = FRAME_INSET
  const fy = FRAME_INSET
  const stroke = { thickness: 0.75 as const, color: INK }
  page.drawLine({ start: { x: fx, y: fy }, end: { x: fx + fw, y: fy }, ...stroke })
  page.drawLine({ start: { x: fx + fw, y: fy }, end: { x: fx + fw, y: fy + fh }, ...stroke })
  page.drawLine({ start: { x: fx + fw, y: fy + fh }, end: { x: fx, y: fy + fh }, ...stroke })
  page.drawLine({ start: { x: fx, y: fy + fh }, end: { x: fx, y: fy }, ...stroke })

  const jaGap = locale === "ja" ? 1.12 : 1.05
  let y = height - margin - 8

  const lead = prepareLineForPdf(strings.nameLead, locale)
  if (lead) {
    const leadSize = 9.5
    const w = font.widthOfTextAtSize(lead, leadSize)
    page.drawText(lead, {
      x: textX(align, width, margin, w),
      y,
      size: leadSize,
      font: remembranceFont,
      color: INK_MUTED,
    })
    y -= 20 * jaGap
  }

  const displayName = prepareLineForPdf(name?.trim() || strings.fallbackName, locale)
  const nameSize = locale === "ko" || locale === "ja" || locale === "zh" || locale === "zh-hk" ? 21 : 23
  const nameLines = wrapText(emphasis, displayName, nameSize, textW, locale)
  const nameGap = Math.round(nameSize * 1.12)
  y = drawLines(page, emphasis, nameLines, nameSize, width, margin, y, NAME_ACCENT, nameGap, align)
  y -= 18 * jaGap

  const photoSide = 118
  if (profileImageUrl?.startsWith("http")) {
    try {
      const res = await fetch(profileImageUrl)
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer())
        const circ = await toCircularProfilePng(buf, photoSide)
        const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8
        let img
        try {
          img = await pdfDoc.embedPng(circ)
        } catch {
          img = isJpeg ? await pdfDoc.embedJpg(buf) : await pdfDoc.embedPng(buf)
        }
        const ix = textX("center", width, margin, photoSide)
        const iy = y - photoSide - 10
        page.drawImage(img, { x: ix, y: iy, width: photoSide, height: photoSide })
        y = iy - 22 * jaGap
      }
    } catch {
      y -= 6 * jaGap
    }
  } else {
    y -= 10 * jaGap
  }

  const bStr = formatInvitePdfIsoDate(birthDate)
  const dStr = formatInvitePdfIsoDate(deathDate)
  const sep = " — "
  const dateLine = `${bStr}${sep}${dStr}`
  const dateSize = 10.5
  const dl = prepareLineForPdf(dateLine, locale)
  const dw = emphasis.widthOfTextAtSize(dl, dateSize)
  page.drawText(dl, {
    x: textX(align, width, margin, dw),
    y,
    size: dateSize,
    font: emphasis,
    color: INK,
  })
  y -= 22 * jaGap

  const ceremony = parseCeremonyForInvitePdf(ceremonyTime, locale)
  const serviceLines = buildServiceLines(ceremonyTime, ceremony, locale)
  const bodySize = 10
  for (const line of serviceLines) {
    if (!line || y < 120) break
    const wrapped = wrapText(font, line, bodySize, textW, locale)
    const gap = locale === "ja" ? 15 : 14
    y = drawLines(page, font, wrapped, bodySize, width, margin, y, INK, gap, align)
    y -= 4 * jaGap
  }

  const locRaw = location?.trim()
  if (locRaw && y > 110) {
    const locPrep = prepareLineForPdf(locRaw, locale)
    const locLines = wrapText(font, locPrep, bodySize, textW, locale)
    const gap = locale === "ja" ? 15 : 14
    y = drawLines(page, font, locLines, bodySize, width, margin, y, INK_MUTED, gap, align)
    y -= 10 * jaGap
  }

  const phoneRaw = invitationContactPhone?.trim()
  if (phoneRaw && y > 100) {
    const contactLine = formatInvitePdfContactLine(locale, phoneRaw)
    const cl = wrapText(font, prepareLineForPdf(contactLine, locale), 9.5, textW, locale)
    y = drawLines(page, font, cl, 9.5, width, margin, y, INK_MUTED, locale === "ja" ? 14 : 13, align)
    y -= 8 * jaGap
  }

  const qrSize = 100
  const qrBottom = 44
  const scanBaseline = qrBottom + qrSize + 11
  const cap = prepareLineForPdf(strings.scanQr, locale)
  const capSize = 8.5
  const capW = font.widthOfTextAtSize(cap, capSize)

  let scanY = Math.min(y - 18, scanBaseline)
  if (scanY < qrBottom + qrSize + 36) {
    scanY = qrBottom + qrSize + 36
  }

  page.drawText(cap, {
    x: textX("center", width, margin, capW),
    y: scanY,
    size: capSize,
    font,
    color: INK_MUTED,
  })

  const qrImage = await pdfDoc.embedPng(qrBytes)
  const qx = (width - qrSize) / 2
  page.drawImage(qrImage, { x: qx, y: qrBottom, width: qrSize, height: qrSize })

  return pdfDoc.save()
}
