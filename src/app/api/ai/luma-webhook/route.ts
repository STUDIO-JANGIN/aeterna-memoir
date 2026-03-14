import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const LUMA_WEBHOOK_SECRET = process.env.LUMA_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (e) {
    console.error("Supabase not configured:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  try {
    // 간단한 시크릿 검증 (필요 시 HMAC 등으로 보강 가능)
    if (LUMA_WEBHOOK_SECRET) {
      const sig = req.headers.get("x-luma-signature")
      if (!sig || sig !== LUMA_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const body = await req.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const jobId = (body.id as string | undefined) ?? null
    const rawStatus = String((body.status as string | undefined) ?? "").toLowerCase()
    const videoUrl = (body.video_url as string | undefined) ?? null
    const metadata = (body.metadata as { eventId?: string; slug?: string } | undefined) ?? {}
    const eventId = metadata.eventId
    const slug = metadata.slug

    if (!eventId) {
      console.warn("[luma-webhook] Missing eventId in metadata.", { jobId })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const status =
      rawStatus === "queued" || rawStatus === "pending"
        ? "queued"
        : rawStatus === "processing"
          ? "processing"
          : rawStatus === "completed" || rawStatus === "succeeded"
            ? "completed"
            : rawStatus === "failed" || rawStatus === "error"
              ? "failed"
              : "unknown"

    if (status === "completed") {
      const { error: updateErr } = await supabase
        .from("events")
        .update({
          full_film_url: videoUrl,
          video_status: "completed",
        })
        .eq("id", eventId)

      if (updateErr) {
        console.error("[luma-webhook] Failed to update completed video status:", updateErr)
        await notifyAdmin(
          `🚨 [긴급 에러] Luma 완료 DB 업데이트 실패: ${updateErr.message} 발생. 크레딧 자동 복구 여부: No`,
          {
            eventId,
            slug,
            jobId,
            error: updateErr.message,
          }
        )
        return NextResponse.json({ error: "DB update failed" }, { status: 500 })
      }

      await notifyAdmin(
        `사장님, 새로운 AI 추모 영상이 완성되었습니다! 링크: ${videoUrl ?? "URL 미상"}`,
        {
          eventId,
          slug,
          jobId,
          videoUrl,
        }
      )

      if (slug) {
        revalidatePath(`/p/${slug}/admin`)
        revalidatePath(`/p/${slug}`)
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (status === "failed") {
      // 실패 시: 상태를 failed로 기록하고, video_credits를 1회 복구
      const { data: ev, error: loadErr } = await supabase
        .from("events")
        .select("video_credits")
        .eq("id", eventId)
        .single()

      if (loadErr) {
        console.error("[luma-webhook] Failed to load event for refund:", loadErr)
      }

      const currentCredits = (ev?.video_credits as number | null) ?? 0

      const { error: updateErr } = await supabase
        .from("events")
        .update({
          video_status: "failed",
          video_credits: currentCredits + 1,
        })
        .eq("id", eventId)

      if (updateErr) {
        console.error("[luma-webhook] Failed to update failed video status:", updateErr)
        await notifyAdmin(
          `🚨 [긴급 에러] Luma 실패 DB 업데이트 오류: ${updateErr.message} 발생. 크레딧 자동 복구 여부: No`,
          {
            eventId,
            slug,
            jobId,
            error: updateErr.message,
          }
        )
        return NextResponse.json({ error: "DB update failed" }, { status: 500 })
      }

      await notifyAdmin(
        "🚨 [긴급 에러] Luma 렌더링 실패 발생. 크레딧 자동 복구 여부: Yes",
        {
          eventId,
          slug,
          jobId,
          rawStatus,
          videoUrl,
        }
      )

      if (slug) {
        revalidatePath(`/p/${slug}/admin`)
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    // 진행 중 / 기타 상태는 단순 ACK
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error("[luma-webhook] Handler error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

