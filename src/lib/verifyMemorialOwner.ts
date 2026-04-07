import "server-only"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * Server-only: true only if the signed-in user is the memorial owner.
 * When `creator_user_id` is set on the row, it must equal `session.user.id` (strict).
 * Legacy rows without `creator_user_id` fall back to matching `creator_email` only.
 */
export async function verifyMemorialOwnerBySlug(slug: string): Promise<boolean> {
  const norm = slug?.trim()
  if (!norm) return false

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
  if (!user?.id) return false

  const admin = getSupabaseAdmin()
  let { data: event, error } = await admin
    .from("events")
    .select("creator_user_id, creator_email")
    .eq("slug", norm)
    .maybeSingle()

  if (error || !event) {
    const { data: fb } = await admin
      .from("events")
      .select("creator_user_id, creator_email")
      .ilike("slug", norm)
      .limit(1)
      .maybeSingle()
    event = fb
  }

  if (!event) return false

  const uid = event.creator_user_id as string | null
  if (uid) {
    return user.id === uid
  }

  const em = (event.creator_email as string | null)?.trim().toLowerCase()
  const uem = user.email?.trim().toLowerCase()
  if (em && uem) return em === uem

  return false
}
