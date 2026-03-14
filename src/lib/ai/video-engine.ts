const LUMA_API_KEY = process.env.LUMA_API_KEY
const LUMA_API_BASE_URL = process.env.LUMA_API_BASE_URL || "https://api.lumalabs.ai"

export type LumaVideoStatus = "queued" | "processing" | "completed" | "failed" | "unknown"

export type CreateLumaVideoJobOptions = {
  imageUrls: string[]
  prompt: string
  /**
   * Luma 쪽에서 콜백을 보낼 Webhook URL.
   * 예: `${APP_URL}/api/ai/luma-webhook`
   */
  webhookUrl?: string
  /**
   * Aeterna events.id (Supabase)
   */
  eventId?: string
  /**
   * /p/[slug] 식별을 위해 함께 전달
   */
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
 * 선택된 이미지 URL 배열을 기반으로 Luma AI에 비디오 생성 Job을 요청한다.
 * 실제 Luma API 스펙에 맞게 body 구조는 필요 시 조정하면 된다.
 */
export async function createLumaVideoJob(options: CreateLumaVideoJobOptions): Promise<CreateLumaVideoJobResult> {
  const { imageUrls, prompt, webhookUrl, eventId, slug } = options

  if (!imageUrls || imageUrls.length === 0) {
    return { ok: false, error: "At least one image URL is required." }
  }

  // 비용 및 품질 균형을 위해 최대 15장까지만 사용
  const limitedImages = imageUrls.slice(0, 15)

  try {
    // NOTE: body 구조는 실제 Luma API 문서에 맞게 수정 필요.
    const res = await lumaFetch("/v1/videos", {
      method: "POST",
      body: JSON.stringify({
        images: limitedImages,
        prompt,
        // 모델 및 해상도 고정: ray-flash-2 @ 720p
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
 * 단일 Job 상태 조회 (Polling 또는 수동 새로고침용).
 * 실제 Luma API 경로는 필요 시 수정.
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
 * 15초 간격 Polling 유틸리티 (서버 액션/백엔드 job에서 필요 시 사용).
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

