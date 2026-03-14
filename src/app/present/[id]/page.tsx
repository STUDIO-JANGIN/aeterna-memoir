"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type PageProps = {
  params: Promise<{ id: string }>
}

/**
 * Redirects old /present/[id] URLs to the slug-based presentation: /p/[slug]/present.
 * Resolves event slug from id and redirects; if not found, shows a short message with link to home.
 */
export default function PresentIdRedirectPage({ params }: PageProps) {
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
        router.replace(`/p/${data.slug}/present`)
      })
    return () => { cancelled = true }
  }, [id, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050712] text-white font-sans text-sm text-gray-500">
        Redirecting to presentation…
      </div>
    )
  }

  if (status === "not-found") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050712] text-white font-serif px-6 text-center">
        <p className="font-sans text-[11px] tracking-[0.32em] uppercase text-gray-500 mb-3">
          Presentation not found
        </p>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          This link is no longer valid. Memorials now use a different URL. Go to the memorial page and use &quot;Launch Presentation&quot; from the admin.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-full bg-white text-black font-sans text-sm"
        >
          Return home
        </a>
      </div>
    )
  }

  return null
}
