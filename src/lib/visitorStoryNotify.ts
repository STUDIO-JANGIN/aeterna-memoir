/** When `visitors.story_id` column is not migrated yet, we encode the story link in `provider`. */
export const VISITOR_PROVIDER_STORY_PREFIX = "email+story:" as const

export function visitorProviderForStoryNotify(storyId: string): string {
  return `${VISITOR_PROVIDER_STORY_PREFIX}${storyId.trim()}`
}

/** PostgREST / schema cache: column missing on visitors table */
export function isMissingVisitorsStoryIdColumn(err: { message?: string; code?: string } | null): boolean {
  if (!err?.message) return false
  const m = err.message.toLowerCase()
  return (
    m.includes("story_id") &&
    (m.includes("schema") || m.includes("could not find") || m.includes("column") || m.includes("does not exist"))
  )
}
