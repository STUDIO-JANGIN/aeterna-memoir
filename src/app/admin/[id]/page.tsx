"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type PageProps = {
  params: Promise<{ id: string }>
}

/**
 * Redirects old /admin/[id] URLs to the slug-based admin: /p/[slug]/admin.
 * Resolves event slug from id (uuid or legacy id) and redirects.
 */
export default function AdminIdRedirectPage({ params }: PageProps) {
  const resolved = use(params)
  const id = typeof resolved?.id === "string" ? resolved.id.trim() : ""
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "found" | "not-found">("loading")

  useEffect(() => {
    if (!id) {
      setStatus("not-found")
      return
    }
    let cancelled = false
    supabase
      .from("events")
      .select("slug")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data?.slug) {
          setStatus("not-found")
          return
        }
        setStatus("found")
        router.replace(`/p/${data.slug}/admin`)
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--aeterna-charcoal)] font-sans text-sm text-[var(--aeterna-gold-muted)] tracking-[0.1em] uppercase">
        Redirecting to admin…
      </div>
    )
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--aeterna-charcoal)] font-sans px-6 text-center text-white">
        <p className="text-[var(--aeterna-gold-muted)] text-sm uppercase tracking-widest mb-3">
          Admin not found
        </p>
        <p className="text-[var(--aeterna-body)] text-base max-w-md mb-6">
          This link is no longer valid. Use your memorial&apos;s slug URL: <strong className="text-[var(--aeterna-gold)]">/p/[your-slug]/admin</strong>
        </p>
        <Link
          href="/admin"
          className="min-h-[44px] px-6 py-3 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-sans text-sm inline-flex items-center justify-center mb-3"
        >
          Open dashboard
        </Link>
        <Link
          href="/"
          className="text-sm text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)]"
        >
          Return home
        </Link>
      </div>
    )
  }

  return null
}
