/**
 * Client-side 10s preview video: top 5 images + "Aeterna Preview" watermark.
 * Uses canvas + MediaRecorder; returns WebM blob.
 */
const W = 1280
const H = 720
const FPS = 30
const DURATION_MS = 10_000
const SLIDE_DURATION_MS = 2_000

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  name: string | null,
  frameIndex: number
) {
  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, 0, W, H)

  const scale = Math.max(W / image.naturalWidth, H / image.naturalHeight)
  const sw = image.naturalWidth
  const sh = image.naturalHeight
  const dw = sw * scale
  const dh = sh * scale
  const dx = (W - dw) / 2
  const dy = (H - dh) / 2
  ctx.drawImage(image, 0, 0, sw, sh, dx, dy, dw, dh)

  if (name) {
    ctx.save()
    ctx.font = "32px serif"
    ctx.fillStyle = "rgba(255,255,255,0.9)"
    ctx.textAlign = "center"
    ctx.shadowColor = "rgba(0,0,0,0.8)"
    ctx.shadowBlur = 8
    ctx.fillText(name, W / 2, 72)
    ctx.restore()
  }

  ctx.save()
  ctx.font = "28px sans-serif"
  ctx.fillStyle = "rgba(255,255,255,0.35)"
  ctx.textAlign = "center"
  ctx.fillText("Aeterna Preview", W / 2, H / 2)
  ctx.restore()
}

export type GeneratePreviewOptions = {
  imageUrls: string[]
  eventName: string | null
  onProgress?: (message: string) => void
}

/**
 * Generate a 10-second WebM preview video from up to 5 images with watermark.
 * Uses at most 5 images; if fewer, repeats. Each slide ~2s.
 */
export async function generatePreviewVideo(options: GeneratePreviewOptions): Promise<Blob> {
  const { imageUrls, eventName, onProgress } = options
  const urls = imageUrls.slice(0, 5)
  if (urls.length === 0) throw new Error("At least one image is required.")

  onProgress?.("이미지를 불러오는 중...")
  const images = await Promise.all(urls.map((src) => loadImage(src)))

  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2d not available.")

  const stream = canvas.captureStream(FPS)
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : ""
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 2_500_000 } : { videoBitsPerSecond: 2_500_000 })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" })
      resolve(blob)
    }
    recorder.onerror = () => reject(new Error("Recording failed."))
    recorder.start(200)

    onProgress?.("소중한 추억들을 영상으로 엮는 중입니다...")

    const startTime = performance.now()
    let frameId: number

    const tick = () => {
      const elapsed = performance.now() - startTime
      if (elapsed >= DURATION_MS) {
        recorder.stop()
        return
      }
      const slideIndex = Math.floor(elapsed / SLIDE_DURATION_MS) % images.length
      const img = images[slideIndex]
      drawFrame(ctx, img, eventName, Math.floor((elapsed / 1000) * FPS))
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)

    setTimeout(() => {
      cancelAnimationFrame(frameId)
      if (recorder.state === "recording") recorder.stop()
    }, DURATION_MS + 500)
  })
}
