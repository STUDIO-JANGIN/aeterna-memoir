"use server"

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import QRCode from "qrcode"
import { getAppBaseUrl } from "@/lib/appUrl"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type GenerateInvitePdfResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function generateInvitePdfAction(slug: string): Promise<GenerateInvitePdfResult> {
  const supabase = getSupabaseAdmin()
  const slugNorm = slug?.trim()
  if (!slugNorm) return { ok: false, error: "Invalid slug." }

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, location, ceremony_time, invite_pdf_url")
    .eq("slug", slugNorm)
    .maybeSingle()

  if (eventErr || !event?.id) {
    return { ok: false, error: "Event not found." }
  }

  try {
    const origin = getAppBaseUrl()

    const guestUrl = `${origin}/p/${encodeURIComponent(slugNorm)}`

    // QR 코드 PNG 데이터 URL 생성
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

    // 배경 톤
    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      color: rgb(0.012, 0.027, 0.09), // deep navy
      borderColor: rgb(0.95, 0.89, 0.75),
      borderWidth: 1.2,
    })

    const title = event.name ? `In Loving Memory of\n${event.name}` : "In Loving Memory"
    const titleFontSize = 20
    const titleWidth = fontTitle.widthOfTextAtSize(title, titleFontSize)
    const titleX = (width - titleWidth) / 2

    page.drawText(title, {
      x: titleX,
      y: height - 140,
      size: titleFontSize,
      font: fontTitle,
      color: rgb(0.96, 0.91, 0.8),
      lineHeight: 24,
    })

    const lines: string[] = []
    if (event.ceremony_time) {
      lines.push(`Ceremony: ${event.ceremony_time}`)
    }
    if (event.location) {
      lines.push(`Location: ${event.location}`)
    }
    lines.push("")
    lines.push("We warmly invite you to join us in remembering a beloved life,")
    lines.push("sharing stories, and saying goodbye with grace and tenderness.")

    const bodyFontSize = 11
    let bodyY = height - 220
    for (const line of lines) {
      page.drawText(line, {
        x: 80,
        y: bodyY,
        size: bodyFontSize,
        font: fontBody,
        color: rgb(0.88, 0.83, 0.72),
      })
      bodyY -= 18
    }

    // QR 코드 삽입
    const qrImage = await pdfDoc.embedPng(qrBytes)
    const qrSize = 150
    const qrX = width - qrSize - 90
    const qrY = 130

    page.drawText("Scan to open the memorial album", {
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

