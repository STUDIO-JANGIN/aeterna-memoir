const LUMA_API_KEY = process.env.LUMA_API_KEY
const LUMA_API_BASE_URL = process.env.LUMA_API_BASE_URL || "https://api.lumalabs.ai"

export type LumaVideoStatus = "queued" | "processing" | "completed" | "failed" | "unknown"

export type CreateLumaVideoJobOptions = {
  imageUrls: string[]
  prompt: string
  /**
   * Webhook URL where Luma sends callbacks.
   * Example: `${APP_URL}/api/ai/luma-webhook`
   */
  webhookUrl?: string
  /**
   * Aeterna events.id (Supabase)
   */
  eventId?: string
  /** Passed through for /p/[slug] identification. */
  slug?: string
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
    "Content-Type": "application/json",
    ...(init.headers || {}),
  }

  return fetch(url, { ...init, headers })
}

/**
 * Request a Luma AI video generation job from selected image URLs.
 * Adjust request body as needed for the current Luma API spec.
 */
export async function createLumaVideoJob(options: CreateLumaVideoJobOptions): Promise<CreateLumaVideoJobResult> {
  const { imageUrls, prompt, webhookUrl, eventId, slug } = options

  if (!imageUrls || imageUrls.length === 0) {
    return { ok: false, error: "At least one image URL is required." }
  }

  // Use up to 15 images to balance cost and quality.
  const limitedImages = imageUrls.slice(0, 15)

  try {
    // NOTE: Update body shape based on the current Luma API docs.
    const res = await lumaFetch("/v1/videos", {
      method: "POST",
      body: JSON.stringify({
        images: limitedImages,
        prompt,
        // Fixed model/resolution: ray-flash-2 @ 720p
        model: "luma/ray-flash-2",
        resolution: "720p",
        webhook_url: webhookUrl,
        metadata: {
          eventId,
          slug,
        },
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return {
        ok: false,
        error: text || `Luma API request failed with status ${res.status}`,
      }
    }

    const json = (await res.json().catch(() => null)) as { id?: string } | null
    const jobId = json?.id
    if (!jobId) {
      return { ok: false, error: "Luma API response missing job id." }
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
 * Get single job status (for polling/manual refresh).
 * Update endpoint path if Luma API paths change.
 */
export async function getLumaVideoJob(jobId: string): Promise<LumaVideoJobInfo> {
  if (!jobId) return { ok: false, error: "Missing job id." }

  try {
    const res = await lumaFetch(`/v1/videos/${encodeURIComponent(jobId)}`, {
      method: "GET",
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return {
        ok: false,
        error: text || `Luma status request failed with status ${res.status}`,
      }
    }

    const json = (await res.json().catch(() => null)) as
      | { status?: string; video_url?: string | null }
      | null

    const rawStatus = (json?.status || "").toLowerCase()
    const status: LumaVideoStatus =
      rawStatus === "queued" || rawStatus === "pending"
        ? "queued"
        : rawStatus === "processing"
          ? "processing"
          : rawStatus === "completed" || rawStatus === "succeeded"
            ? "completed"
            : rawStatus === "failed" || rawStatus === "error"
              ? "failed"
              : "unknown"

    return {
      ok: true,
      status,
      videoUrl: json?.video_url ?? null,
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

