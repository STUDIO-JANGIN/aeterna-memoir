"use client"

import type { CSSProperties } from "react"

/** Optimistic story image: blurred placeholder until Supabase URL replaces the blob. */
export const optimisticImageStyle: CSSProperties = {
  filter: "blur(10px)",
  opacity: 0.4,
  transition: "filter 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
}

export const resolvedImageStyle: CSSProperties = {
  filter: "none",
  opacity: 1,
  transition: "filter 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
}

type OptimisticImageProps = {
  src: string
  /** When true, full clarity (permanent CDN URL). When false, blob preview while uploading. */
  resolved: boolean
  alt?: string
  className?: string
}

export function OptimisticImage({ src, resolved, alt = "", className = "" }: OptimisticImageProps) {
  return (
    <img src={src} alt={alt} className={className} style={resolved ? resolvedImageStyle : optimisticImageStyle} />
  )
}

/** Create a local blob URL for instant optimistic UI; caller must revoke when done. */
export function createOptimisticBlobUrl(file: File): string {
  return URL.createObjectURL(file)
}
