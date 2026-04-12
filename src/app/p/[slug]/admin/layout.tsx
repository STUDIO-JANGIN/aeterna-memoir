import { redirect } from "next/navigation"
import { verifyMemorialOwnerBySlug } from "@/lib/verifyMemorialOwner"

/** Ensure auth cookies are read on each request (pairs with root middleware session refresh). */
export const dynamic = "force-dynamic"

/**
 * Memorial admin is only for the creator (creator_user_id or legacy creator_email).
 * Unauthorized users never see admin UI — they are redirected to the public memorial with a query flag for a client toast.
 */
export default async function MemorialAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const trimmed = typeof slug === "string" ? slug.trim() : ""
  if (!trimmed) redirect("/")

  const allowed = await verifyMemorialOwnerBySlug(trimmed)
  if (!allowed) {
    redirect(`/p/${encodeURIComponent(trimmed)}?admin_forbidden=1`)
  }

  return <>{children}</>
}
