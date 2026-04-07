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
    return { ok: false, error: "You can request the full version after payment is completed." }
  }

  if (event.tier !== "premium") {
    return { ok: false, error: "1-minute full-version rendering is available only on the Premium plan." }
  }

  if (typeof event.video_credits === "number" && event.video_credits <= 0) {
    return { ok: false, error: "No AI film credits remain. Additional credits are required." }
  }

  if (event.full_film_requested_at) {
    return { ok: true, message: "The full-version request has already been submitted. We’ll notify you when it’s ready." }
  }

  // Load selected photos for the video (recommended: 12–15).
  const { data: selectedStories, error: selErr } = await supabase
    .from("stories")
    .select("image_url")
    .eq("event_id", event.id)
    .eq("is_approved", true)
    .eq("is_selected", true)

  if (selErr) {
    console.error("[requestFullFilm] Failed to load selected stories:", selErr)
    return { ok: false, error: "Couldn’t load the selected photos for video generation." }
  }

  const images = (selectedStories ?? []).map((s) => s.image_url).filter((u): u is string => !!u)
  const count = images.length
  if (count < 5 || count > 10) {
    return {
      ok: false,
      error: `Select between 5 and 10 photos for your tribute film. Currently selected: ${count}.`,
    }
  }

  // Request video generation job from Luma AI (webhook flow).
  const appOrigin = getAppBaseUrl()

  const webhookUrl = `${appOrigin}/api/ai/luma-webhook`

  const prompt = event.name
    ? `A warm, cinematic 1-minute memorial film honoring ${event.name}. Blend facial expressions and atmosphere naturally across photos, with subtle transitions and restrained effects.`
    : "A warm, cinematic 1-minute memorial film honoring a loved one. Blend facial expressions and atmosphere naturally across photos, with subtle transitions and restrained effects."

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
      `🚨 [Urgent] Luma job creation failed: ${jobResult.error}. Auto-credit recovery: No`,
      {
        slug,
        eventId: event.id,
        error: jobResult.error,
      }
    )
    return { ok: false, error: "We couldn’t start AI video generation. Please try again shortly." }
  }

  const iso = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from("events")
    .update({
      full_film_requested_at: iso,
      // Deduct one credit for Premium full-version render (minimum 0).
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
      `🚨 [Urgent] Full-version request DB update failed: ${updateErr.message}. Auto-credit recovery: No`,
      {
        slug,
        eventId: event.id,
        error: updateErr.message,
      }
    )
    return { ok: false, error: updateErr.message }
  }

  // Notify admin that rendering has started.
  await notifyAdmin(`🎬 [Render started] ${event.id} rendering has begun.`, {
    slug,
    eventId: event.id,
    imageCount: count,
  })

  revalidatePath(`/p/${slug}/admin`)
  revalidatePath(`/p/${slug}`)
  return {
    ok: true,
    message: "Full 1-minute rendering has started. We’ll notify you once it’s complete.",
  }
}
