import { PDFDocument } from "pdf-lib"
import {
  canvasToPngBlob,
  renderMemorialInvitationCanvas,
  type MemorialInvitationCanvasInput,
} from "@/lib/memorialInvitationCanvas"

/**
 * Same output as the create-flow “Print PDF” on {@link MemorialInvitationCard}:
 * canvas invitation (9:16) embedded as a single full-page PDF.
 */
export async function renderMemorialInvitationPdfFromCanvasInput(
  input: MemorialInvitationCanvasInput
): Promise<Blob> {
  const canvas = await renderMemorialInvitationCanvas(input)
  const pngBlob = await canvasToPngBlob(canvas)
  const bytes = new Uint8Array(await pngBlob.arrayBuffer())
  const pdfDoc = await PDFDocument.create()
  const png = await pdfDoc.embedPng(bytes)
  const page = pdfDoc.addPage([png.width, png.height])
  page.drawImage(png, { x: 0, y: 0, width: png.width, height: png.height })
  const pdfBytes = await pdfDoc.save()
  return new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
}
