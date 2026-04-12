"use server"

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { PDFFont } from "pdf-lib"
import QRCode from "qrcode"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type GenerateInvitePdfResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Standard PDF fonts (Helvetica, etc.) use WinAnsi — newlines, tabs, and most non‑Latin-1
 * characters cannot be encoded. Strip control chars; normalize line breaks to spaces for single-line draws.
 */
function pdfSafeSingleLine(s: string): string {
  return s
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
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

function wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  const words = pdfSafeSingleLine(text).split(/\s+/)
  if (!words[0]) return []
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

export async function generateInvitePdfAction(slug: string): Promise<GenerateInvitePdfResult> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) return { ok: false, error: "Invalid slug." }

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, location, ceremony_time, invite_pdf_url, birth_date, death_date, invitation_bio")
    .eq("slug", slugNorm)
    .maybeSingle()

  if (eventErr || !event?.id) {
    return { ok: false, error: "Event not found." }
  }

  try {
    const origin = getAppBaseUrl()

    const guestUrl = `${origin}/p/${encodeURIComponent(slugNorm)}`

    // Generate QR code PNG data URL
    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
      margin: 1,
      scale: 6,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    })

    const base64 = qrDataUrl.split(",")[1]
    const qrBytes = Buffer.from(base64, "base64")

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontBody = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBodyItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

    // Background tone
    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      color: rgb(0.012, 0.027, 0.09), // deep navy
      borderColor: rgb(0.95, 0.89, 0.75),
      borderWidth: 1.2,
    })

    const titleFontSize = 20
    const titleLine1 = "In Loving Memory of"
    const nameSafe = event.name ? pdfSafeSingleLine(String(event.name)) : ""
    let titleY = height - 130
    const w1 = fontTitle.widthOfTextAtSize(titleLine1, titleFontSize)
    page.drawText(titleLine1, {
      x: (width - w1) / 2,
      y: titleY,
      size: titleFontSize,
      font: fontTitle,
      color: rgb(0.96, 0.91, 0.8),
    })
    titleY -= 26
    if (nameSafe) {
      const w2 = fontTitle.widthOfTextAtSize(nameSafe, titleFontSize)
      page.drawText(nameSafe, {
        x: (width - w2) / 2,
        y: titleY,
        size: titleFontSize,
        font: fontTitle,
        color: rgb(0.96, 0.91, 0.8),
      })
    }

    const birth = pdfSafeSingleLine(formatDisplayDate(event.birth_date as string | null))
    const death = pdfSafeSingleLine(formatDisplayDate(event.death_date as string | null))
    const dateLine = pdfSafeSingleLine(`${birth}  —  ${death}`)
    const bodyFontSize = 11
    const marginX = 80
    const textMaxW = width - marginX * 2
    let bodyY = height - 220

    page.drawText(dateLine, {
      x: marginX,
      y: bodyY,
      size: bodyFontSize + 1,
      font: fontBody,
      color: rgb(0.88, 0.83, 0.72),
    })
    bodyY -= 22

    const bioRaw = (event.invitation_bio as string | null)?.trim()
    if (bioRaw && pdfSafeSingleLine(bioRaw)) {
      const lineY = bodyY - 6
      page.drawLine({
        start: { x: marginX, y: lineY },
        end: { x: width - marginX, y: lineY },
        thickness: 0.6,
        color: rgb(0.77, 0.63, 0.35),
        opacity: 0.45,
      })
      bodyY = lineY - 18

      const bioSize = 10.5
      const bioLines = wrapText(fontBodyItalic, pdfSafeSingleLine(bioRaw), bioSize, textMaxW)
      for (const ln of bioLines) {
        const safeLn = pdfSafeSingleLine(ln)
        if (!safeLn) continue
        page.drawText(safeLn, {
          x: marginX,
          y: bodyY,
          size: bioSize,
          font: fontBodyItalic,
          color: rgb(0.9, 0.86, 0.78),
        })
        bodyY -= 14
      }
      bodyY -= 10
    }

    const lines: string[] = []
    if (event.ceremony_time) {
      lines.push(pdfSafeSingleLine(`Ceremony: ${event.ceremony_time}`))
    }
    if (event.location) {
      lines.push(pdfSafeSingleLine(`Location: ${event.location}`))
    }
    lines.push("We warmly invite you to join us in remembering a beloved life,")
    lines.push("sharing stories, and saying goodbye with grace and tenderness.")

    if (event.ceremony_time || event.location) {
      bodyY -= 18
    }

    for (const line of lines) {
      const safe = pdfSafeSingleLine(line)
      if (!safe) {
        bodyY -= 18
        continue
      }
      page.drawText(safe, {
        x: marginX,
        y: bodyY,
        size: bodyFontSize,
        font: fontBody,
        color: rgb(0.88, 0.83, 0.72),
      })
      bodyY -= 18
    }

    // Insert QR code
    const qrImage = await pdfDoc.embedPng(qrBytes)
    const qrSize = 150
    const qrX = width - qrSize - 90
    const qrY = 130

    page.drawText(pdfSafeSingleLine("Scan to open the memorial album"), {
      x: qrX - 10,
      y: qrY + qrSize + 20,
      size: 9,
      font: fontBody,
      color: rgb(0.88, 0.83, 0.72),
    })

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    })

    const pdfBytes = await pdfDoc.save()

    const path = `invites/${event.id}/${Date.now()}_invite.pdf`
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

    await supabase
      .from("events")
      .update({ invite_pdf_url: pdfUrl })
      .eq("id", event.id)

    return { ok: true, url: pdfUrl }
  } catch (err) {
    console.error("[generateInvitePdf]", err)
    return { ok: false, error: err instanceof Error ? err.message : "Failed to generate PDF." }
  }
}
