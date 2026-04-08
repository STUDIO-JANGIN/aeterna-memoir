"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type NavbarProps = {
  /** Center nav links (e.g. How it works, Pricing, FAQ) */
  children?: ReactNode
  /** Right-side CTA (e.g. Create) */
  end?: ReactNode
}

/**
 * Landing shell — z-[10] above page grain/glow/content. 5mm glass + hairline border.
 */
export function Navbar({ children, end }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[10] grid grid-cols-[1fr_auto_1fr] items-center border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.7)] px-5 py-5 backdrop-blur-[20px] backdrop-saturate-[180] md:px-10">
      <div className="flex min-w-0 items-center justify-self-start gap-2">
        <img src="/aeterna-logo.png" alt="Aeterna" className="h-7 w-7 object-contain opacity-90 md:h-8 md:w-8" />
        <span className="font-[var(--font-display)] text-sm uppercase tracking-[0.12em] text-[#e8e4dc] md:text-base">
          Aeterna
        </span>
      </div>
      <nav className="flex min-w-0 items-center justify-center justify-self-center gap-3 sm:gap-5 md:gap-10">{children}</nav>
      <div className="flex shrink-0 items-center justify-end justify-self-end">{end}</div>
    </header>
  )
}

export function NavbarCreateLink() {
  return (
    <Link
      href="/create"
      className="cta-silk inline-flex min-h-[34px] items-center rounded-full border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[#030303] px-3 text-[9px] font-medium uppercase tracking-[0.14em] text-[#f5f5f4] hover:border-[rgba(255,255,255,0.18)] hover:bg-[#0c0c0c] sm:px-4 sm:text-[10px] sm:tracking-[0.16em] md:min-h-[40px] md:px-5"
    >
      Create
    </Link>
  )
}
