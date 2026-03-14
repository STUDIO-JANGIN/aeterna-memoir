"use client"

import Link from "next/link"

export default function AdminLandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--once-bg)] font-serif px-12 py-24 text-center text-[var(--once-text-primary)]">
      <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-6">
        Family Dashboard
      </p>
      <h1 className="text-2xl md:text-4xl font-light mb-6 font-heading">
        Open your memorial dashboard
      </h1>
      <p className="font-serif text-base text-[var(--once-text-secondary)] max-w-lg mb-12 leading-relaxed">
        After creating a memorial at <strong className="text-[var(--aeterna-gold)]">/create</strong>, use the link you received: <strong className="text-[var(--aeterna-gold)]">/p/[slug]/admin</strong>. Example: if your guest link is <span className="font-mono text-sm">/p/jane-doe-abc123</span>, open <span className="font-mono text-sm">/p/jane-doe-abc123/admin</span>.
      </p>
      <Link
        href="/create"
        className="min-h-[52px] px-10 py-4 rounded-[24px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-serif text-sm inline-flex items-center justify-center hover:bg-[var(--aeterna-gold-pale)] transition-colors mb-4"
      >
        Create a memorial
      </Link>
      <Link
        href="/"
        className="text-sm text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] transition-colors"
      >
        Return home
      </Link>
    </div>
  )
}
