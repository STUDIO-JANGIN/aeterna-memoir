"use client"

import Link from "next/link"
import {
  type ReactNode,
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type MouseEvent,
} from "react"
import { Menu, X } from "lucide-react"

type NavbarProps = {
  /** Center nav links (e.g. How it works, Pricing, FAQ) */
  children?: ReactNode
  /** Right-side CTA (e.g. Create) */
  end?: ReactNode
}

function chainNavClick(
  child: ReactNode,
  onAfterNav: () => void,
): ReactNode {
  if (!isValidElement(child)) return child
  const props = child.props as { onClick?: (e: MouseEvent) => void }
  const prev = props.onClick
  return cloneElement(child as React.ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
    onClick: (e: MouseEvent) => {
      prev?.(e)
      onAfterNav()
    },
  })
}

/**
 * Landing shell — z above page content.
 * Mobile: single row (logo + hamburger); nav opens as a vertical sheet (once.film–style).
 * Desktop: 3-column grid with centered nav.
 */
export function Navbar({ children, end }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const close = () => {
      if (mq.matches) setMobileOpen(false)
    }
    mq.addEventListener("change", close)
    return () => mq.removeEventListener("change", close)
  }, [])

  const closeMenu = () => setMobileOpen(false)

  const navWithClose = Children.map(children, (child) => chainNavClick(child, closeMenu))

  return (
    <header className="pointer-events-auto fixed top-0 left-0 right-0 z-[70] border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.92)] backdrop-blur-[20px] md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-0 md:px-10 md:py-5">
      {/* Mobile: logo + menu trigger */}
      <div className="flex items-center justify-between px-4 py-3 md:contents">
        <div className="flex min-w-0 shrink-0 items-center gap-2 md:col-start-1 md:row-start-1 md:justify-self-start">
          <img src="/aeterna-logo.png" alt="Aeterna" className="h-7 w-7 shrink-0 object-contain opacity-90 md:h-8 md:w-8" />
          <span className="min-w-0 truncate font-[var(--font-display)] text-sm uppercase tracking-[0.12em] text-[#e8e4dc] md:text-base">
            Aeterna
          </span>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#f5f5f7] transition-colors hover:bg-white/[0.06] md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Menu className="h-6 w-6" strokeWidth={1.75} />}
        </button>
      </div>

      <nav
        className="hidden min-w-0 md:col-start-2 md:row-start-1 md:flex md:w-auto md:items-center md:justify-center md:justify-self-center md:gap-10"
        aria-label="Primary"
      >
        {navWithClose}
      </nav>

      <div className="hidden min-w-0 md:col-start-3 md:row-start-1 md:flex md:items-center md:justify-end">
        {end}
      </div>

      {/* Mobile: dim page below header; sheet from right */}
      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-[4.25rem] z-[60] bg-[#030303]/65 backdrop-blur-[2px] md:hidden"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <div
            id="landing-mobile-nav"
            className="fixed bottom-0 right-0 top-[4.25rem] z-[65] flex w-[min(100vw-2rem,20rem)] flex-col border-l border-white/[0.08] bg-[rgba(8,8,8,0.98)] shadow-[-24px_0_48px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#737373]">Menu</p>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#f5f5f7] hover:bg-white/[0.06]"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-0 overflow-y-auto px-2 py-4 [&_button]:w-full [&_button]:border-0 [&_button]:border-b [&_button]:border-white/[0.06] [&_button]:bg-transparent [&_button]:py-4 [&_button]:text-left [&_button]:text-[11px] [&_button]:uppercase [&_button]:tracking-[0.22em] [&_button:last-child]:border-b-0"
              aria-label="Sections"
            >
              {navWithClose}
            </nav>
          </div>
        </>
      ) : null}
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
