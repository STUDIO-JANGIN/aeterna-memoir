import type { ReactNode } from "react"

/** Force dynamic rendering for public memorial routes (no static 404 caching). */
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function PublicMemorialSlugLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-landing aeterna-page-fade text-[var(--landing-text-body)] [font-family:var(--font-sans)] antialiased">
      {children}
    </div>
  )
}
