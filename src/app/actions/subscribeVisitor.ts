"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type SubscribeVisitorResult =
  | { ok: true }
  | { ok: false; error: string }

export async function subscribeVisitorAction(
  eventId: string,
  email: string,
  provider: string
): Promise<SubscribeVisitorResult> {
  const supabase = getSupabaseAdmin()
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "유효한 이메일 주소를 입력해 주세요." }
  }

  try {
    const { error } = await supabase
      .from("visitors")
      .upsert(
        { event_id: eventId, email: trimmed, provider },
        { onConflict: "event_id,email", ignoreDuplicates: true }
      )

    if (error) {
      if (error.code === "23503") {
        return { ok: false, error: "이 추모 앨범을 찾을 수 없습니다." }
      }
      return { ok: false, error: error.message }
    }

    // optional: notifications 테이블에도 함께 저장 (이미 존재하는 경우 무시)
    await supabase
      .from("notifications")
      .upsert(
        { event_id: eventId, email: trimmed },
        { onConflict: "event_id,email", ignoreDuplicates: true }
      )

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "알림 구독 중 오류가 발생했습니다.",
    }
  }
}

