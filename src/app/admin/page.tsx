"use client"

import Link from "next/link"

export default function AdminLandingPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-landing px-6 md:px-12 py-20 md:py-28 text-center">
      <p className="text-landing-label text-[var(--aeterna-gold)] mb-6">Family Dashboard</p>
      <h1 className="text-landing-section-title max-w-2xl mb-6">
        Open your memorial dashboard
      </h1>
      <p className="text-landing-body max-w-lg mb-12">
        After creating a memorial at <strong className="text-[var(--aeterna-gold)]">/create</strong>, use the link you received: <strong className="text-[var(--aeterna-gold)]">/p/[slug]/admin</strong>. Example: if your guest link is <span className="font-mono text-sm text-[var(--landing-text-hero)]">/p/jane-doe-abc123</span>, open <span className="font-mono text-sm text-[var(--landing-text-hero)]">/p/jane-doe-abc123/admin</span>.
      </p>
      <div className="card-landing-airy px-8 py-10 md:px-12 md:py-12 max-w-xl w-full space-y-6">
        <Link href="/create?new=1" className="btn-landing-primary w-full justify-center">
          Create a memorial
        </Link>
        <Link
          href="/"
          className="block text-center text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
        >
          Return home
        </Link>
      </div>
    </div>
  )
}
