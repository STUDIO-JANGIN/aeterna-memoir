"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

export type MyMemorialSummary = {
  slug: string
  name: string | null
}

export type ListMyMemorialsResult =
  | { ok: true; memorials: MyMemorialSummary[] }
  | { ok: false; error: string }

type EventRow = {
  id: string
  slug: string
  name: string | null
  created_at: string
}

/**
 * Memorials created by the signed-in user: `creator_user_id` match, plus legacy rows
 * where `creator_user_id` is null and `creator_email` matches the account email.
 */
export async function listMyMemorialsAction(): Promise<ListMyMemorialsResult> {
  const auth = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await auth.auth.getUser()
  if (userError || !user?.id) {
    return { ok: false, error: "SIGN_IN_REQUIRED" }
  }

  const email = user.email?.trim().toLowerCase() ?? ""
  const admin = getSupabaseAdmin()

  const { data: byUserId, error: errUid } = await admin
    .from("events")
    .select("id, slug, name, created_at")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false })

  if (errUid) {
    console.error("[listMyMemorials] by creator_user_id", errUid.message)
    return { ok: false, error: "Could not load your memorials." }
  }

  let byEmail: EventRow[] = []
  if (email) {
    const { data: legacy, error: errEmail } = await admin
      .from("events")
      .select("id, slug, name, created_at")
      .is("creator_user_id", null)
      .eq("creator_email", email)
      .order("created_at", { ascending: false })

    if (errEmail) {
      console.error("[listMyMemorials] by creator_email", errEmail.message)
    } else {
      byEmail = (legacy ?? []) as EventRow[]
    }
  }

  const map = new Map<string, EventRow>()
  for (const row of [...(byUserId ?? []), ...byEmail] as EventRow[]) {
    if (row?.id && row.slug && !map.has(row.id)) {
      map.set(row.id, row)
    }
  }

  const memorials: MyMemorialSummary[] = [...map.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => ({ slug: r.slug, name: r.name }))

  return { ok: true, memorials }
}
