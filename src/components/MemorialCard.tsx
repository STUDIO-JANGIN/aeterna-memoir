"use client"

import { useRef } from "react"
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion"

type MemorialCardProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Gallery-glass sheen: pointer X drives a subtle light sweep across a fixed 135° gradient.
 */
export function MemorialCard({ children, className = "" }: MemorialCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0.5)
  const smx = useSpring(mx, { stiffness: 140, damping: 24, mass: 0.75 })
  const posX = useTransform(smx, [0, 1], [8, 92])
  const bgPos = useMotionTemplate`${posX}% 42%`

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        mx.set((e.clientX - r.left) / r.width)
      }}
      onMouseLeave={() => mx.set(0.5)}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)",
          backgroundSize: "220% 220%",
          backgroundPosition: bgPos,
          mixBlendMode: "soft-light",
        }}
      />
    </div>
  )
}
