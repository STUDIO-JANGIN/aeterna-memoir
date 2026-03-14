"use client"

import { useState, useTransition, type FormEvent } from "react"
import { createStoryAction } from "@/app/actions/createStory"

type Props = {
  /** 이벤트 UUID (slug 없을 때 사용) */
  eventId?: string
  /** 페이지 slug (우선 사용, 서버에서 eventId 조회) */
  slug?: string
  open: boolean
  onClose?: () => void
  onSubmitted?: () => void
}

export function GuestStoryUploadModal({ eventId, slug, open, onClose, onSubmitted }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    if (slug) formData.set("slug", slug)
    if (eventId) formData.set("eventId", eventId)

    startTransition(async () => {
      setError(null)
      try {
        await createStoryAction(formData)
        form.reset()
        onSubmitted?.()
        onClose?.()
      } catch (err) {
        console.error(err)
        setError("We couldn’t save your story. Please try again.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--aeterna-charcoal)]/90 backdrop-blur-xl p-6">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-white p-8 shadow-[var(--shadow-deep)]">
        <p className="font-serif text-[11px] uppercase tracking-[0.32em] text-[var(--aeterna-gold)] mb-2 text-center">
          Share a Story
        </p>
        <h2 className="text-2xl md:text-3xl mb-6 text-center font-light tracking-tight">
          Add a photo &amp; a few words
        </h2>

        {error && (
          <p className="mb-4 text-xs text-red-400 bg-black/30 border border-red-500/40 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-serif text-white">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-2">
              Your name
            </label>
            <input
              name="author_name"
              required
              placeholder="e.g. Daughter, grandson, friend"
              className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-3 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-2">
              Story / memory
            </label>
            <textarea
              name="story_text"
              required
              rows={4}
              placeholder="Share a short story, a moment you remember, or a few gentle words."
              className="w-full border-b border-[var(--border-gold-subtle)] bg-transparent py-3 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors placeholder:text-white/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)] mb-2">
              Photo
            </label>
            <label className="mt-1 flex flex-col items-center justify-center gap-2 w-full rounded-2xl border border-dashed border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/40 px-4 py-6 cursor-pointer hover:border-[var(--aeterna-gold)]/80 hover:bg-[var(--aeterna-charcoal-soft)]/80 transition-colors">
              <span className="text-[10px] uppercase tracking-[0.26em] text-[var(--aeterna-gold-muted)]">
                Upload a photo to accompany your story
              </span>
              <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-[10px] font-serif tracking-[0.18em] uppercase">
                Choose image
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                required
                className="hidden"
              />
            </label>
            <p className="mt-2 text-[11px] text-[var(--aeterna-gold-muted)] font-sans">
              JPG or PNG, ideally under 10MB.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-[24px] border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] text-sm hover:bg-[var(--aeterna-gold-pale)]/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-3 rounded-[24px] bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-sm shadow-[var(--shadow-gold)] hover:opacity-95 disabled:opacity-60 transition-all"
            >
              {pending ? "Saving…" : "Post story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

