"use server"

import { PDFDocument, rgb } from "pdf-lib"
import type { PDFPage, PDFFont } from "pdf-lib"
import QRCode from "qrcode"
import { getAppBaseUrl } from "@/lib/appUrl"
import { formatLongDate } from "@/lib/formatDate"
import { parseCeremonyForInvitePdf } from "@/lib/invitePdfCeremony"
import { embedInvitePdfFont, fontkit } from "@/lib/invitePdfFonts"
import { bcp47ForLandingLocale } from "@/lib/invitePdfLocale"
import { getInvitePdfStrings } from "@/lib/invitePdfTranslations"
import type { InvitePdfUrlsMap } from "@/lib/resolveInvitePdfUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { type LandingLocale, LANDING_LOCALES } from "@/lib/landingTranslations"

export type GenerateInvitePdfOptions = {
  /** When set and `allLocales` is false, only this locale is generated. */
  locale?: LandingLocale
  /** When true (default), generates one PDF per UI language and stores URLs in `invite_pdf_urls`. */
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

/** Draw centered text line; returns next y below this block. */
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

function drawBotanicalCorners(page: PDFPage, width: number, height: number, stroke: ReturnType<typeof rgb>) {
  const s =
    "M 0 0 C 18 -14 40 -22 52 -46 C 62 -64 48 -78 34 -88 M 52 -46 C 70 -38 88 -50 98 -68"
  page.drawSvgPath(s, {
    x: 50,
    y: height - 44,
    scale: 0.5,
    borderColor: stroke,
    borderWidth: 0.5,
  })
  page.drawSvgPath(s, {
    x: width - 50,
    y: height - 44,
    scale: -0.5,
    borderColor: stroke,
    borderWidth: 0.5,
  })
}

async function buildInvitePdfBytes(params: {
  guestUrl: string
  name: string | null
  birthDate: string | null
  deathDate: string | null
  location: string | null
  ceremonyTime: string | null
  invitationBio: string | null
  profileImageUrl: string | null
  locale: LandingLocale
}): Promise<Uint8Array> {
  const { guestUrl, name, birthDate, deathDate, location, ceremonyTime, invitationBio, profileImageUrl, locale } =
    params
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

  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  const paper = rgb(0.992, 0.988, 0.978)
  const ink = rgb(0.2, 0.185, 0.17)
  const inkMuted = rgb(0.46, 0.42, 0.38)
  const nameColor = rgb(0.38, 0.24, 0.18)
  const goldLine = rgb(0.72, 0.6, 0.42)
  const deco = rgb(0.82, 0.78, 0.72)

  page.drawRectangle({ x: 0, y: 0, width, height, color: paper })

  strokeRect(page, 36, 36, width - 72, height - 72, goldLine, 1.1)
  strokeRect(page, 48, 48, width - 88, height - 88, rgb(0.88, 0.84, 0.78), 0.75)

  drawBotanicalCorners(page, width, height, deco)

  const margin = 72
  const textW = width - margin * 2
  let y = height - 88

  const leadSize = 10
  const lead = pdfSafeLine(strings.nameLead)
  if (lead) {
    const w = font.widthOfTextAtSize(lead, leadSize)
    page.drawText(lead, {
      x: (width - w) / 2,
      y,
      size: leadSize,
      font,
      color: inkMuted,
    })
    y -= 22
  }

  const displayName = pdfSafeLine(name?.trim() || strings.fallbackName)
  const nameSize = 26
  const nameLines = wrapText(font, displayName, nameSize, textW)
  y = drawCenteredBlock(page, font, nameLines, nameSize, width, y, nameColor, Math.round(nameSize * 1.15))

  y -= 14
  const inviteLines = wrapText(font, strings.inviteLine, 11, textW)
  y = drawCenteredBlock(page, font, inviteLines, 11, width, y, ink, 15)

  if (profileImageUrl?.startsWith("http")) {
    try {
      const res = await fetch(profileImageUrl)
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer())
        const isJpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8
        let img
        if (isJpeg) {
          img = await pdfDoc.embedJpg(buf)
        } else {
          try {
            img = await pdfDoc.embedPng(buf)
          } catch {
            img = await pdfDoc.embedJpg(buf)
          }
        }
        const side = 108
        const ix = (width - side) / 2
        const iy = y - side - 12
        page.drawImage(img, { x: ix, y: iy, width: side, height: side })
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
  const lifeLine = pdfSafeLine(`${birth}  ·  ${death}`)
  const lw = font.widthOfTextAtSize(lifeLine, 10)
  page.drawText(lifeLine, {
    x: (width - lw) / 2,
    y,
    size: 10,
    font,
    color: inkMuted,
  })
  y -= 28

  page.drawLine({
    start: { x: margin, y: y + 8 },
    end: { x: width - margin, y: y + 8 },
    thickness: 0.45,
    color: goldLine,
    opacity: 0.65,
  })
  y -= 8

  const ceremony = parseCeremonyForInvitePdf(ceremonyTime, locale)
  const bodySize = 11

  const dateStr = `${strings.dateLabel}: ${ceremony.dateLine}`
  page.drawText(pdfSafeLine(dateStr), { x: margin, y, size: bodySize, font, color: ink })
  y -= 18

  if (ceremony.timeLine) {
    const timeStr = `${strings.timeLabel}: ${ceremony.timeLine}`
    page.drawText(pdfSafeLine(timeStr), { x: margin, y, size: bodySize, font, color: ink })
    y -= 18
  }

  if (location?.trim()) {
    const locStr = `${strings.locationLabel}: ${pdfSafeLine(location)}`
    const locLines = wrapText(font, locStr, bodySize, textW)
    for (const ln of locLines) {
      page.drawText(ln, { x: margin, y, size: bodySize, font, color: ink })
      y -= 16
    }
  }

  y -= 10
  const bioRaw = invitationBio?.trim()
  if (bioRaw) {
    page.drawLine({
      start: { x: margin, y: y + 6 },
      end: { x: width - margin, y: y + 6 },
      thickness: 0.35,
      color: goldLine,
      opacity: 0.45,
    })
    y -= 14
    const bioLines = wrapText(font, bioRaw, 10, textW)
    for (const ln of bioLines) {
      page.drawText(pdfSafeLine(ln), { x: margin, y, size: 10, font, color: inkMuted })
      y -= 13
    }
    y -= 8
  }

  const c1 = wrapText(font, strings.closing1, 10.5, textW)
  for (const ln of c1) {
    const w = font.widthOfTextAtSize(pdfSafeLine(ln), 10.5)
    page.drawText(pdfSafeLine(ln), { x: (width - w) / 2, y, size: 10.5, font, color: inkMuted })
    y -= 14
  }
  const c2 = wrapText(font, strings.closing2, 10.5, textW)
  for (const ln of c2) {
    const w = font.widthOfTextAtSize(pdfSafeLine(ln), 10.5)
    page.drawText(pdfSafeLine(ln), { x: (width - w) / 2, y, size: 10.5, font, color: inkMuted })
    y -= 14
  }

  const qrImage = await pdfDoc.embedPng(qrBytes)
  const qrSize = 118
  const qrX = (width - qrSize) / 2
  const qrY = 72
  const cap = pdfSafeLine(strings.scanQr)
  const capSize = 9
  const capW = font.widthOfTextAtSize(cap, capSize)
  page.drawText(cap, {
    x: (width - capW) / 2,
    y: qrY + qrSize + 14,
    size: capSize,
    font,
    color: inkMuted,
  })
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })

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

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select(
      "id, name, location, ceremony_time, invite_pdf_url, invite_pdf_urls, birth_date, death_date, invitation_bio, profile_image"
    )
    .eq("slug", slugNorm)
    .maybeSingle()

  if (eventErr || !event?.id) {
    return { ok: false, error: "Event not found." }
  }

  const origin = getAppBaseUrl()
  const guestUrl = `${origin}/p/${encodeURIComponent(slugNorm)}`

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
