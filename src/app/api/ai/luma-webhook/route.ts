import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { normalizeTributeSlots, TRIBUTE_CLIP_COUNT } from "@/lib/tributeFilmConfig"

const LUMA_WEBHOOK_SECRET = process.env.LUMA_WEBHOOK_SECRET

/** Luma POSTs the Generation object; `state` is queued | dreaming | completed | failed */
function normalizeVideoStatus(raw: string): "queued" | "processing" | "completed" | "failed" | "unknown" {
  const s = raw.toLowerCase()
  if (s === "queued" || s === "pending") return "queued"
  if (s === "dreaming" || s === "processing") return "processing"
  if (s === "completed" || s === "succeeded") return "completed"
  if (s === "failed" || s === "error") return "failed"
  return "unknown"
}

export async function POST(req: NextRequest) {
  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (e) {
    console.error("Supabase not configured:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  try {
    if (LUMA_WEBHOOK_SECRET) {
      const sig = req.headers.get("x-luma-signature")
      if (!sig || sig !== LUMA_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const jobId = (body.id as string | undefined) ?? null
    const rawState = String((body.state as string | undefined) ?? (body.status as string | undefined) ?? "").toLowerCase()

    const assets = body.assets as { video?: string } | undefined
    const videoUrl =
      (typeof assets?.video === "string" ? assets.video : null) ??
      (typeof body.video_url === "string" ? body.video_url : null)

    const eventIdFromQuery = req.nextUrl.searchParams.get("eventId")
    const slugFromQuery = req.nextUrl.searchParams.get("slug")
    const slotParam = req.nextUrl.searchParams.get("slot")
    const metadata = body.metadata as { eventId?: string; slug?: string } | undefined
    const eventId = eventIdFromQuery ?? metadata?.eventId ?? null
    const slug = slugFromQuery ?? metadata?.slug ?? undefined
    const slot = Math.max(0, Math.min(TRIBUTE_CLIP_COUNT - 1, parseInt(slotParam ?? "0", 10) || 0))

    if (!eventId) {
      console.warn("[luma-webhook] Missing eventId (use callback_url ?eventId= on create).", { jobId })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const status = normalizeVideoStatus(rawState)

    if (status === "completed") {
      const { data: evRow, error: loadEvErr } = await supabase
        .from("events")
        .select("tribute_film_urls")
        .eq("id", eventId)
        .single()

      if (loadEvErr) {
        console.error("[luma-webhook] Failed to load event for tribute URLs:", loadEvErr)
      }

      const merged = normalizeTributeSlots(evRow?.tribute_film_urls)
      merged[slot] = typeof videoUrl === "string" && videoUrl.length > 0 ? videoUrl : null
      const allClipsDone = merged.every((u) => u != null && u.length > 0)
      const firstUrl = merged.find((u) => u != null && u.length > 0) ?? videoUrl ?? null

      const { error: updateErr } = await supabase
        .from("events")
        .update({
          tribute_film_urls: merged,
          full_film_url: firstUrl,
          video_status: allClipsDone ? "completed" : "ready",
        })
        .eq("id", eventId)

      if (updateErr) {
        console.error("[luma-webhook] Failed to update completed video status:", updateErr)
        await notifyAdmin(
          `🚨 [Urgent] Luma completed DB update failed: ${updateErr.message}. Auto-credit recovery: No`,
          {
            eventId,
            slug,
            jobId,
            slot,
            error: updateErr.message,
          }
        )
        return NextResponse.json({ error: "DB update failed" }, { status: 500 })
      }

      await notifyAdmin(
        `🎬 *Tribute clip ${slot + 1}/${TRIBUTE_CLIP_COUNT} ready*${slug ? ` · /p/${slug}` : ""}${allClipsDone ? " (all clips complete)" : ""}\n${videoUrl ?? "URL unavailable"}`,
        {
          alert: "luma_video_completed",
          eventId,
          slug,
          jobId,
          slot,
          videoUrl,
          allClipsDone,
        }
      )

      if (slug) {
        revalidatePath(`/p/${slug}/admin`)
        revalidatePath(`/p/${slug}`)
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (status === "failed") {
      const { data: ev, error: loadErr } = await supabase
        .from("events")
        .select("video_credits")
        .eq("id", eventId)
        .single()

      if (loadErr) {
        console.error("[luma-webhook] Failed to load event for refund:", loadErr)
      }

      const currentCredits = (ev?.video_credits as number | null) ?? 0
      const failureReason = typeof body.failure_reason === "string" ? body.failure_reason : ""

      const { error: updateErr } = await supabase
        .from("events")
        .update({
          video_status: "failed",
          video_credits: currentCredits + 1,
          // Allow admin to retry this slot after a failure
        })
        .eq("id", eventId)

      if (updateErr) {
        console.error("[luma-webhook] Failed to update failed video status:", updateErr)
        await notifyAdmin(
          `🚨 [Urgent] Luma failed DB update error: ${updateErr.message}. Auto-credit recovery: No`,
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
        `🚨 [Urgent] Luma rendering failed. Auto-credit recovery: Yes${failureReason ? ` — ${failureReason}` : ""}`,
        {
          eventId,
          slug,
          jobId,
          rawStatus: rawState,
          videoUrl,
        }
      )

      if (slug) {
        revalidatePath(`/p/${slug}/admin`)
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[luma-webhook] Handler error:", err)
    await notifyAdmin(`🚨 [luma-webhook] Unhandled error: ${msg}`, {
      source: "luma-webhook",
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
