"use client"

import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
  roundedClassName?: string
}

/**
 * Dynamic border light — radial white glow (~20%) follows pointer (Leica feel).
 */
export function ArtisanCardLight({ children, className = "", roundedClassName = "rounded-[32px]" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [glow, setGlow] = useState({ x: 50, y: 50, strength: 0 })

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100
    const y = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100
    const edge = Math.min(x, 100 - x, y, 100 - y) / 50
    setGlow({ x, y, strength: 0.35 + edge * 0.65 })
  }, [])

  const onLeave = useCallback(() => {
    setGlow((s) => ({ ...s, strength: 0 }))
  }, [])

  const overlayStyle: CSSProperties = {
    background: `radial-gradient(160px circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,${0.2 * glow.strength}), transparent 70%)`,
    opacity: glow.strength > 0.02 ? 1 : 0,
    transition: "opacity 0.15s ease-out",
  }

  return (
    <div
      ref={rootRef}
      className={`relative z-[2] border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.7)] backdrop-blur-[20px] backdrop-saturate-[180] ${roundedClassName} ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* z: grain(0) implicit → mouse glow(1) → content(2) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-[1] ${roundedClassName} overflow-hidden mix-blend-soft-light`}
      >
        <div className="absolute inset-0" style={overlayStyle} />
      </div>
      <div className="relative z-[2]">{children}</div>
    </div>
  )
}
