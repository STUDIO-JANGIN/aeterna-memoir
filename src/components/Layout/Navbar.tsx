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
 * Landing shell — z-[50] above page grain/glow/content. 5mm glass + hairline border.
 * Mobile: logo row, then nav row (avoids overlap with “How it works”). Desktop: 3-column grid.
 */
export function Navbar({ children, end }: NavbarProps) {
  return (
    <header className="pointer-events-auto fixed top-0 left-0 right-0 z-[50] flex flex-col gap-2.5 border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.92)] px-4 py-3 backdrop-blur-[20px] md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-0 md:px-10 md:py-5">
      <div className="flex min-w-0 shrink-0 items-center gap-2 md:justify-self-start">
        <img src="/aeterna-logo.png" alt="Aeterna" className="h-7 w-7 shrink-0 object-contain opacity-90 md:h-8 md:w-8" />
        <span className="min-w-0 truncate font-[var(--font-display)] text-sm uppercase tracking-[0.12em] text-[#e8e4dc] md:text-base">
          Aeterna
        </span>
      </div>
      <nav className="flex min-w-0 w-full items-center justify-center gap-2 sm:gap-4 md:col-start-2 md:row-start-1 md:w-auto md:justify-self-center md:gap-10">
        {children}
      </nav>
      <div className="hidden min-w-0 md:col-start-3 md:row-start-1 md:flex md:items-center md:justify-end">
        {end}
      </div>
    </header>
  )
}

export function NavbarCreateLink() {
  return (
    <Link
      href="/create"
      prefetch
      className="cta-silk relative z-[1] inline-flex min-h-[34px] cursor-pointer items-center rounded-full border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[#030303] px-3 text-[9px] font-medium uppercase tracking-[0.14em] text-[#f5f5f7] hover:border-[rgba(255,255,255,0.18)] hover:bg-[#0c0c0c] sm:px-4 sm:text-[10px] sm:tracking-[0.16em] md:min-h-[40px] md:px-5"
    >
      Create
    </Link>
  )
}
