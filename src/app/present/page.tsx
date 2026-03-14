"use client"

import Link from "next/link"

export default function PresentLandingPage() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[var(--aeterna-charcoal)] font-serif px-12 py-24 text-center text-white">
      <p className="font-serif text-[11px] tracking-[0.32em] uppercase text-[var(--aeterna-gold)] mb-6">
        Memorial Presentation
      </p>
      <h1 className="text-2xl md:text-4xl font-light text-white mb-6">
        Open the presentation for a specific memorial
      </h1>
      <p className="font-serif text-sm text-[var(--aeterna-gold-muted)] max-w-md mb-12 leading-relaxed">
        Use the link that includes your memorial ID, for example{" "}
        <strong className="text-[var(--aeterna-gold)]">/present/&lt;your-event-id&gt;</strong>. You can copy this from the admin dashboard or memorial page URL.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center min-h-[52px] px-10 py-4 rounded-[24px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-serif text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
      >
        Return home
      </Link>
    </div>
  )
}
