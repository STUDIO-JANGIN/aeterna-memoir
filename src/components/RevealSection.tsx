"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

type Props = {
  children: ReactNode
  className?: string
  delay?: number
}

export function RevealSection({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.section>
  )
}

