const LUMA_API_KEY = process.env.LUMA_API_KEY
/** Base path must include `/dream-machine/v1` — see https://docs.lumalabs.ai/docs/video-generation */
const LUMA_API_BASE_URL =
  process.env.LUMA_API_BASE_URL || "https://api.lumalabs.ai/dream-machine/v1"

/** e.g. 720p | 1080p — set in Vercel / `.env.local` (not read from Supabase Secrets by Next.js). */
const LUMA_VIDEO_RESOLUTION = process.env.LUMA_VIDEO_RESOLUTION?.trim() || "1080p"
/** Premium tribute clips use 10s; override via env if Luma adds options. */
const LUMA_VIDEO_DURATION = process.env.LUMA_VIDEO_DURATION?.trim() || "10s"
/** Ray 2 (quality); see https://docs.lumalabs.ai/docs/video-generation */
const LUMA_VIDEO_MODEL = process.env.LUMA_VIDEO_MODEL?.trim() || "ray-2"

export type LumaVideoStatus = "queued" | "processing" | "completed" | "failed" | "unknown"

export type CreateLumaVideoJobOptions = {
  imageUrls: string[]
  prompt: string
  /**
   * Webhook URL where Luma POSTs the Generation object (see docs).
   * We append `?eventId=&slug=&slot=` because the API does not support arbitrary metadata on the request.
   */
  webhookUrl?: string
  /**
   * Aeterna events.id (Supabase)
   */
  eventId?: string
  /** Passed through for /p/[slug] identification. */
  slug?: string
  /** Which tribute clip (0–4) this generation fills — required for multi-clip Premium flow. */
  slot?: number
}

export type CreateLumaVideoJobResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string }

export type LumaVideoJobInfo =
  | { ok: true; status: LumaVideoStatus; videoUrl?: string | null }
  | { ok: false; error: string; status?: LumaVideoStatus }

async function lumaFetch(path: string, init: RequestInit): Promise<Response> {
  if (!LUMA_API_KEY) {
    throw new Error("LUMA_API_KEY is not configured.")
  }

  const url = `${LUMA_API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
  const headers: HeadersInit = {
    Authorization: `Bearer ${LUMA_API_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init.headers || {}),
  }

  return fetch(url, { ...init, headers })
}

function parseLumaErrorBody(text: string): string {
  try {
    const j = JSON.parse(text) as { detail?: string; message?: string }
    return j.detail || j.message || text
  } catch {
    return text || "Unknown error"
  }
}

/**
 * Dream Machine: image-to-video with multiple keyframes (frame0 … frameN).
 * @see https://docs.lumalabs.ai/docs/video-generation
 */
export async function createLumaVideoJob(options: CreateLumaVideoJobOptions): Promise<CreateLumaVideoJobResult> {
  const { imageUrls, prompt, webhookUrl, eventId, slug, slot } = options

  if (!process.env.LUMA_API_KEY?.trim()) {
    console.error(
      "[Luma] LUMA_API_KEY is not set — configure it in the server environment (e.g. Vercel project env). Video jobs cannot run until then.",
    )
    return { ok: false, error: "LUMA_API_KEY is not configured." }
  }

  if (!imageUrls || imageUrls.length === 0) {
    return { ok: false, error: "At least one image URL is required." }
  }

  const limitedImages = imageUrls.slice(0, 15)
  const keyframes: Record<string, { type: "image"; url: string }> = {}
  limitedImages.forEach((url, i) => {
    keyframes[`frame${i}`] = { type: "image", url }
  })

  let callbackUrl = webhookUrl
  if (webhookUrl && eventId) {
    const u = new URL(webhookUrl)
    u.searchParams.set("eventId", eventId)
    if (slug) u.searchParams.set("slug", slug)
    if (typeof slot === "number" && slot >= 0) u.searchParams.set("slot", String(slot))
    callbackUrl = u.toString()
  }

  try {
    const res = await lumaFetch("generations", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        model: LUMA_VIDEO_MODEL,
        resolution: LUMA_VIDEO_RESOLUTION,
        duration: LUMA_VIDEO_DURATION,
        aspect_ratio: "16:9",
        loop: false,
        keyframes,
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      }),
    })

    const text = await res.text().catch(() => "")

    if (!res.ok) {
      return {
        ok: false,
        error: parseLumaErrorBody(text) || `Luma API request failed with status ${res.status}`,
      }
    }

    let json: { id?: string } | null = null
    try {
      json = JSON.parse(text) as { id?: string }
    } catch {
      return { ok: false, error: "Luma API returned invalid JSON." }
    }
    const jobId = json?.id
    if (!jobId) {
      return { ok: false, error: "Luma API response missing generation id." }
    }

    return { ok: true, jobId }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to call Luma API.",
    }
  }
}

/**
 * Retries Luma calls with 5s spacing (up to 3 attempts) for reliability on rate limits / transient errors.
 */
export async function createLumaVideoJobWithRetry(
  options: CreateLumaVideoJobOptions,
  { maxAttempts = 3, delayMs = 5000 }: { maxAttempts?: number; delayMs?: number } = {}
): Promise<CreateLumaVideoJobResult> {
  let lastError = ""
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const r = await createLumaVideoJob(options)
    if (r.ok) return r
    lastError = r.error
    const likelyPermanent =
      /LUMA_API_KEY|missing|required|invalid key|401|403|400|at least one image/i.test(r.error)
    if (likelyPermanent) {
      return r
    }
    if (attempt < maxAttempts) {
      await sleep(delayMs)
    }
  }
  return { ok: false, error: lastError || "Luma request failed after retries." }
}

function mapLumaState(raw: string): LumaVideoStatus {
  const s = raw.toLowerCase()
  if (s === "queued" || s === "pending") return "queued"
  if (s === "dreaming" || s === "processing") return "processing"
  if (s === "completed" || s === "succeeded") return "completed"
  if (s === "failed" || s === "error") return "failed"
  return "unknown"
}

/**
 * GET /generations/{id}
 */
export async function getLumaVideoJob(jobId: string): Promise<LumaVideoJobInfo> {
  if (!jobId) return { ok: false, error: "Missing job id." }

  try {
    const res = await lumaFetch(`generations/${encodeURIComponent(jobId)}`, {
      method: "GET",
    })

    const text = await res.text().catch(() => "")

    if (!res.ok) {
      return {
        ok: false,
        error: parseLumaErrorBody(text) || `Luma status request failed with status ${res.status}`,
      }
    }

    type LumaGenerationJson = {
      state?: string
      status?: string
      assets?: { video?: string | null }
      video_url?: string | null
    }
    let json: LumaGenerationJson
    try {
      json = JSON.parse(text) as LumaGenerationJson
    } catch {
      return { ok: false, error: "Luma API returned invalid JSON.", status: "unknown" }
    }

    const rawState = json?.state ?? json?.status ?? ""
    const status = mapLumaState(String(rawState))

    const videoUrl = json?.assets?.video ?? json?.video_url ?? null

    return {
      ok: true,
      status,
      videoUrl,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to read Luma job status.",
      status: "unknown",
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Polling utility at 15-second intervals (for server actions/backend jobs).
 */
export async function waitForLumaVideoCompletion(
  jobId: string,
  {
    pollIntervalMs = 15_000,
    maxAttempts = 40,
  }: { pollIntervalMs?: number; maxAttempts?: number } = {}
): Promise<
  | { ok: true; status: "completed"; videoUrl: string | null }
  | { ok: false; status: LumaVideoStatus; error: string }
> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const info = await getLumaVideoJob(jobId)
    if (!info.ok) {
      return { ok: false, status: info.status ?? "unknown", error: info.error }
    }

    if (info.status === "completed") {
      return { ok: true, status: "completed", videoUrl: info.videoUrl ?? null }
    }

    if (info.status === "failed") {
      return {
        ok: false,
        status: "failed",
        error: "Luma video job failed.",
      }
    }

    await sleep(pollIntervalMs)
  }

  return {
    ok: false,
    status: "unknown",
    error: "Luma video job did not complete within the expected time window.",
  }
}
