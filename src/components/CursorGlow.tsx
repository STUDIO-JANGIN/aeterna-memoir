"use client"

import { useEffect } from "react"

/**
 * Soft radial highlight that follows the pointer — obsidian canvas with a whisper of light.
 */
export function CursorGlow() {
  useEffect(() => {
    const root = document.documentElement
    const set = (x: number, y: number) => {
      root.style.setProperty("--cursor-x", `${x}px`)
      root.style.setProperty("--cursor-y", `${y}px`)
    }
    const onMove = (e: MouseEvent) => {
      set(e.clientX, e.clientY)
    }
    const onLeave = () => {
      set(window.innerWidth / 2, window.innerHeight / 2)
    }
    set(window.innerWidth / 2, window.innerHeight / 2)
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("blur", onLeave)
    document.addEventListener("mouseleave", onLeave)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("blur", onLeave)
      document.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] mix-blend-soft-light"
      style={{
        background:
          "radial-gradient(400px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), rgba(255,255,255,0.05) 0%, transparent 62%)",
      }}
    />
  )
}
