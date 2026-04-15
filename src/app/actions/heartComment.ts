"use server"

import { unstable_noStore as noStore } from "next/cache"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { parseUuidString } from "@/lib/uuid"

export type HeartCommentResult =
  | { ok: true; likesCount: number }
  | { ok: false; error: string }

function parseRpcCount(data: unknown): number | null {
  const v = Array.isArray(data) ? data[0] : data
  if (typeof v === "number" && !Number.isNaN(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v, 10)
    return Number.isNaN(n) ? null : n
  }
  if (typeof v === "bigint") return Number(v)
  return null
}

function rpcMissingOrStale(errMsg: string): boolean {
  const m = errMsg.toLowerCase()
  return (
    m.includes("increment_comment_likes") ||
    (m.includes("function") && (m.includes("not found") || m.includes("does not exist"))) ||
    m.includes("schema cache")
  )
}

/** Increment comment heart count — DB RPC when available; else read-modify-write with row check. */
export async function heartCommentAction(commentId: string): Promise<HeartCommentResult> {
  noStore()
  const id = parseUuidString(commentId)
  if (!id) {
    return { ok: false, error: "Invalid comment id." }
  }
  const supabase = getSupabaseAdmin()

  const rpcRes = await supabase.rpc("increment_comment_likes", { p_comment_id: id })

  if (!rpcRes.error) {
    const n = parseRpcCount(rpcRes.data)
    if (n != null) {
      return { ok: true, likesCount: n }
    }
  } else {
    const msg = rpcRes.error.message ?? ""
    if (!rpcMissingOrStale(msg)) {
      if (msg.toLowerCase().includes("comment_not_found") || rpcRes.error.code === "P0001") {
        return { ok: false, error: "Comment not found." }
      }
      return { ok: false, error: msg || "Could not update heart." }
    }
  }

  const { data: row, error: fetchError } = await supabase
    .from("comments")
    .select("likes_count")
    .eq("id", id)
    .single()

  if (fetchError || row == null) {
    return { ok: false, error: fetchError?.message ?? "Comment not found." }
  }

  const current =
    typeof row.likes_count === "bigint"
      ? Number(row.likes_count)
      : typeof row.likes_count === "number" && !Number.isNaN(row.likes_count)
        ? row.likes_count
        : Number(row.likes_count ?? 0) || 0
  const nextCount = current + 1

  const { data: updated, error: updateError } = await supabase
    .from("comments")
    .update({ likes_count: nextCount })
    .eq("id", id)
    .select("likes_count")
    .single()

  if (updateError) {
    if (
      updateError.message?.toLowerCase().includes("likes_count") ||
      updateError.message?.toLowerCase().includes("schema")
    ) {
      return {
        ok: false,
        error:
          "Hearts are not available yet. Ask the site owner to run the latest database migration.",
      }
    }
    return { ok: false, error: updateError.message }
  }

  if (updated == null) {
    return { ok: false, error: "Could not save heart. Try again." }
  }

  const out =
    typeof updated.likes_count === "bigint"
      ? Number(updated.likes_count)
      : typeof updated.likes_count === "number" && !Number.isNaN(updated.likes_count)
        ? updated.likes_count
        : Number(updated.likes_count ?? nextCount) || nextCount

  return { ok: true, likesCount: out }
}

export async function unheartCommentAction(commentId: string): Promise<HeartCommentResult> {
  noStore()
  const id = parseUuidString(commentId)
  if (!id) {
    return { ok: false, error: "Invalid comment id." }
  }
  const supabase = getSupabaseAdmin()
  const { data: row, error: fetchError } = await supabase
    .from("comments")
    .select("likes_count")
    .eq("id", id)
    .single()

  if (fetchError || row == null) {
    return { ok: false, error: fetchError?.message ?? "Comment not found." }
  }

  const current =
    typeof row.likes_count === "bigint"
      ? Number(row.likes_count)
      : typeof row.likes_count === "number" && !Number.isNaN(row.likes_count)
        ? row.likes_count
        : Number(row.likes_count ?? 0) || 0
  const nextCount = Math.max(0, current - 1)
  const { data: updated, error: updateError } = await supabase
    .from("comments")
    .update({ likes_count: nextCount })
    .eq("id", id)
    .select("likes_count")
    .single()

  if (updateError) {
    return { ok: false, error: updateError.message }
  }
  if (updated == null) {
    return { ok: false, error: "Could not update heart." }
  }
  const out =
    typeof updated.likes_count === "bigint"
      ? Number(updated.likes_count)
      : typeof updated.likes_count === "number" && !Number.isNaN(updated.likes_count)
        ? updated.likes_count
        : nextCount
  return { ok: true, likesCount: out }
}
