/**
 * Prefer the system share sheet so mobile users can "Save Image" to Photos.
 * Falls back to a download when file sharing is unavailable (e.g. most desktop browsers).
 */
export async function shareOrDownloadPng(blob: Blob, filename: string, shareTitle?: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" })
  const nav = typeof navigator !== "undefined" ? navigator : undefined

  let canShareFiles = false
  if (nav?.canShare) {
    try {
      canShareFiles = nav.canShare({ files: [file] })
    } catch {
      canShareFiles = false
    }
  }

  if (canShareFiles && nav?.share) {
    try {
      await nav.share({
        files: [file],
        title: shareTitle ?? "Memorial invitation",
      })
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}
