"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
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
  /**
   * Must match the page locale’s `dir`. Portaled mobile UI does not inherit document `dir`
   * from the main tree, so this sets `dir` on the overlay and aligns the drawer to the inline end.
   */
  pageDir?: "ltr" | "rtl"
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
 * Landing shell: z above page content.
 * Mobile: single row (logo + hamburger); nav opens as a vertical sheet (once.film–style).
 * Desktop: 3-column grid with centered nav.
 */
export function Navbar({ children, end, pageDir = "ltr" }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // document.body exists only on client; gates createPortal for the mobile sheet.
    queueMicrotask(() => setMounted(true))
  }, [])

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

  const mobileMenu =
    mobileOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              dir={pageDir}
              className="fixed inset-x-0 bottom-0 top-[4.25rem] z-[200] bg-[#030303]/70 backdrop-blur-[2px] md:hidden"
              aria-label="Close menu"
              onClick={closeMenu}
            />
            <div
              id="landing-mobile-nav"
              dir={pageDir}
              className="fixed bottom-0 end-0 top-[4.25rem] z-[201] flex w-[85vw] max-w-[320px] min-w-[12rem] flex-col border-s border-white/[0.12] bg-[#0a0a0a] shadow-[0_12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
            >
              <div className="flex shrink-0 items-center justify-end border-b border-white/[0.08] px-3 py-2.5">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#f5f5f7] hover:bg-white/[0.08]"
                  aria-label="Close menu"
                  onClick={closeMenu}
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>
              <nav
                className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-contain px-2 pb-6 pt-1 [&_button]:min-h-[3rem] [&_button]:w-full [&_button]:rounded-lg [&_button]:border-0 [&_button]:border-b [&_button]:border-white/[0.08] [&_button]:bg-transparent [&_button]:px-3 [&_button]:py-3 [&_button]:text-start [&_button]:text-[12px] [&_button]:font-semibold [&_button]:uppercase [&_button]:tracking-[0.18em] [&_button]:text-[#f5f5f7] [&_button]:last:border-b-0 [&_button]:hover:bg-white/[0.06] [&_button]:active:bg-white/[0.08]"
                aria-label="Sections"
              >
                {navWithClose}
              </nav>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <header
      dir={pageDir}
      className="pointer-events-auto fixed top-0 left-0 right-0 z-[70] border-b-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.92)] backdrop-blur-[20px] md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-0 md:px-10 md:py-5"
    >
      {/* Mobile: logo + menu trigger — brand mark stays LTR (no mirroring) */}
      <div className="flex items-center justify-between px-4 py-3 md:contents">
        <Link
          href="/"
          prefetch
          dir="ltr"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault()
              window.location.reload()
            }
          }}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg outline-none transition-colors hover:bg-white/[0.04] md:col-start-1 md:row-start-1 md:justify-self-start md:-ml-2 md:px-2 md:py-1"
          aria-label="Aeterna — home"
        >
          <img src="/aeterna-logo.png" alt="" className="h-7 w-7 shrink-0 object-contain opacity-90 md:h-8 md:w-8" />
          <span className="min-w-0 truncate font-[var(--font-display)] text-sm uppercase tracking-[0.12em] text-[#e8e4dc] md:text-base">
            Aeterna
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          {end}
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#f5f5f7] transition-colors hover:bg-white/[0.06]"
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Menu className="h-6 w-6" strokeWidth={1.75} />}
          </button>
        </div>
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

      {/* Mobile sheet portaled to body so page layers never cover it; links use readable size/contrast */}
      {mobileMenu}
    </header>
  )
}

export function NavbarCreateLink() {
  return (
    <Link
      href="/create?new=1"
      prefetch
      className="cta-silk relative z-[1] inline-flex min-h-[34px] cursor-pointer items-center rounded-full border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[#030303] px-3 text-[9px] font-medium uppercase tracking-[0.14em] text-[#f5f5f7] hover:border-[rgba(255,255,255,0.18)] hover:bg-[#0c0c0c] sm:px-4 sm:text-[10px] sm:tracking-[0.16em] md:min-h-[40px] md:px-5"
    >
      Create
    </Link>
  )
}
