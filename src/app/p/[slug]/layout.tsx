import type { ReactNode } from "react"

/** Force dynamic rendering for public memorial routes (no static 404 caching). */
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function PublicMemorialSlugLayout({ children }: { children: ReactNode }) {
  return children
}
