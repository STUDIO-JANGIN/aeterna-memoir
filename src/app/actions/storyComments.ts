"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { parseUuidString } from "@/lib/uuid"

const MAX_TEXT = 500
const MAX_NAME = 60

/** PostgREST / drivers may return booleans as bool, string, or null — treat only clear approvals as true. */
function rowIsApproved(value: unknown): boolean {
  if (value === true) return true
  if (value === false || value == null) return false
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (v === "false" || v === "f" || v === "0" || v === "no" || v === "") return false
    return v === "true" || v === "t" || v === "1" || v === "yes"
  }
  if (typeof value === "number") return value === 1
  return false
}

export type StoryCommentPublic = {
  id: string
  visitor_name: string
  text: string
  created_at: string
}

export type StoryCommentsResult =
  | { ok: true; comments: StoryCommentPublic[] }
  | { ok: false; error: string }

export async function getStoryCommentsAction(
  photoId: string,
  eventId: string,
): Promise<StoryCommentsResult> {
  noStore()

  const rawPhoto =
    photoId != null && typeof photoId === "string"
      ? photoId.trim()
      : String(photoId ?? "").trim()
  const rawEvent =
    eventId != null && typeof eventId === "string"
      ? eventId.trim()
      : String(eventId ?? "").trim()
  const photoIdUuid = parseUuidString(rawPhoto)
  const eventIdUuid = parseUuidString(rawEvent)
  if (!photoIdUuid || !eventIdUuid) {
    return { ok: true, comments: [] }
  }

  const supabase = getSupabaseAdmin()
  const { data: storyRow, error: storyErr } = await supabase
    .from("stories")
    .select("id, event_id, is_approved")
    .eq("id", photoIdUuid)
    .maybeSingle()
  if (storyErr || !storyRow) {
    return { ok: true, comments: [] }
  }

  /** Supabase may return UUID columns as uppercase strings; must normalize before JS `===`. */
  const rowStoryId = parseUuidString(String(storyRow.id))
  const rowEventId = parseUuidString(String(storyRow.event_id))
  if (
    !rowStoryId ||
    !rowEventId ||
    rowStoryId !== photoIdUuid ||
    rowEventId !== eventIdUuid ||
    !rowIsApproved(storyRow.is_approved)
  ) {
    return { ok: true, comments: [] }
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, visitor_name, text, created_at")
    .eq("photo_id", photoIdUuid)
    .eq("event_id", eventIdUuid)
    .eq("is_reported", false)
    .order("created_at", { ascending: true })

  if (error) {
    const msg = error.message ?? ""
    if (msg.includes("comments") && (msg.includes("does not exist") || msg.includes("schema cache"))) {
      return { ok: true, comments: [] }
    }
    console.error("[getStoryComments]", msg, { photoId: photoIdUuid, eventId: eventIdUuid })
    return { ok: false, error: "We couldn’t load messages. Please try again." }
  }

  const rows = (data ?? []) as StoryCommentPublic[]
  return { ok: true, comments: rows }
}

export type AddCommentResult =
  | { ok: true; comment: StoryCommentPublic }
  | { ok: false; error: string }

export async function addStoryCommentAction(
  clientPhotoId: string,
  clientEventId: string,
  visitorName: string,
  text: string,
): Promise<AddCommentResult> {
  noStore()

  const rawPhoto =
    clientPhotoId != null && typeof clientPhotoId === "string"
      ? clientPhotoId.trim()
      : String(clientPhotoId ?? "").trim()
  if (!rawPhoto) {
    console.error("CRITICAL: photo_id missing (empty after cast)")
    return { ok: false, error: "Error: Photo ID missing" }
  }

  const rawEvent =
    clientEventId != null && typeof clientEventId === "string"
      ? clientEventId.trim()
      : String(clientEventId ?? "").trim()
  if (!rawEvent) {
    console.error("CRITICAL: event_id missing")
    return { ok: false, error: "Error: Event ID missing" }
  }

  const pid = parseUuidString(rawPhoto)
  const parsedClientEventId = parseUuidString(rawEvent)
  if (!pid) {
    console.error("CRITICAL: photo_id not a valid UUID string:", rawPhoto)
    return { ok: false, error: "Error: Photo ID missing" }
  }
  if (!parsedClientEventId) {
    return { ok: false, error: "Error: Event ID missing" }
  }

  const name = visitorName.trim().slice(0, MAX_NAME) || "Anonymous"
  const body = text.trim().slice(0, MAX_TEXT)
  if (!body) {
    return { ok: false, error: "Please write a short message." }
  }

  const supabase = getSupabaseAdmin()

  const { data: story, error: storyErr } = await supabase
    .from("stories")
    .select("id, event_id, is_approved")
    .eq("id", pid)
    .single()

  if (storyErr || !story) {
    return { ok: false, error: "Memory not found." }
  }

  /** FK-safe IDs: always taken from the `stories` row so photo_id + event_id match the DB. */
  const photoId = parseUuidString(String(story.id))
  const eventId = parseUuidString(String(story.event_id))
  if (!photoId || !eventId) {
    console.error("CRITICAL: story row returned invalid id/event_id", story)
    return { ok: false, error: "Error: Photo ID missing" }
  }

  if (eventId !== parsedClientEventId) {
    return { ok: false, error: "Memory not found." }
  }
  if (!rowIsApproved(story.is_approved)) {
    return { ok: false, error: "You can share a memory once this photo has been approved." }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("comments")
    .insert({
      photo_id: photoId,
      event_id: eventId,
      text: body,
      visitor_name: name,
      is_reported: false,
    })
    .select("id, visitor_name, text, created_at")
    .single()

  if (insertErr || !inserted) {
    const msg = insertErr?.message ?? ""
    console.error("[addStoryComment] insert failed", msg, {
      code: insertErr?.code,
      details: insertErr?.details,
      hint: insertErr?.hint,
      photo_id: photoId,
      event_id: eventId,
    })
    return { ok: false, error: msg || "Could not send your message." }
  }

  return { ok: true, comment: inserted as StoryCommentPublic }
}

export type ReportCommentResult = { ok: true } | { ok: false; error: string }

export async function reportStoryCommentAction(commentId: string): Promise<ReportCommentResult> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("comments")
    .update({ is_reported: true, reported_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) {
    console.error("[reportStoryComment]", error.message)
    return { ok: false, error: "Could not submit report." }
  }
  return { ok: true }
}
