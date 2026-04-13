import { revalidatePath } from "next/cache"
import { createLumaVideoJobWithRetry } from "@/lib/ai/video-engine"
import { getAppBaseUrl } from "@/lib/appUrl"
import { buildTributeClipPrompt, type StorySnippetForFilm } from "@/lib/memorialFilmPrompt"
import { notifyAdmin } from "@/lib/notifyAdmin"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import {
  normalizeTributeSlots,
  TRIBUTE_CLIP_COUNT,
  TRIBUTE_CLIP_MAX_IMAGES,
  TRIBUTE_FILM_MAX_PHOTOS,
  TRIBUTE_FILM_MIN_PHOTOS,
} from "@/lib/tributeFilmConfig"

type StoryRow = {
  id: string
  image_url: string | null
  story_text: string | null
  likes_count: number | null
}

/** Loaded with `select("*")` so optional columns never break the query if migrations lag. */
type EventRowForClip = {
  id: string
  slug?: string | null
  name?: string | null
  is_paid?: boolean | null
  tier?: string | null
  video_credits?: number | null
  tribute_film_urls?: unknown
  video_status?: string | null
}

export type TributeClipAttemptResult =
  | { ok: true; message: string }
  | { ok: false; error: string; code?: "skip" }

/**
 * Generate the next ~10s Luma clip for a memorial (by Supabase events.id).
 * Used by admin action and by Stripe webhook (auto-start after Premium payment).
 */
export async function attemptTributeClipGenerationForEvent(
  eventId: string,
  options: { revalidate: boolean; source: "admin" | "payment_webhook" }
): Promise<TributeClipAttemptResult> {
  const supabase = getSupabaseAdmin()
  const { data: rawEvent, error: eventErr } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle()

  if (eventErr || !rawEvent || typeof rawEvent !== "object" || !("id" in rawEvent)) {
    console.error("[tributeClipPipeline] event load failed:", eventErr?.message ?? "no row")
    return { ok: false, error: "Event not found." }
  }

  const event = rawEvent as EventRowForClip

  const slug = typeof event.slug === "string" ? event.slug : ""
  if (!slug.trim()) {
    return { ok: false, error: "Event has no slug." }
  }

  if (event.is_paid !== true) {
    return {
      ok: false,
      error: "You can request tribute clips after payment is completed.",
      code: "skip",
    }
  }

  if (event.tier !== "premium") {
    return {
      ok: false,
      error: "AI tribute clips are available only on the Premium plan.",
      code: "skip",
    }
  }

  const creditsBefore = typeof event.video_credits === "number" ? event.video_credits : 0
  if (creditsBefore <= 0) {
    return { ok: false, error: "No tribute clip credits remain.", code: "skip" }
  }

  const vs = (event.video_status as string | null) ?? ""
  if (vs === "processing" || vs === "generating") {
    return {
      ok: false,
      error: "A clip is already rendering. Please wait for it to finish.",
      code: "skip",
    }
  }

  const slots = normalizeTributeSlots(event.tribute_film_urls)
  const clipIndex = slots.findIndex((u) => u == null || u === "")
  if (clipIndex < 0) {
    return {
      ok: false,
      error: "All tribute clips have already been generated.",
      code: "skip",
    }
  }

  const { data: selectedStories, error: selErr } = await supabase
    .from("stories")
    .select("id, image_url, story_text, likes_count")
    .eq("event_id", event.id)
    .eq("is_approved", true)
    .eq("is_selected", true)
    .order("likes_count", { ascending: false, nullsFirst: false })

  if (selErr) {
    console.error("[tributeClipPipeline] Failed to load selected stories:", selErr)
    return { ok: false, error: "Couldn’t load the selected photos for video generation." }
  }

  const pool = (selectedStories ?? []).filter((s) => s.image_url) as StoryRow[]
  const count = pool.length
  if (count < TRIBUTE_FILM_MIN_PHOTOS || count > TRIBUTE_FILM_MAX_PHOTOS) {
    const msg = `Select between ${TRIBUTE_FILM_MIN_PHOTOS} and ${TRIBUTE_FILM_MAX_PHOTOS} approved photos for the tribute (you have ${count}).`
    if (options.source === "payment_webhook") {
      await notifyAdmin(
        `📷 [Premium paid — clip auto-start skipped] ${typeof event.name === "string" ? event.name : eventId}: ${msg}`,
        { eventId, slug, source: options.source, photoCount: count }
      )
    }
    return { ok: false, error: msg, code: "skip" }
  }

  const clipStories = pool.slice(0, TRIBUTE_CLIP_MAX_IMAGES)
  const imageUrls = clipStories.map((s) => s.image_url!).filter(Boolean)
  if (imageUrls.length === 0) {
    return { ok: false, error: "No images available for this clip. Try selecting more photos." }
  }

  const storyIds = clipStories.map((s) => s.id)
  const visitorLinesByStory = new Map<string, string[]>()
  if (storyIds.length > 0) {
    let comRows: Record<string, unknown>[] | null = null
    const first = await supabase
      .from("comments")
      .select("photo_id, visitor_name, text, is_reported")
      .in("photo_id", storyIds)
    if (first.error) {
      const second = await supabase
        .from("comments")
        .select("photo_id, visitor_name, text")
        .in("photo_id", storyIds)
      comRows = (second.data ?? null) as Record<string, unknown>[] | null
    } else {
      comRows = (first.data ?? null) as Record<string, unknown>[] | null
    }

    if (comRows) {
      for (const row of comRows) {
        if (row.is_reported === true) continue
        const pid = String(row.photo_id ?? "")
        const vn = String(row.visitor_name ?? "").trim()
        const tx = String(row.text ?? "").trim()
        if (!pid || !tx) continue
        const line = vn ? `${vn}: ${tx}` : tx
        const arr = visitorLinesByStory.get(pid) ?? []
        if (arr.length < 8) arr.push(line.slice(0, 120))
        visitorLinesByStory.set(pid, arr)
      }
    }
  }

  const snippets: StorySnippetForFilm[] = clipStories.map((s) => ({
    storyText: s.story_text,
    visitorLines: visitorLinesByStory.get(s.id) ?? [],
  }))

  const prompt = buildTributeClipPrompt(
    typeof event.name === "string" ? event.name : null,
    clipIndex,
    snippets
  )

  const appOrigin = getAppBaseUrl()
  const webhookUrl = `${appOrigin}/api/ai/luma-webhook`

  const jobResult = await createLumaVideoJobWithRetry({
    imageUrls,
    prompt,
    webhookUrl,
    eventId: event.id,
    slug,
    slot: clipIndex,
  })

  if (!jobResult.ok) {
    console.error("[tributeClipPipeline] Luma job creation failed:", jobResult.error)
    await notifyAdmin(
      `🚨 [Luma] Job failed after retries: ${jobResult.error} · ${slug}`,
      {
        slug,
        eventId: event.id,
        clipIndex,
        error: jobResult.error,
        source: options.source,
      }
    )
    const isMissingKey = jobResult.error.includes("LUMA_API_KEY")
    return {
      ok: false,
      error: isMissingKey
        ? "AI video isn’t configured on the server yet (missing API key). Please contact support."
        : "We couldn’t start AI video generation. Please try again shortly.",
    }
  }

  const iso = new Date().toISOString()
  const nextCredits = Math.max(0, creditsBefore - 1)

  const { error: updateErr } = await supabase
    .from("events")
    .update({
      full_film_requested_at: iso,
      video_credits: nextCredits,
      video_status: "processing",
    })
    .eq("id", event.id)

  if (updateErr) {
    console.error("[tributeClipPipeline] DB update error after Luma job creation:", updateErr)
    await notifyAdmin(
      `🚨 [Urgent] Tribute clip DB update failed: ${updateErr.message}`,
      {
        slug,
        eventId: event.id,
        error: updateErr.message,
      }
    )
    return { ok: false, error: updateErr.message }
  }

  const memorialLabel = typeof event.name === "string" && event.name.trim() ? event.name.trim() : event.id
  await notifyAdmin(
    `🎬 [Luma clip ${clipIndex + 1}/${TRIBUTE_CLIP_COUNT} started] ${memorialLabel} · ${imageUrls.length} refs · /p/${slug}`,
    {
      slug,
      eventId: event.id,
      clipIndex,
      imageCount: imageUrls.length,
      jobId: jobResult.jobId,
      creditsAfter: nextCredits,
      source: options.source,
    }
  )

  if (options.revalidate) {
    revalidatePath(`/p/${slug}/admin`)
    revalidatePath(`/p/${slug}`)
  }

  return {
    ok: true,
    message: `Clip ${clipIndex + 1} of ${TRIBUTE_CLIP_COUNT} is rendering (~10s). ${nextCredits} clip${nextCredits === 1 ? "" : "s"} left after this one finishes.`,
  }
}
