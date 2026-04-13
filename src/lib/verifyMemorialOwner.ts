import "server-only"

import type { User } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type EventOwnerStub = {
  id: string
  creator_user_id: string | null
  creator_email: string | null
}

function isMemorialOwner(user: User, event: EventOwnerStub): boolean {
  const uid = event.creator_user_id
  if (uid) {
    return user.id === uid
  }
  const em = event.creator_email?.trim().toLowerCase()
  const uem = user.email?.trim().toLowerCase()
  if (em && uem) return em === uem
  return false
}

async function getSessionUser() {
  const authClient = await createSupabaseServerClient()
  let {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    const {
      data: { session },
    } = await authClient.auth.getSession()
    user = session?.user ?? null
  }
  return user
}

function rowToOwnerStub(row: unknown): EventOwnerStub | null {
  if (!row || typeof row !== "object" || !("id" in row)) return null
  const r = row as Record<string, unknown>
  const id = typeof r.id === "string" ? r.id : null
  if (!id) return null
  return {
    id,
    creator_user_id: typeof r.creator_user_id === "string" ? r.creator_user_id : null,
    creator_email: typeof r.creator_email === "string" ? r.creator_email : null,
  }
}

async function findEventOwnerStubBySlug(norm: string): Promise<EventOwnerStub | null> {
  const admin = getSupabaseAdmin()
  let { data: raw, error } = await admin.from("events").select("*").eq("slug", norm).maybeSingle()

  if (error || !raw) {
    const { data: fb } = await admin.from("events").select("*").ilike("slug", norm).limit(1).maybeSingle()
    raw = fb
  }

  return rowToOwnerStub(raw)
}

async function findEventOwnerStubById(eventId: string): Promise<EventOwnerStub | null> {
  const admin = getSupabaseAdmin()
  const { data: raw, error } = await admin
    .from("events")
    .select("*")
    .eq("id", eventId.trim())
    .maybeSingle()

  if (error) {
    console.error("[findEventOwnerStubById]", error.message)
    return null
  }
  return rowToOwnerStub(raw)
}

/**
 * Same as {@link resolveMemorialOwnerForSlug} but keyed by `events.id`.
 * Use from server actions after the client has already loaded the memorial (avoids slug/session edge cases).
 */
export async function resolveMemorialOwnerForEventId(
  eventId: string,
): Promise<{ ok: true; eventId: string } | { ok: false }> {
  const id = eventId?.trim()
  if (!id) return { ok: false }

  const user = await getSessionUser()
  if (!user?.id) return { ok: false }

  const event = await findEventOwnerStubById(id)
  if (!event) return { ok: false }

  if (!isMemorialOwner(user, event)) return { ok: false }

  return { ok: true, eventId: event.id }
}

/**
 * When the viewer owns the memorial, returns its `events.id` so callers can load the row by primary key
 * (avoids slug queries that fail if an optional column is missing from the DB).
 */
export async function resolveMemorialOwnerForSlug(
  slug: string,
): Promise<{ ok: true; eventId: string } | { ok: false }> {
  const norm = slug?.trim()
  if (!norm) return { ok: false }

  const user = await getSessionUser()
  if (!user?.id) return { ok: false }

  const event = await findEventOwnerStubBySlug(norm)
  if (!event) return { ok: false }

  if (!isMemorialOwner(user, event)) return { ok: false }

  return { ok: true, eventId: event.id }
}

/**
 * Server-only: true only if the signed-in user is the memorial owner.
 * When `creator_user_id` is set on the row, it must equal `session.user.id` (strict).
 * Legacy rows without `creator_user_id` fall back to matching `creator_email` only.
 */
export async function verifyMemorialOwnerBySlug(slug: string): Promise<boolean> {
  const r = await resolveMemorialOwnerForSlug(slug)
  return r.ok
}
