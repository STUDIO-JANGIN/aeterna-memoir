import Link from "next/link"

/** Landing + lightweight app shells: copyright + link to legal page. */
export function LandingFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-white/[0.04] bg-landing/60 px-5 py-10 text-center backdrop-blur-[2px] ${className}`}
    >
      <p className="mx-auto max-w-2xl text-[10px] md:text-[11px] leading-relaxed text-[#737373] font-[var(--font-sans)]">
        © 2026 Aeterna. Artisan care for families across the globe.{" "}
        <span className="text-[#525252]" aria-hidden>
          |
        </span>{" "}
        <Link
          href="/privacy-terms"
          className="text-[#8a8a8a] underline underline-offset-[0.2em] decoration-white/12 hover:text-[var(--aeterna-gold-muted)] transition-colors"
        >
          Privacy & Terms
        </Link>
      </p>
    </footer>
  )
}
