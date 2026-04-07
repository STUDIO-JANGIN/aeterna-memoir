/** Fields needed to decide if the signed-in user may manage a memorial. */
export type MemorialOwnerFields = {
  creator_user_id: string | null
  creator_email: string | null
}

/**
 * True if `user` is the creator. Prefer `creator_user_id` when set; otherwise
 * legacy rows match normalized email only.
 */
export function isMemorialOwner(
  user: { id: string; email?: string | null } | null,
  event: MemorialOwnerFields | null
): boolean {
  if (!user || !event) return false

  if (event.creator_user_id) {
    return user.id === event.creator_user_id
  }

  if (event.creator_email && user.email) {
    return user.email.trim().toLowerCase() === event.creator_email.trim().toLowerCase()
  }

  return false
}
