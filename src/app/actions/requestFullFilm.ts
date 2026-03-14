"use server"

import { revalidatePath } from "next/cache"
import { createLumaVideoJob } from "@/lib/ai/luma-client"
import { getAppBaseUrl } from "@/lib/appUrl"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type RequestFullFilmResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * After payment (is_paid === true), request full 1-min render (up to 50–100 photos, no watermark).
 * Sets full_film_requested_at so a backend job can start high-quality rendering.
 */
export async function requestFullFilmAction(slug: string): Promise<RequestFullFilmResult> {
  const supabase = getSupabaseAdmin()
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, is_paid, full_film_requested_at, tier, video_credits")
    .eq("slug", slug)
    .single()

  if (eventErr || !event) {
    return { ok: false, error: "Event not found." }
  }

  if (event.is_paid !== true) {
    return { ok: false, error: "결제 완료 후 풀버전 제작을 요청할 수 있습니다." }
  }

  if (event.tier !== "premium") {
    return { ok: false, error: "Premium 플랜에서만 1분 풀버전 제작을 요청할 수 있습니다." }
  }

  if (typeof event.video_credits === "number" && event.video_credits <= 0) {
    return { ok: false, error: "남은 마법 영화 제작 기회가 없습니다. 추가 크레딧이 필요합니다." }
  }

  if (event.full_film_requested_at) {
    return { ok: true, message: "풀버전 제작이 이미 요청되었습니다. 완료 시 알려드리겠습니다." }
  }

  // 영상에 사용할 선택된 사진들(12~15장)을 불러온다.
  const { data: selectedStories, error: selErr } = await supabase
    .from("stories")
    .select("image_url")
    .eq("event_id", event.id)
    .eq("is_approved", true)
    .eq("is_selected", true)

  if (selErr) {
    console.error("[requestFullFilm] Failed to load selected stories:", selErr)
    return { ok: false, error: "영상에 사용할 사진 목록을 불러오지 못했습니다." }
  }

  const images = (selectedStories ?? []).map((s) => s.image_url).filter((u): u is string => !!u)
  const count = images.length
  if (count < 12 || count > 15) {
    return {
      ok: false,
      error: `영상에는 12~15장의 선택된 사진을 추천합니다. 현재 선택된 사진은 ${count}장입니다.`,
    }
  }

  // Luma AI에 비디오 생성 Job을 요청 (Webhook 방식)
  const appOrigin = getAppBaseUrl()

  const webhookUrl = `${appOrigin}/api/ai/luma-webhook`

  const prompt = event.name
    ? `${event.name}님의 생전 모습을 담은 따뜻한 1분 추모 영상. 사진 속 표정과 분위기를 자연스럽게 이어 주고, 과한 효과 없이 조용하고 영화적인 감정을 유지해 주세요.`
    : "사랑하는 이를 기리는 조용하고 영화적인 1분 추모 영상. 사진 속 표정과 분위기를 자연스럽게 이어 주고, 과한 효과 없이 따뜻한 감정을 유지해 주세요."

  console.log("[requestFullFilm] Creating Luma job", {
    slug,
    eventId: event.id,
    imageCount: count,
    videoCreditsBefore: event.video_credits,
  })

  const jobResult = await createLumaVideoJob({
    imageUrls: images,
    prompt,
    webhookUrl,
    eventId: event.id,
    slug,
  })

  if (!jobResult.ok) {
    console.error("[requestFullFilm] Luma job creation failed:", jobResult.error)
    await notifyAdmin(
      `🚨 [긴급 에러] Luma Job 생성 실패: ${jobResult.error} 발생. 크레딧 자동 복구 여부: No`,
      {
        slug,
        eventId: event.id,
        error: jobResult.error,
      }
    )
    return { ok: false, error: "AI 영상 생성 요청에 실패했습니다. 잠시 후 다시 시도해 주세요." }
  }

  console.log("[requestFullFilm] Luma job created successfully", {
    slug,
    eventId: event.id,
    imageCount: count,
  })

  const iso = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from("events")
    .update({
      full_film_requested_at: iso,
      // Premium 1분 풀버전 제작 시 video_credits 1회 차감 (최소 0까지)
      video_credits:
        typeof event.video_credits === "number"
          ? Math.max(0, event.video_credits - 1)
          : event.video_credits ?? 0,
      video_status: "processing",
    })
    .eq("id", event.id)

  if (updateErr) {
    console.error("[requestFullFilm] DB update error after Luma job creation:", updateErr)
    await notifyAdmin(
      `🚨 [긴급 에러] 풀버전 요청 DB 업데이트 실패: ${updateErr.message} 발생. 크레딧 자동 복구 여부: No`,
      {
        slug,
        eventId: event.id,
        error: updateErr.message,
      }
    )
    return { ok: false, error: updateErr.message }
  }

  console.log("[requestFullFilm] Event updated for full film", {
    slug,
    eventId: event.id,
    full_film_requested_at: iso,
  })

  // 영상 제작 시작 슬랙 알림
  await notifyAdmin(`🎬 [제작 시작] ${event.id} 영상 렌더링을 시작합니다.`, {
    slug,
    eventId: event.id,
    imageCount: count,
  })

  revalidatePath(`/p/${slug}/admin`)
  revalidatePath(`/p/${slug}`)
  return {
    ok: true,
    message: "1분 풀버전 제작을 시작했습니다. 완료되면 알려드리겠습니다.",
  }
}
