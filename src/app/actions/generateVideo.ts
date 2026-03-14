"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createLumaVideoJob } from "@/lib/ai/luma-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

const DEFAULT_PROMPT =
  "A peaceful and cinematic tribute video, slow motion, soft lighting"

export type GenerateVideoResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * Premium 이벤트에 대해, 좋아요가 많은 사진(stories)을 재료로 Luma Dream Machine Image-to-Video를 요청합니다.
 * 시작 시 events.video_status = 'generating', 완료 시 webhook에서 full_film_url 갱신.
 */
export async function generateVideoAction(slug: string): Promise<GenerateVideoResult> {
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, is_premium, video_status")
    .eq("slug", slug)
    .single()

  if (eventErr || !event) {
    return { ok: false, error: "이벤트를 찾을 수 없습니다." }
  }

  if (event.is_premium !== true) {
    return { ok: false, error: "Premium 구독 이벤트에서만 AI 영상 생성을 요청할 수 있습니다." }
  }

  const { data: stories, error: storiesErr } = await supabase
    .from("stories")
    .select("image_url")
    .eq("event_id", event.id)
    .order("likes_count", { ascending: false, nullsFirst: false })
    .limit(15)

  if (storiesErr) {
    console.error("[generateVideo] Failed to load stories by likes:", storiesErr)
    return { ok: false, error: "사진 목록을 불러오지 못했습니다." }
  }

  const imageUrls = (stories ?? [])
    .map((s) => s.image_url)
    .filter((u): u is string => typeof u === "string" && u.length > 0)

  if (imageUrls.length === 0) {
    return { ok: false, error: "영상에 사용할 사진이 없습니다. 스토리를 먼저 등록해 주세요." }
  }

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  const webhookUrl = `${appOrigin}/api/ai/luma-webhook`

  const jobResult = await createLumaVideoJob({
    imageUrls,
    prompt: DEFAULT_PROMPT,
    webhookUrl,
    eventId: event.id,
    slug,
  })

  if (!jobResult.ok) {
    console.error("[generateVideo] Luma job creation failed:", jobResult.error)
    return { ok: false, error: "AI 영상 생성 요청에 실패했습니다. 잠시 후 다시 시도해 주세요." }
  }

  const { error: updateErr } = await supabase
    .from("events")
    .update({ video_status: "generating" })
    .eq("id", event.id)

  if (updateErr) {
    console.error("[generateVideo] DB update error:", updateErr)
    return { ok: false, error: "상태 업데이트에 실패했습니다." }
  }

  revalidatePath(`/p/${slug}`)
  revalidatePath(`/p/${slug}/admin`)
  return {
    ok: true,
    message: "AI 영상 생성을 시작했습니다. 완료되면 영상이 반영됩니다.",
  }
}
