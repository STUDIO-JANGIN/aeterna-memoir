"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function FindPage() {
  const router = useRouter()
  const [value, setValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return

    let id: string | null = null

    try {
      // Full URL case
      if (trimmed.includes("://")) {
        const url = new URL(trimmed)
        const parts = url.pathname.split("/").filter(Boolean)
        const eventIndex = parts.indexOf("event")
        if (eventIndex >= 0 && parts[eventIndex + 1]) {
          id = parts[eventIndex + 1]
        }
      } else if (trimmed.includes("/event/")) {
        // Path-like case: /event/<id>
        const after = trimmed.split("/event/")[1]
        id = after?.split(/[/?#]/)[0] || null
      } else {
        // Assume it's the raw event id/code
        id = trimmed
      }
    } catch {
      id = null
    }

    if (!id) {
      alert("We couldn't recognise that link or code. Please check and try again.")
      return
    }

    router.push(`/event/${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--aeterna-charcoal)] font-serif px-12 py-24 text-white">
      <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-6">
        Find a Loved One
      </p>
      <h1 className="font-serif text-2xl md:text-4xl font-light text-center text-white mb-6">
        Locate a memorial page.
      </h1>
      <p className="font-serif text-base text-[var(--aeterna-gold-muted)] text-center max-w-md mb-10 leading-relaxed">
        Paste the memorial link or enter the code the family shared with you. We&apos;ll take you straight there.
      </p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg flex flex-col sm:flex-row items-stretch gap-3 mb-10"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. https://aeterna.app/event/abc123 or just abc123"
          className="flex-1 border-b border-[var(--border-gold-subtle)] bg-transparent py-3 focus:outline-none focus:border-[var(--aeterna-gold)] font-serif text-sm text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          className="min-h-[48px] px-8 py-3 rounded-[999px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-serif text-xs tracking-[0.2em] uppercase bg-transparent hover:bg-[var(--aeterna-gold-pale)] transition-colors cursor-pointer"
        >
          Open
        </button>
      </form>

      <Link
        href="/"
        className="font-serif text-sm text-[var(--aeterna-gold-muted)] underline underline-offset-4 decoration-[var(--aeterna-gold)] hover:text-[var(--aeterna-gold)] transition-colors"
      >
        Back to home
      </Link>
    </div>
  )
}

