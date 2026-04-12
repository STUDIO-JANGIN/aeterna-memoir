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

async function findEventOwnerStubBySlug(norm: string): Promise<EventOwnerStub | null> {
  const admin = getSupabaseAdmin()
  let { data: event, error } = await admin
    .from("events")
    .select("id, creator_user_id, creator_email")
    .eq("slug", norm)
    .maybeSingle()

  if (error || !event) {
    const { data: fb } = await admin
      .from("events")
      .select("id, creator_user_id, creator_email")
      .ilike("slug", norm)
      .limit(1)
      .maybeSingle()
    event = fb
  }

  if (!event?.id) return null
  return event as EventOwnerStub
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
