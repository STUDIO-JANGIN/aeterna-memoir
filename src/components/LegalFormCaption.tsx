import Link from "next/link"

/** Tiny consent line for forms that collect email or photos. */
export function LegalFormCaption({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[10px] leading-snug text-center text-[var(--aeterna-gold-muted)]/90 ${className}`}
    >
      By continuing, you agree to our{" "}
      <Link
        href="/privacy-terms"
        className="text-[var(--aeterna-gold-muted)] underline underline-offset-2 hover:text-[var(--aeterna-gold)]"
      >
        Privacy & Terms
      </Link>
      .
    </p>
  )
}
