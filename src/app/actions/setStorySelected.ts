"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

/**
 * 디버그: .env.local에 아래 추가 후 서버 재시작하면 ID로 직접 조회 테스트.
 * - DB 연결이 되면 해당 이벤트로 admin 로드됨. ID로도 안 나오면 연결 문제.
 * DEBUG_EVENT_ID=여기에_1번_쿼리에서_나온_id_UUID_붙여넣기
 */
const DEBUG_EVENT_ID = process.env.DEBUG_EVENT_ID?.trim() || null

export type SetSelectedResult = { ok: true } | { ok: false; error: string }

/** 관리자: 스토리 최종 선정 여부 (영상 제작용, stories.is_selected) */
export async function setStorySelectedAction(
  storyId: string,
  isSelected: boolean
): Promise<SetSelectedResult> {
  const { error } = await supabase
    .from("stories")
    .update({ is_selected: isSelected })
    .eq("id", storyId)

  if (error) {
    console.error("[setStorySelected]", error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export type AdminStory = {
  id: string
  event_id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  likes_count: number | null
  is_selected: boolean | null
  is_approved: boolean | null
  created_at: string
}

export type AdminEvent = {
  id: string
  name: string | null
  slug: string | null
  collection_end_at: string | null
  expired_at: string | null
  is_paid: boolean | null
  tier: string | null
  video_credits?: number | null
  created_at: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
  flower_link: string | null
  profile_image: string | null
  music_url: string | null
  bank_info: string | null
  preview_film_url: string | null
  full_film_requested_at: string | null
  full_film_url?: string | null
  video_status?: string | null
  invite_pdf_url?: string | null
}

/** Server action: slug로 이벤트 단건 조회 (클라이언트에서 호출용) */
export async function getEventBySlugAction(slug: string): Promise<AdminEvent | null> {
  return getEventBySlug(slug)
}

/** slug로 이벤트 단건 조회 (admin/guest 공통). 정확 일치 후, 없으면 대소문자 무시 1회 재시도. */
export async function getEventBySlug(slug: string): Promise<AdminEvent | null> {
  // 환경 변수 확인 (터미널에서 같은 프로젝트/키 사용 여부 확인용)
  console.log("[getEventBySlug] Current Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[getEventBySlug] SUPABASE_SERVICE_ROLE_KEY set:", !!process.env.SUPABASE_SERVICE_ROLE_KEY, "length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0)

  const slugNorm = slug?.trim()
  if (!slugNorm) {
    console.error("[getEventBySlug] slug 비어 있음", { slug })
    return null
  }

  const selectCols =
    "id, name, slug, collection_end_at, is_paid, tier, video_credits, created_at, birth_date, death_date, location, ceremony_time, flower_link, profile_image, music_url, bank_info, preview_film_url, full_film_requested_at, full_film_url, video_status, invite_pdf_url"

  // 직접 ID 조회 테스트: .env.local에 DEBUG_EVENT_ID=<UUID> 설정 시 해당 행을 ID로 조회 후 로그
  if (DEBUG_EVENT_ID) {
    const { data: byIdData, error: byIdError } = await supabase
      .from("events")
      .select(selectCols)
      .eq("id", DEBUG_EVENT_ID)
      .single()
    console.log("[getEventBySlug] DEBUG_EVENT_ID 조회 결과:", {
      id: DEBUG_EVENT_ID,
      found: !!byIdData,
      error: byIdError?.message ?? null,
      slugFromDb: byIdData?.slug ?? null,
    })
    if (byIdData && typeof byIdData === "object" && byIdData.id) {
      return { ...byIdData, expired_at: (byIdData as { expired_at?: string }).expired_at ?? byIdData.collection_end_at ?? null } as AdminEvent
    }
  }

  const { data, error } = await supabase
    .from("events")
    .select(selectCols)
    .eq("slug", slugNorm)
    .maybeSingle()

  console.log("[getEventBySlug] DB Query Result (by slug):", { data: data ? "ok" : null, error: error?.message, slugUsed: slugNorm })

  if (error) {
    console.error("[getEventBySlug] 조회 실패", { slug: slugNorm, message: error.message, code: error.code })
    return null
  }

  if (data && typeof data === "object" && data.id) {
    return { ...data, expired_at: (data as { expired_at?: string }).expired_at ?? data.collection_end_at ?? null } as AdminEvent
  }

  const { data: dataFallback, error: errorFallback } = await supabase
    .from("events")
    .select(selectCols)
    .ilike("slug", slugNorm)
    .limit(1)
    .maybeSingle()

  if (errorFallback) {
    console.error("[getEventBySlug] fallback(ilike) 조회 실패", { slug: slugNorm, message: errorFallback.message })
    return null
  }
  if (dataFallback && typeof dataFallback === "object" && dataFallback.id) {
    console.log("[getEventBySlug] fallback(ilike)로 일치", { slug: slugNorm, dbSlug: dataFallback.slug })
    return { ...dataFallback, expired_at: (dataFallback as { expired_at?: string }).expired_at ?? dataFallback.collection_end_at ?? null } as AdminEvent
  }

  console.error("[getEventBySlug] 이벤트 없음 (data 없음 또는 타입 아님). slug:", slugNorm)
  return null
}

/** 관리자: slug로 이벤트 + 전체 스토리 (승인/미승인 모두, likes_count 내림차순) */
export async function getStoriesForAdminAction(slug: string): Promise<{
  event: AdminEvent | null
  stories: AdminStory[]
  error?: string
}> {
  console.log("[getStoriesForAdminAction] received slug:", slug, "type:", typeof slug)
  const eventData = await getEventBySlug(slug)

  if (!eventData) {
    console.error("[getStoriesForAdminAction] getEventBySlug returned null → Event not found.", { slug })
    return { event: null, stories: [], error: "Event not found." }
  }

  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id, event_id, author_name, story_text, image_url, likes_count, is_selected, is_approved, created_at")
    .eq("event_id", eventData.id)
    .order("likes_count", { ascending: false, nullsFirst: false })

  if (storiesError) {
    console.error("[getStoriesForAdminAction] 스토리 목록 조회 실패", { eventId: eventData.id, message: storiesError.message })
    return { event: eventData, stories: [], error: storiesError.message }
  }

  return {
    event: eventData,
    stories: (storiesData ?? []) as AdminStory[],
  }
}

/** 프리젠테이션용: slug로 이벤트 + 승인된 스토리만 (is_approved: true, 이미지 있는 것만) */
export type PresentStory = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  created_at: string
}

export type PresentEvent = {
  id: string
  name: string | null
  birth_date: string | null
  death_date: string | null
  music_url: string | null
}

export async function getPresentDataAction(slug: string): Promise<{
  event: PresentEvent | null
  stories: PresentStory[]
  error?: string
}> {
  const eventData = await getEventBySlug(slug)
  if (!eventData) {
    return { event: null, stories: [], error: "Event not found." }
  }

  const { data: storiesData, error: storiesError } = await supabase
    .from("stories")
    .select("id, author_name, story_text, image_url, created_at")
    .eq("event_id", eventData.id)
    .eq("is_approved", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: true })

  if (storiesError) {
    console.error("[getPresentDataAction] stories fetch failed", storiesError)
    return { event: eventData, stories: [], error: storiesError.message }
  }

  const event: PresentEvent = {
    id: eventData.id,
    name: eventData.name,
    birth_date: eventData.birth_date,
    death_date: eventData.death_date,
    music_url: eventData.music_url,
  }
  return {
    event,
    stories: (storiesData ?? []) as PresentStory[],
  }
}
