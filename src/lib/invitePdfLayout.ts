import { PDFDocument, rgb } from "pdf-lib"
import type { PDFPage, PDFFont } from "pdf-lib"
import QRCode from "qrcode"
import sharp from "sharp"
import { parseCeremonyForInvitePdf } from "@/lib/invitePdfCeremony"
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

/** A5 portrait (pt); print-friendly memorial card. */
const PAGE_WIDTH = 420
const PAGE_HEIGHT = 595

const PAPER = rgb(249 / 255, 249 / 255, 247 / 255)
const INK = rgb(26 / 255, 26 / 255, 26 / 255)
const INK_MUTED = rgb(110 / 255, 108 / 255, 104 / 255)
const GOLD = rgb(197 / 255, 160 / 255, 89 / 255)

const MARGIN = 48
const FOOTER_RESERVE = 168
const BODY_FLOOR = FOOTER_RESERVE + 24

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

function drawHairline(
  page: PDFPage,
  x1: number,
  y: number,
  x2: number,
  color: ReturnType<typeof rgb> = GOLD
) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 0.35,
    color,
    opacity: 0.95,
  })
}

type Align = "left" | "center" | "right"

function textX(
  align: Align,
  pageWidth: number,
  margin: number,
  lineWidth: number
): number {
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
    invitationBio,
    invitationContactPhone,
    bankInfo,
    profileImageUrl,
    locale,
  } = input

  const strings = getInvitePdfStrings(locale)
  const align: Align = locale === "ar" ? "right" : "center"
  const rowAlign: Align = locale === "ar" ? "right" : "left"

  const qrDataUrl = await QRCode.toDataURL(guestUrl, {
    margin: 2,
    scale: 11,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1a1a", light: "#f9f9f7" },
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

  page.drawRectangle({ x: 0, y: 0, width, height, color: PAPER })

  const margin = MARGIN
  const textW = width - margin * 2
  const bodySize = 10
  const jaGap = locale === "ja" ? 1.12 : 1.05

  let y = height - 56

  const lead = prepareLineForPdf(strings.nameLead, locale)
  if (lead) {
    const leadSize = 9.5
    const w = font.widthOfTextAtSize(lead, leadSize)
    page.drawText(lead, {
      x: textX(align, width, margin, w),
      y,
      size: leadSize,
      font,
      color: INK_MUTED,
    })
    y -= 18 * jaGap
  }

  const photoSide = 128
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
        const iy = y - photoSide - 16
        page.drawImage(img, { x: ix, y: iy, width: photoSide, height: photoSide })
        y = iy - 22 * jaGap
      }
    } catch {
      y -= 6
    }
  } else {
    y -= 8
  }

  const displayName = prepareLineForPdf(name?.trim() || strings.fallbackName, locale)
  const nameSize =
    locale === "ko" || locale === "ja" || locale === "zh" || locale === "zh-hk" ? 22 : 24
  const nameLines = wrapText(emphasis, displayName, nameSize, textW, locale)
  const nameGap = Math.round(nameSize * 1.08)
  y = drawLines(page, emphasis, nameLines, nameSize, width, margin, y, INK, nameGap, align)

  y -= 14 * jaGap
  const bStr = formatInvitePdfIsoDate(birthDate)
  const dStr = formatInvitePdfIsoDate(deathDate)
  const sep = " — "
  const dateLine = `${bStr}${sep}${dStr}`
  const dateSize = 10
  const dl = prepareLineForPdf(dateLine, locale)
  const dw = font.widthOfTextAtSize(dl, dateSize)
  page.drawText(dl, {
    x: textX(align, width, margin, dw),
    y,
    size: dateSize,
    font,
    color: INK_MUTED,
  })
  y -= 22 * jaGap

  drawHairline(page, margin + 32, y + 10, width - margin - 32)
  y -= 6

  const inviteLines = wrapText(font, strings.inviteLine, bodySize, textW, locale)
  const inviteGap = locale === "ja" ? 15 : 14
  y = drawLines(page, font, inviteLines, bodySize, width, margin, y, INK_MUTED, inviteGap, align)

  y -= 12 * jaGap

  const bioRaw = invitationBio?.trim()
  if (bioRaw && y > BODY_FLOOR + 48) {
    const bioPrep = prepareLineForPdf(bioRaw, locale)
    const bioLines = wrapText(remembranceFont, bioPrep, 10.5, textW, locale).slice(0, 3)
    const bioGap = locale === "ja" ? 15 : 14
    y = drawLines(
      page,
      remembranceFont,
      bioLines,
      10.5,
      width,
      margin,
      y,
      INK_MUTED,
      bioGap,
      align
    )
    y -= 8 * jaGap
  }

  const ceremony = parseCeremonyForInvitePdf(ceremonyTime, locale)

  /** Thin marker + label + value; LTR uses left margin, RTL right-aligns each line. */
  const drawCeremonyRow = (label: string, value: string) => {
    const lab = prepareLineForPdf(label, locale)
    const val = prepareLineForPdf(value, locale)
    if (!val || y < BODY_FLOOR + 24) return

    if (rowAlign === "left") {
      page.drawText("·", { x: margin, y, size: bodySize, font, color: GOLD, opacity: 0.85 })
      const labW = emphasis.widthOfTextAtSize(lab, bodySize)
      page.drawText(lab, { x: margin + 12, y, size: bodySize, font: emphasis, color: INK })
      const mid = "  "
      const midW = font.widthOfTextAtSize(mid, bodySize)
      const restW = textW - 12 - labW - midW - 4
      const vl = wrapText(font, val, bodySize, restW, locale)
      let vy = y
      if (vl[0]) {
        page.drawText(vl[0], {
          x: margin + 12 + labW + midW,
          y: vy,
          size: bodySize,
          font,
          color: INK_MUTED,
        })
      }
      for (let i = 1; i < vl.length; i++) {
        vy -= 14
        page.drawText(vl[i], { x: margin + 12, y: vy, size: bodySize, font, color: INK_MUTED })
      }
      y = vy - 16 * jaGap
    } else {
      const labLine = prepareLineForPdf(`·  ${lab}`, locale)
      const lw = emphasis.widthOfTextAtSize(labLine, bodySize)
      page.drawText(labLine, {
        x: width - margin - lw,
        y,
        size: bodySize,
        font: emphasis,
        color: INK,
      })
      let vy = y - 16 * jaGap
      const vl = wrapText(font, val, bodySize, textW - 8, locale)
      for (const line of vl) {
        const w = font.widthOfTextAtSize(line, bodySize)
        page.drawText(line, {
          x: width - margin - w,
          y: vy,
          size: bodySize,
          font,
          color: INK_MUTED,
        })
        vy -= 14
      }
      y = vy - 10 * jaGap
    }
  }

  if (ceremony.dateLine && ceremony.dateLine !== "—") {
    drawCeremonyRow(strings.dateLabel, ceremony.dateLine)
  }
  if (ceremony.timeLine) {
    drawCeremonyRow(strings.timeLabel, ceremony.timeLine)
  }
  if (location?.trim()) {
    drawCeremonyRow(strings.locationLabel, pdfSafeLine(location))
  }

  const phoneRaw = invitationContactPhone?.trim()
  if (phoneRaw && y > BODY_FLOOR + 28) {
    drawCeremonyRow(strings.contactLabel, phoneRaw)
  }

  const bankRaw = bankInfo?.trim()
  if (bankRaw && y > BODY_FLOOR + 28) {
    drawCeremonyRow(strings.bankLabel, bankRaw)
  }

  const qrBottom = 42
  const qrSize = 118
  const scanBaseline = qrBottom + qrSize + 12
  const footerMinTop = scanBaseline + 56

  let fy = Math.min(y - 20, height - margin - 24)
  if (fy < footerMinTop) {
    fy = footerMinTop
  }

  const c1 = wrapText(font, strings.closing1, 10, textW, locale)
  fy = drawLines(page, font, c1, 10, width, margin, fy, INK_MUTED, locale === "ja" ? 15 : 14, align)
  fy -= 4
  const c2 = wrapText(font, strings.closing2, 10, textW, locale)
  fy = drawLines(page, font, c2, 10, width, margin, fy, INK_MUTED, locale === "ja" ? 15 : 14, align)

  const contactLine = phoneRaw ? formatInvitePdfContactLine(locale, phoneRaw) : ""
  if (contactLine) {
    fy -= 6
    const cl = wrapText(font, prepareLineForPdf(contactLine, locale), 9, textW, locale)
    fy = drawLines(page, font, cl, 9, width, margin, fy, INK_MUTED, 13, align)
  }

  const cap = prepareLineForPdf(strings.scanQr, locale)
  const capSize = 8.5
  const capW = font.widthOfTextAtSize(cap, capSize)
  page.drawText(cap, {
    x: textX("center", width, margin, capW),
    y: scanBaseline,
    size: capSize,
    font,
    color: INK_MUTED,
  })

  const qrImage = await pdfDoc.embedPng(qrBytes)
  const qx = (width - qrSize) / 2
  page.drawImage(qrImage, { x: qx, y: qrBottom, width: qrSize, height: qrSize })

  const pad = 6
  page.drawLine({
    start: { x: qx - pad, y: qrBottom - pad },
    end: { x: qx + qrSize + pad, y: qrBottom - pad },
    thickness: 0.35,
    color: GOLD,
    opacity: 0.9,
  })
  page.drawLine({
    start: { x: qx + qrSize + pad, y: qrBottom - pad },
    end: { x: qx + qrSize + pad, y: qrBottom + qrSize + pad },
    thickness: 0.35,
    color: GOLD,
    opacity: 0.9,
  })
  page.drawLine({
    start: { x: qx + qrSize + pad, y: qrBottom + qrSize + pad },
    end: { x: qx - pad, y: qrBottom + qrSize + pad },
    thickness: 0.35,
    color: GOLD,
    opacity: 0.9,
  })
  page.drawLine({
    start: { x: qx - pad, y: qrBottom + qrSize + pad },
    end: { x: qx - pad, y: qrBottom - pad },
    thickness: 0.35,
    color: GOLD,
    opacity: 0.9,
  })

  return pdfDoc.save()
}
