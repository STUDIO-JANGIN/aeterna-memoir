"use client"

import type { ReactNode } from "react"

type CardProps = {
  children: ReactNode
  className?: string
}

/**
 * 5mm glass + hairline edge — content sits at z-[2] (above grain/glow layers when composed).
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`relative z-[2] rounded-[32px] border-[0.5px] border-[rgba(255,255,255,0.1)] bg-[rgba(3,3,3,0.7)] shadow-[0_24px_56px_rgba(0,0,0,0.4)] backdrop-blur-[20px] backdrop-saturate-[180] ${className}`}
    >
      {children}
    </div>
  )
}
