"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { AppStrings } from "@/lib/appTranslations"
import { TRIBUTE_CLIP_MAX_IMAGES } from "@/lib/tributeFilmConfig"

export type EternalFilmUploaderProps = {
  memorial: Pick<AppStrings["memorial"], "eternalFilmClipPhotoLimitAlert" | "eternalFilmUploaderChoose">
  /** Called whenever the accepted image list changes (always length 0–{@link TRIBUTE_CLIP_MAX_IMAGES}). */
  onFilesChange?: (files: File[]) => void
  className?: string
}

function mergeImageFiles(
  existing: File[],
  incoming: File[],
  max: number
): { next: File[]; blocked: boolean } {
  const images = incoming.filter((f) => f.type.startsWith("image/"))
  const next = [...existing]
  let blocked = false
  for (const f of images) {
    if (next.length >= max) {
      blocked = true
      break
    }
    next.push(f)
  }
  return { next: next.slice(0, max), blocked }
}

export function EternalFilmUploader({ memorial, onFilesChange, className = "" }: EternalFilmUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const max = TRIBUTE_CLIP_MAX_IMAGES

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u))
  }, [previewUrls])

  const commit = useCallback(
    (next: File[]) => {
      setFiles(next)
      onFilesChange?.(next)
    },
    [onFilesChange],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (!list?.length) return
    const picked = Array.from(list)
    const { next, blocked } = mergeImageFiles(files, picked, max)
    if (blocked) {
      window.alert(memorial.eternalFilmClipPhotoLimitAlert)
    }
    commit(next)
    e.target.value = ""
  }

  const removeAt = (index: number) => {
    const next = files.filter((_, i) => i !== index)
    commit(next)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={memorial.eternalFilmUploaderChoose}
        onChange={onInputChange}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--aeterna-gold)]/35 bg-white/[0.04] px-4 text-sm text-[var(--landing-text-title)] ring-1 ring-white/[0.06] transition hover:bg-white/[0.07]"
        >
          {memorial.eternalFilmUploaderChoose}
        </button>
        <span className="text-landing-body tabular-nums text-[var(--aeterna-gold-muted)]">
          {files.length} / {max}
        </span>
      </div>
      {files.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-white/[0.1] bg-[#030303]/80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrls[i] ?? ""} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
