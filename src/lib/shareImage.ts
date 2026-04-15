/**
 * Prefer the system share sheet so mobile users can "Save Image" to Photos.
 * Falls back to a download when file sharing is unavailable or share() fails
 * (common on desktop Chromium when canShare(files) is true but sharing files still errors).
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
      /* Fall through — share with files often rejects on desktop; download instead. */
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener"
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    /* Revoking immediately can cancel the download in Safari and some Chromium builds. */
    setTimeout(() => URL.revokeObjectURL(url), 2500)
  }
}
