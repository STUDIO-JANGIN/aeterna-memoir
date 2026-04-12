"use server"

import { revalidatePath } from "next/cache"
import { createLumaVideoJob } from "@/lib/ai/luma-client"
import { getAppBaseUrl } from "@/lib/appUrl"
import { buildMemorialTributeFilmPrompt } from "@/lib/memorialFilmPrompt"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type GenerateVideoResult =
  | { ok: true; message: string }
  | { ok: false; error: string }

/**
 * For Premium events, request a Luma Dream Machine Image-to-Video job
 * using top-liked photos. Sets events.video_status to "generating".
 */
export async function generateVideoAction(slug: string): Promise<GenerateVideoResult> {
  const supabase = getSupabaseAdmin()
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, is_premium, video_status")
    .eq("slug", slug)
    .single()

  if (eventErr || !event) {
    return { ok: false, error: "Event not found." }
  }

  if (event.is_premium !== true) {
    return { ok: false, error: "AI film generation is available only for Premium events." }
  }

  const { data: stories, error: storiesErr } = await supabase
    .from("stories")
    .select("image_url")
    .eq("event_id", event.id)
    .order("likes_count", { ascending: false, nullsFirst: false })
    .limit(15)

  if (storiesErr) {
    console.error("[generateVideo] Failed to load stories by likes:", storiesErr)
    return { ok: false, error: "Couldn’t load the photo list." }
  }

  const imageUrls = (stories ?? [])
    .map((s) => s.image_url)
    .filter((u): u is string => typeof u === "string" && u.length > 0)

  if (imageUrls.length === 0) {
    return { ok: false, error: "No photos are available for video generation yet. Please add stories first." }
  }

  const appOrigin = getAppBaseUrl()
  const webhookUrl = `${appOrigin}/api/ai/luma-webhook`

  const prompt = buildMemorialTributeFilmPrompt(
    typeof event.name === "string" ? event.name : null
  )

  const jobResult = await createLumaVideoJob({
    imageUrls,
    prompt,
    webhookUrl,
    eventId: event.id,
    slug,
  })

  if (!jobResult.ok) {
    console.error("[generateVideo] Luma job creation failed:", jobResult.error)
    await notifyAdmin(`🚨 [generateVideo] Luma job failed: ${jobResult.error}`, {
      slug,
      eventId: event.id,
      source: "generateVideoAction",
    })
    const isMissingKey = jobResult.error.includes("LUMA_API_KEY")
    return {
      ok: false,
      error: isMissingKey
        ? "AI video isn’t configured on the server yet (missing API key). Please contact support."
        : "We couldn’t start AI video generation. Please try again shortly.",
    }
  }

  const { error: updateErr } = await supabase
    .from("events")
    .update({ video_status: "generating" })
    .eq("id", event.id)

  if (updateErr) {
    console.error("[generateVideo] DB update error:", updateErr)
    await notifyAdmin(`🚨 [generateVideo] DB update failed: ${updateErr.message}`, {
      slug,
      eventId: event.id,
    })
    return { ok: false, error: "Failed to update the event status." }
  }

  await notifyAdmin(`🎬 [generateVideo] Luma job started (likes-based)`, {
    slug,
    eventId: event.id,
    imageCount: imageUrls.length,
  })

  revalidatePath(`/p/${slug}`)
  revalidatePath(`/p/${slug}/admin`)
  return {
    ok: true,
    message: "AI video generation has started. The film will appear when processing completes.",
  }
}
