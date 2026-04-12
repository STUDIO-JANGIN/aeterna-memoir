import type { LandingLocale } from "@/lib/landingTranslations"

export type InvitePdfUrlsMap = Partial<Record<LandingLocale, string>>

/** Prefer locale-specific PDF; fall back to legacy single URL. */
export function resolveInvitePdfUrl(
  invitePdfUrls: InvitePdfUrlsMap | null | undefined,
  invitePdfUrlLegacy: string | null | undefined,
  locale: LandingLocale
): string | null {
  const fromMap = invitePdfUrls?.[locale]?.trim()
  if (fromMap) return fromMap
  const legacy = invitePdfUrlLegacy?.trim()
  if (legacy) return legacy
  const en = invitePdfUrls?.en?.trim()
  return en || null
}
