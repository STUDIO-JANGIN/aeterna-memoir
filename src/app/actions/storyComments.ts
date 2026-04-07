"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

const MAX_TEXT = 500
const MAX_NAME = 60

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
  if (!photoId?.trim() || !eventId?.trim()) {
    return { ok: true, comments: [] }
  }

  const supabase = getSupabaseAdmin()
  const { data: storyRow, error: storyErr } = await supabase
    .from("stories")
    .select("id, event_id, is_approved")
    .eq("id", photoId.trim())
    .maybeSingle()
  if (storyErr || !storyRow || storyRow.event_id !== eventId.trim() || storyRow.is_approved !== true) {
    return { ok: true, comments: [] }
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id, visitor_name, text, created_at")
    .eq("photo_id", photoId)
    .eq("event_id", eventId)
    .eq("is_reported", false)
    .order("created_at", { ascending: true })

  if (error) {
    const msg = error.message ?? ""
    if (msg.includes("comments") && (msg.includes("does not exist") || msg.includes("schema cache"))) {
      return { ok: true, comments: [] }
    }
    console.error("[getStoryComments]", msg)
    return { ok: false, error: "We couldn’t load messages. Please try again." }
  }
  return { ok: true, comments: (data ?? []) as StoryCommentPublic[] }
}

export type AddCommentResult =
  | { ok: true; comment: StoryCommentPublic }
  | { ok: false; error: string }

export async function addStoryCommentAction(
  photoId: string,
  eventId: string,
  visitorName: string,
  text: string,
): Promise<AddCommentResult> {
  const name = visitorName.trim().slice(0, MAX_NAME) || "Anonymous"
  const body = text.trim().slice(0, MAX_TEXT)
  if (!body) {
    return { ok: false, error: "Please write a short message." }
  }

  const supabase = getSupabaseAdmin()

  const { data: story, error: storyErr } = await supabase
    .from("stories")
    .select("id, event_id, is_approved")
    .eq("id", photoId)
    .single()
  if (storyErr || !story || story.event_id !== eventId) {
    return { ok: false, error: "Memory not found." }
  }
  if (story.is_approved !== true) {
    return { ok: false, error: "You can share a memory once this photo has been approved." }
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("comments")
    .insert({
      photo_id: photoId,
      event_id: eventId,
      text: body,
      visitor_name: name,
    })
    .select("id, visitor_name, text, created_at")
    .single()

  if (insertErr || !inserted) {
    const msg = insertErr?.message ?? ""
    console.error("[addStoryComment]", msg)
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
