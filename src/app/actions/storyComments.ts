"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { parseUuidString, coerceIdString } from "@/lib/uuid"
import type { Comment } from "@/types/database.types"

export type { Comment }

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

/** Memorial-facing comment shape (same as {@link Comment}). */
export type StoryCommentPublic = Comment

function rowIsReported(value: unknown): boolean {
  if (value === true) return true
  if (value === false || value == null) return false
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    return v === "true" || v === "t" || v === "1" || v === "yes"
  }
  if (typeof value === "number") return value === 1
  return false
}

/** Normalize DB row to public shape; drops reported rows if any slip through. */
function toPublicComment(row: Record<string, unknown>): StoryCommentPublic | null {
  if (rowIsReported(row.is_reported)) return null
  const id = row.id != null ? String(row.id) : ""
  const visitor_name = row.visitor_name != null ? String(row.visitor_name) : ""
  const text = row.text != null ? String(row.text) : ""
  const created_at =
    typeof row.created_at === "string"
      ? row.created_at
      : row.created_at != null
        ? String(row.created_at)
        : new Date().toISOString()
  if (!id) return null
  const likesRaw = row.likes_count
  const likes_count =
    typeof likesRaw === "bigint"
      ? Number(likesRaw)
      : typeof likesRaw === "number" && !Number.isNaN(likesRaw)
        ? likesRaw
        : typeof likesRaw === "string"
          ? parseInt(likesRaw, 10) || 0
          : 0

  return {
    id,
    visitor_name,
    text,
    created_at,
    is_reported: false,
    likes_count,
  }
}

/** PostgREST sometimes lags after adding `is_reported`; retry without touching that column. */
function isReportColumnOrCacheError(msg: string): boolean {
  const m = msg.toLowerCase()
  return m.includes("schema cache") || (m.includes("is_reported") && (m.includes("column") || m.includes("could not find")))
}

function isLikesCountColumnError(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes("likes_count") && (m.includes("column") || m.includes("could not find") || m.includes("schema cache"))
  )
}

export type StoryCommentsResult =
  | { ok: true; comments: StoryCommentPublic[] }
  | { ok: false; error: string }

export async function getStoryCommentsAction(
  photoId: string,
  eventId: string,
): Promise<StoryCommentsResult> {
  noStore()

  const rawPhoto = coerceIdString(photoId)
  const rawEvent = coerceIdString(eventId)
  const photoIdUuid = parseUuidString(rawPhoto)
  const eventIdUuid = parseUuidString(rawEvent)
  if (!photoIdUuid || !eventIdUuid) {
    console.warn("[getStoryComments] invalid ids", { rawPhoto, rawEvent })
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

  const selectColsFull = "id, visitor_name, text, created_at, is_reported, likes_count"

  const first = await supabase
    .from("comments")
    .select(selectColsFull)
    .eq("photo_id", photoIdUuid)
    .eq("event_id", eventIdUuid)
    .eq("is_reported", false)
    .order("created_at", { ascending: true })

  let data: Record<string, unknown>[] | null = (first.data ?? null) as Record<string, unknown>[] | null
  let error = first.error

  if (error) {
    const msg = error.message ?? ""
    /** If `likes_count` failed (often schema cache), try `*` before dropping the column. */
    if (isLikesCountColumnError(msg)) {
      const star = await supabase
        .from("comments")
        .select("*")
        .eq("photo_id", photoIdUuid)
        .eq("event_id", eventIdUuid)
        .eq("is_reported", false)
        .order("created_at", { ascending: true })
      if (!star.error) {
        data = (star.data ?? null) as Record<string, unknown>[] | null
        error = null
      } else {
        const second = await supabase
          .from("comments")
          .select("id, visitor_name, text, created_at, is_reported")
          .eq("photo_id", photoIdUuid)
          .eq("event_id", eventIdUuid)
          .eq("is_reported", false)
          .order("created_at", { ascending: true })
        data = (second.data ?? null) as Record<string, unknown>[] | null
        error = second.error
        if (error && isReportColumnOrCacheError(error.message ?? "")) {
          const third = await supabase
            .from("comments")
            .select("id, visitor_name, text, created_at")
            .eq("photo_id", photoIdUuid)
            .eq("event_id", eventIdUuid)
            .order("created_at", { ascending: true })
          data = (third.data ?? null) as Record<string, unknown>[] | null
          error = third.error
        }
      }
    } else if (isReportColumnOrCacheError(msg)) {
      const second = await supabase
        .from("comments")
        .select("id, visitor_name, text, created_at, likes_count")
        .eq("photo_id", photoIdUuid)
        .eq("event_id", eventIdUuid)
        .eq("is_reported", false)
        .order("created_at", { ascending: true })
      data = (second.data ?? null) as Record<string, unknown>[] | null
      error = second.error
      if (error && isReportColumnOrCacheError(error.message ?? "")) {
        const third = await supabase
          .from("comments")
          .select("id, visitor_name, text, created_at, likes_count")
          .eq("photo_id", photoIdUuid)
          .eq("event_id", eventIdUuid)
          .order("created_at", { ascending: true })
        data = (third.data ?? null) as Record<string, unknown>[] | null
        error = third.error
      }
    }
  }

  if (error) {
    const msg = error.message ?? ""
    if (msg.includes("comments") && (msg.includes("does not exist") || msg.includes("schema cache"))) {
      return { ok: true, comments: [] }
    }
    console.error("[getStoryComments]", msg, { photoId: photoIdUuid, eventId: eventIdUuid })
    return { ok: false, error: "We couldn’t load messages. Please try again." }
  }

  const rows = (data ?? [])
    .map((row) => toPublicComment(row))
    .filter((r): r is StoryCommentPublic => r != null)
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

  const rawPhoto = coerceIdString(clientPhotoId)
  const rawEvent = coerceIdString(clientEventId)
  if (!rawPhoto) {
    console.error("CRITICAL: photo_id missing (empty after cast)")
    return { ok: false, error: "This memory could not be found. Please close and try again." }
  }
  if (!rawEvent) {
    console.error("CRITICAL: event_id missing")
    return { ok: false, error: "This memorial could not be found. Please refresh the page." }
  }

  const pid = parseUuidString(rawPhoto)
  const parsedClientEventId = parseUuidString(rawEvent)
  if (!pid) {
    console.error("CRITICAL: photo_id not a valid UUID string:", rawPhoto)
    return { ok: false, error: "This memory could not be found. Please close and try again." }
  }
  if (!parsedClientEventId) {
    return { ok: false, error: "This memorial could not be found. Please refresh the page." }
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
    .maybeSingle()

  if (storyErr) {
    console.error("[addStoryComment] story lookup failed", storyErr.message)
    return { ok: false, error: "Could not load this memory. Please try again." }
  }
  if (!story) {
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

  const insertPayload = {
    photo_id: photoId,
    event_id: eventId,
    text: body,
    visitor_name: name,
    is_reported: false,
  }

  const minimalPayload = {
    photo_id: photoId,
    event_id: eventId,
    text: body,
    visitor_name: name,
  }

  /** Prefer a minimal RETURNING list so insert succeeds even if likes_count / is_reported lag in schema cache. */
  async function tryInsert(
    payload: Record<string, unknown>,
    selectCols: string,
  ): Promise<{ data: Record<string, unknown> | null; error: { message?: string; code?: string; details?: string; hint?: string } | null }> {
    const { data, error } = await supabase.from("comments").insert(payload).select(selectCols).single()
    return {
      data: (data ?? null) as Record<string, unknown> | null,
      error,
    }
  }

  let inserted: Record<string, unknown> | null = null
  let insertErr: { message?: string; code?: string; details?: string; hint?: string } | null = null

  const attempts: Array<{ payload: Record<string, unknown>; select: string }> = [
    { payload: insertPayload, select: "id, visitor_name, text, created_at" },
    { payload: minimalPayload, select: "id, visitor_name, text, created_at" },
    { payload: minimalPayload, select: "id, visitor_name, text, created_at, is_reported" },
    { payload: insertPayload, select: "id, visitor_name, text, created_at, is_reported, likes_count" },
  ]

  for (const { payload, select } of attempts) {
    const result = await tryInsert(payload, select)
    if (!result.error && result.data) {
      inserted = result.data
      insertErr = null
      break
    }
    insertErr = result.error
    const msg = result.error?.message ?? ""
    if (
      !msg.includes("schema cache") &&
      !msg.includes("could not find") &&
      !msg.includes("column") &&
      !msg.includes("does not exist")
    ) {
      break
    }
  }

  if (insertErr || !inserted) {
    const msg = insertErr?.message ?? ""
    console.error("[addStoryComment] insert failed", msg, {
      code: insertErr?.code,
      details: insertErr?.details,
      hint: insertErr?.hint,
      photo_id: photoId,
      event_id: eventId,
    })
    if (msg.includes("comments") && (msg.includes("does not exist") || msg.includes("schema cache"))) {
      return {
        ok: false,
        error: "Comments are not set up yet on this memorial. Please contact the family administrator.",
      }
    }
    return { ok: false, error: msg || "Could not send your message. Please try again." }
  }

  const pub = toPublicComment(inserted as Record<string, unknown>)
  if (!pub) {
    return { ok: false, error: "Could not send your message." }
  }
  return { ok: true, comment: pub }
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
