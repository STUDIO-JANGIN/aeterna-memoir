"use server"

import { PDFDocument, rgb } from "pdf-lib"
import type { PDFPage, PDFFont } from "pdf-lib"
import QRCode from "qrcode"
import sharp from "sharp"
import { getAppBaseUrl } from "@/lib/appUrl"
import { formatLongDate } from "@/lib/formatDate"
import { parseCeremonyForInvitePdf } from "@/lib/invitePdfCeremony"
import { embedInvitePdfFont, embedInvitePdfFontBold, fontkit } from "@/lib/invitePdfFonts"
import { bcp47ForLandingLocale } from "@/lib/invitePdfLocale"
import { formatInvitePdfContactLine, getInvitePdfStrings } from "@/lib/invitePdfTranslations"
import type { InvitePdfUrlsMap } from "@/lib/resolveInvitePdfUrl"
import { getEventBySlug } from "@/app/actions/setStorySelected"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { type LandingLocale, LANDING_LOCALES } from "@/lib/landingTranslations"

export type GenerateInvitePdfOptions = {
  locale?: LandingLocale
  allLocales?: boolean
}

export type GenerateInvitePdfResult =
  | { ok: true; url: string; urls?: InvitePdfUrlsMap }
  | { ok: false; error: string }

function pdfSafeLine(s: string): string {
  return s
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  const cleaned = pdfSafeLine(text)
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

function drawCenteredBlock(
  page: PDFPage,
  font: PDFFont,
  lines: string[],
  fontSize: number,
  width: number,
  yTop: number,
  color: ReturnType<typeof rgb>,
  lineGap: number
): number {
  let y = yTop
  for (const line of lines) {
    const safe = pdfSafeLine(line)
    if (!safe) continue
    const w = font.widthOfTextAtSize(safe, fontSize)
    page.drawText(safe, {
      x: (width - w) / 2,
      y,
      size: fontSize,
      font,
      color,
    })
    y -= lineGap
  }
  return y
}

function strokeRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
  thickness: number
) {
  page.drawLine({ start: { x, y }, end: { x: x + w, y }, thickness, color })
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness, color })
  page.drawLine({ start: { x: x + w, y: y + h }, end: { x, y: y + h }, thickness, color })
  page.drawLine({ start: { x, y: y + h }, end: { x, y }, thickness, color })
}

async function toCircularProfilePng(bytes: Uint8Array, diameter: number): Promise<Uint8Array> {
  const d = Math.max(32, Math.round(diameter * 2))
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

/** Footer top → bottom: closing1, closing2, contact, scan caption, QR. */
function drawFooterBlockSync(params: {
  page: PDFPage
  width: number
  font: PDFFont
  inkMuted: ReturnType<typeof rgb>
  strings: ReturnType<typeof getInvitePdfStrings>
  contactLine: string
  qrImage: Awaited<ReturnType<PDFDocument["embedPng"]>>
}): void {
  const { page, width, font, inkMuted, strings, contactLine, qrImage } = params
  const qrBottom = 48
  const qrSize = 108
  const scanBaseline = qrBottom + qrSize + 12

  let fy = 252
  const c1 = wrapText(font, strings.closing1, 10.5, width - 72)
  for (const ln of c1) {
    const w = font.widthOfTextAtSize(pdfSafeLine(ln), 10.5)
    page.drawText(pdfSafeLine(ln), { x: (width - w) / 2, y: fy, size: 10.5, font, color: inkMuted })
    fy -= 14
  }
  fy -= 4
  const c2 = wrapText(font, strings.closing2, 10.5, width - 72)
  for (const ln of c2) {
    const w = font.widthOfTextAtSize(pdfSafeLine(ln), 10.5)
    page.drawText(pdfSafeLine(ln), { x: (width - w) / 2, y: fy, size: 10.5, font, color: inkMuted })
    fy -= 14
  }
  fy -= 4
  if (contactLine) {
    const lines = wrapText(font, contactLine, 9, width - 72)
    for (const ln of lines) {
      const w = font.widthOfTextAtSize(ln, 9)
      page.drawText(ln, { x: (width - w) / 2, y: fy, size: 9, font, color: inkMuted })
      fy -= 12
    }
    fy -= 4
  }

  const cap = pdfSafeLine(strings.scanQr)
  const capSize = 9
  const capW = font.widthOfTextAtSize(cap, capSize)
  page.drawText(cap, {
    x: (width - capW) / 2,
    y: scanBaseline,
    size: capSize,
    font,
    color: inkMuted,
  })

  page.drawImage(qrImage, { x: (width - qrSize) / 2, y: qrBottom, width: qrSize, height: qrSize })
}

async function buildInvitePdfBytes(params: {
  guestUrl: string
  name: string | null
  birthDate: string | null
  deathDate: string | null
  location: string | null
  ceremonyTime: string | null
  invitationBio: string | null
  invitationContactPhone: string | null
  profileImageUrl: string | null
  locale: LandingLocale
}): Promise<Uint8Array> {
  const {
    guestUrl,
    name,
    birthDate,
    deathDate,
    location,
    ceremonyTime,
    invitationBio,
    invitationContactPhone,
    profileImageUrl,
    locale,
  } = params
  const strings = getInvitePdfStrings(locale)
  const tag = bcp47ForLandingLocale(locale)

  const qrDataUrl = await QRCode.toDataURL(guestUrl, {
    margin: 1,
    scale: 5,
    color: { dark: "#1c1917", light: "#ffffff" },
  })
  const qrBase64 = qrDataUrl.split(",")[1]
  const qrBytes = Buffer.from(qrBase64, "base64")

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const font = await embedInvitePdfFont(pdfDoc, locale)
  const fontBold = await embedInvitePdfFontBold(pdfDoc, locale)
  const emphasis = fontBold ?? font

  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  const paper = rgb(0.992, 0.988, 0.978)
  const ink = rgb(0.2, 0.185, 0.17)
  const inkMuted = rgb(0.46, 0.42, 0.38)
  const nameColor = rgb(0.38, 0.24, 0.18)
  const goldLine = rgb(0.72, 0.6, 0.42)

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper })
  strokeRect(page, 40, 40, width - 80, height - 80, goldLine, 1)

  const margin = 72
  const textW = width - margin * 2
  const bodySize = 10
  let y = height - 78

  const lead = pdfSafeLine(strings.nameLead)
  if (lead) {
    const w = font.widthOfTextAtSize(lead, bodySize)
    page.drawText(lead, {
      x: (width - w) / 2,
      y,
      size: bodySize,
      font,
      color: inkMuted,
    })
    y -= 22
  }

  const displayName = pdfSafeLine(name?.trim() || strings.fallbackName)
  const nameSize = 26
  const nameLines = wrapText(font, displayName, nameSize, textW)
  y = drawCenteredBlock(page, font, nameLines, nameSize, width, y, nameColor, Math.round(nameSize * 1.12))

  y -= 12
  const inviteLines = wrapText(font, strings.inviteLine, bodySize, textW)
  y = drawCenteredBlock(page, font, inviteLines, bodySize, width, y, inkMuted, 14)

  const photoSide = 112
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
        const ix = (width - photoSide) / 2
        const iy = y - photoSide - 14
        page.drawImage(img, { x: ix, y: iy, width: photoSide, height: photoSide })
        y = iy - 18
      } else {
        y -= 8
      }
    } catch {
      y -= 8
    }
  } else {
    y -= 10
  }

  const birth = formatLongDate(birthDate, tag)
  const death = formatLongDate(deathDate, tag)
  const sep = "  ·  "
  const bStr = pdfSafeLine(birth)
  const dStr = pdfSafeLine(death)
  const bw = emphasis.widthOfTextAtSize(bStr, bodySize)
  const sw = font.widthOfTextAtSize(sep, bodySize)
  const dw = emphasis.widthOfTextAtSize(dStr, bodySize)
  const totalW = bw + sw + dw
  let lx = (width - totalW) / 2
  page.drawText(bStr, { x: lx, y, size: bodySize, font: emphasis, color: ink })
  lx += bw
  page.drawText(sep, { x: lx, y, size: bodySize, font, color: inkMuted })
  lx += sw
  page.drawText(dStr, { x: lx, y, size: bodySize, font: emphasis, color: ink })
  y -= 26

  page.drawLine({
    start: { x: margin, y: y + 8 },
    end: { x: width - margin, y: y + 8 },
    thickness: 0.45,
    color: goldLine,
    opacity: 0.65,
  })
  y -= 10

  const MAIN_FLOOR = 258
  const ceremony = parseCeremonyForInvitePdf(ceremonyTime, locale)

  const bioRaw = invitationBio?.trim()
  if (bioRaw && y > MAIN_FLOOR + 40) {
    const bioLines = wrapText(font, bioRaw, bodySize, textW)
    for (const ln of bioLines) {
      if (y < MAIN_FLOOR + 24) break
      page.drawText(pdfSafeLine(ln), { x: margin, y, size: bodySize, font, color: inkMuted })
      y -= 13
    }
    y -= 8
  }

  if (y > MAIN_FLOOR + 36) {
    const labW = emphasis.widthOfTextAtSize(strings.dateLabel, bodySize)
    page.drawText(strings.dateLabel, { x: margin, y, size: bodySize, font: emphasis, color: ink })
    page.drawText(": ", {
      x: margin + labW,
      y,
      size: bodySize,
      font,
      color: ink,
    })
    const colonW = font.widthOfTextAtSize(": ", bodySize)
    const rest = ceremony.dateLine
    const dl = wrapText(font, rest, bodySize, textW - labW - colonW)
    let dy = y
    if (dl[0]) {
      page.drawText(dl[0], {
        x: margin + labW + colonW,
        y: dy,
        size: bodySize,
        font,
        color: inkMuted,
      })
    }
    for (let i = 1; i < dl.length; i++) {
      dy -= 14
      page.drawText(dl[i], { x: margin, y: dy, size: bodySize, font, color: inkMuted })
    }
    y = dy - 16
  }

  if (ceremony.timeLine && y > MAIN_FLOOR + 30) {
    const lab = strings.timeLabel
    const labW = emphasis.widthOfTextAtSize(lab, bodySize)
    page.drawText(lab, { x: margin, y, size: bodySize, font: emphasis, color: ink })
    page.drawText(": ", { x: margin + labW, y, size: bodySize, font, color: ink })
    const cw = font.widthOfTextAtSize(": ", bodySize)
    page.drawText(pdfSafeLine(ceremony.timeLine), {
      x: margin + labW + cw,
      y,
      size: bodySize,
      font,
      color: inkMuted,
    })
    y -= 18
  }

  if (location?.trim() && y > MAIN_FLOOR + 30) {
    const lab = strings.locationLabel
    const labW = emphasis.widthOfTextAtSize(lab, bodySize)
    page.drawText(lab, { x: margin, y, size: bodySize, font: emphasis, color: ink })
    page.drawText(": ", { x: margin + labW, y, size: bodySize, font, color: ink })
    const cw = font.widthOfTextAtSize(": ", bodySize)
    const locRest = pdfSafeLine(location)
    const locLines = wrapText(font, locRest, bodySize, textW - labW - cw)
    let ly = y
    if (locLines[0]) {
      page.drawText(locLines[0], {
        x: margin + labW + cw,
        y: ly,
        size: bodySize,
        font,
        color: inkMuted,
      })
    }
    for (let i = 1; i < locLines.length; i++) {
      ly -= 14
      page.drawText(locLines[i], { x: margin, y: ly, size: bodySize, font, color: inkMuted })
    }
    y = ly - 16
  }

  const contactLine = invitationContactPhone?.trim()
    ? formatInvitePdfContactLine(locale, invitationContactPhone.trim())
    : ""

  const qrImage = await pdfDoc.embedPng(qrBytes)
  drawFooterBlockSync({
    page,
    width,
    font,
    inkMuted,
    strings,
    contactLine,
    qrImage,
  })

  return pdfDoc.save()
}

export async function generateInvitePdfAction(
  slug: string,
  options?: GenerateInvitePdfOptions
): Promise<GenerateInvitePdfResult> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) return { ok: false, error: "Invalid slug." }

  const allLocales = options?.allLocales !== false
  const locales: LandingLocale[] = allLocales
    ? LANDING_LOCALES.map((l) => l.code)
    : [options?.locale ?? "en"]

  const event = await getEventBySlug(slugNorm)
  if (!event?.id) {
    return { ok: false, error: "Event not found." }
  }

  const origin = getAppBaseUrl()
  const slugForGuestUrl = (event.slug ?? slugNorm).trim()
  const guestUrl = `${origin}/p/${encodeURIComponent(slugForGuestUrl)}`

  const existingUrls =
    (event.invite_pdf_urls as InvitePdfUrlsMap | null | undefined) ?? {}

  const newUrls: InvitePdfUrlsMap = { ...existingUrls }

  try {
    for (const locale of locales) {
      const pdfBytes = await buildInvitePdfBytes({
        guestUrl,
        name: (event.name as string | null) ?? null,
        birthDate: (event.birth_date as string | null) ?? null,
        deathDate: (event.death_date as string | null) ?? null,
        location: (event.location as string | null) ?? null,
        ceremonyTime: (event.ceremony_time as string | null) ?? null,
        invitationBio: (event.invitation_bio as string | null) ?? null,
        invitationContactPhone: event.invitation_contact_phone ?? null,
        profileImageUrl: (event.profile_image as string | null) ?? null,
        locale,
      })

      const path = `invites/${event.id}/invite_${locale}.pdf`
      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(path, Buffer.from(pdfBytes), {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadErr) {
        console.error("[generateInvitePdf] upload error", uploadErr)
        return { ok: false, error: "Failed to upload PDF." }
      }

      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path)
      const pdfUrl = urlData?.publicUrl
      if (!pdfUrl) {
        return { ok: false, error: "Failed to get public URL for PDF." }
      }
      newUrls[locale] = pdfUrl
    }

    const primaryUrl = newUrls.en ?? newUrls[locales[0]] ?? Object.values(newUrls)[0] ?? ""

    await supabase
      .from("events")
      .update({
        invite_pdf_urls: newUrls as Record<string, string>,
        invite_pdf_url: primaryUrl,
      })
      .eq("id", event.id)

    return { ok: true, url: primaryUrl, urls: newUrls }
  } catch (err) {
    console.error("[generateInvitePdf]", err)
    return { ok: false, error: err instanceof Error ? err.message : "Failed to generate PDF." }
  }
}
