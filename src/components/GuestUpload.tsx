"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { createStoryAction } from "@/app/actions/createStory"

const MAX_CLIENT_BYTES = 15 * 1024 * 1024

export type GuestUploadProps = {
  eventId?: string
  slug?: string
  open: boolean
  onClose?: () => void
  onSubmitted?: () => void
}

export function GuestUpload({ eventId, slug, open, onClose, onSubmitted }: GuestUploadProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [authorName, setAuthorName] = useState("")
  const [storyText, setStoryText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)

  const prevValidRef = useRef(false)
  /** After a failed upload, blocks auto-retry until the guest edits a field. */
  const blockAutoRef = useRef(false)
  const uploadKeyRef = useRef<string | null>(null)
  const runIdRef = useRef(0)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setAuthorName("")
    setStoryText("")
    setFile(null)
    setProgress(0)
    prevValidRef.current = false
    blockAutoRef.current = false
    uploadKeyRef.current = null
    runIdRef.current++
    stopProgress()
  }, [open, stopProgress])

  useEffect(() => {
    prevValidRef.current = false
  }, [file])

  const validateAndSetFile = useCallback((f: File | null) => {
    if (!f) return
    blockAutoRef.current = false
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).")
      return
    }
    if (f.size > MAX_CLIENT_BYTES) {
      setError("That file is too large. Try an image under 15MB.")
      return
    }
    setError(null)
    setFile(f)
  }, [])

  const tryUpload = useCallback(() => {
    if (!file || !authorName.trim() || !storyText.trim()) return
    const key = `${file.name}|${file.size}|${authorName.trim()}|${storyText.trim()}`
    if (uploadKeyRef.current === key) return

    uploadKeyRef.current = key
    runIdRef.current += 1
    const myRun = runIdRef.current

    const fd = new FormData()
    fd.set("author_name", authorName.trim())
    fd.set("story_text", storyText.trim())
    fd.set("image", file)
    if (slug) fd.set("slug", slug)
    if (eventId) fd.set("eventId", eventId)

    setProgress(8)
    stopProgress()
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => (p < 90 ? Math.min(p + 7, 90) : p))
    }, 160)

    startTransition(async () => {
      try {
        await createStoryAction(fd)
        if (myRun !== runIdRef.current) return
        stopProgress()
        setProgress(100)
        onSubmitted?.()
        onClose?.()
      } catch (err) {
        console.error(err)
        uploadKeyRef.current = null
        if (myRun === runIdRef.current) {
          prevValidRef.current = false
          blockAutoRef.current = true
          setError("We couldn’t save your story. Please try again.")
          setProgress(0)
        }
      } finally {
        if (myRun === runIdRef.current) stopProgress()
      }
    })
  }, [file, authorName, storyText, slug, eventId, onSubmitted, onClose, startTransition, stopProgress])

  useEffect(() => {
    const valid = !!(file && authorName.trim() && storyText.trim())
    if (valid && !prevValidRef.current && !blockAutoRef.current) {
      prevValidRef.current = true
      tryUpload()
    } else if (!valid) {
      prevValidRef.current = false
    }
  }, [file, authorName, storyText, tryUpload])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) validateAndSetFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer.files?.[0]
    if (f) validateAndSetFile(f)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!open) return null

  const showProgress = pending || progress > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--aeterna-charcoal)]/90 backdrop-blur-xl p-6">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-white p-8 shadow-[var(--shadow-deep)]">
        <p className="font-serif text-[11px] uppercase tracking-[0.32em] text-[var(--aeterna-gold)] mb-2 text-center">
          Share a Story
        </p>
        <h2 className="text-2xl md:text-3xl mb-6 text-center font-light tracking-tight">
          Add a Spark of Memory — and a few words
        </h2>

        {error && (
          <p className="mb-4 text-xs text-[#f0c4c4] bg-[#030303]/30 border border-[rgba(197,160,89,0.35)] rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {showProgress && (
          <div
            className="mb-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--aeterna-gold)] transition-[width] duration-200 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <div className="space-y-6 font-serif text-white">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-2">
              Your name
            </label>
            <input
              value={authorName}
              onChange={(e) => {
                blockAutoRef.current = false
                setAuthorName(e.target.value)
              }}
              required
              disabled={pending}
              placeholder="e.g. Daughter, grandson, friend"
              className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-3 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors placeholder:text-white/40 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-2">
              Story / memory
            </label>
            <textarea
              value={storyText}
              onChange={(e) => {
                blockAutoRef.current = false
                setStoryText(e.target.value)
              }}
              required
              rows={4}
              disabled={pending}
              placeholder="Share a short story, a moment you remember, or a few gentle words."
              className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-3 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors placeholder:text-white/40 resize-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-2">
              Photo
            </label>
            <label
              onDrop={onDrop}
              onDragOver={onDragOver}
              className={`mt-1 flex flex-col items-center justify-center gap-2 w-full rounded-[32px] border border-dashed border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/40 px-4 py-6 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
                pending ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[var(--aeterna-gold)]/80 hover:bg-[var(--aeterna-charcoal-soft)]/80"
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.26em] text-[var(--aeterna-gold-muted)]">
                Gentle light for your words
              </span>
              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-[10px] font-serif tracking-[0.18em] uppercase">
                Add a Spark of Memory
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={pending}
                className="hidden"
                onChange={onInputChange}
              />
            </label>
            <p className="mt-2 text-[11px] text-[var(--aeterna-gold-muted)] font-sans">
              {file ? file.name : "JPG or PNG, ideally under 10MB."}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 py-3 rounded-[32px] border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] text-sm hover:bg-[var(--aeterna-gold-pale)]/60 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
