export type MemorialStoryForBackground = {
  image_url: string | null
  likes_count: number | null
  created_at: string
}

/**
 * Creator-chosen background URL, else best guest photo: highest hearts, then earliest approved with image.
 */
export function resolveMemorialBackgroundUrl(
  event: { memorial_background_image?: string | null },
  stories: MemorialStoryForBackground[],
): string | null {
  const custom = event.memorial_background_image?.trim()
  if (custom) return custom

  const withImage = stories.filter((s) => s.image_url && String(s.image_url).trim().length > 0)
  if (withImage.length === 0) return null

  const maxHearts = Math.max(
    0,
    ...withImage.map((s) => (typeof s.likes_count === "number" ? s.likes_count : 0)),
  )

  if (maxHearts > 0) {
    const top = withImage.filter((s) => (s.likes_count ?? 0) === maxHearts)
    top.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    return top[0]?.image_url ?? null
  }

  const chronological = [...withImage].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  return chronological[0]?.image_url ?? null
}
