"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { heartStoryAction } from "@/app/actions/heartStory"

export type StoryCardStory = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  likes_count: number | null
  created_at: string
}

type Props = {
  story: StoryCardStory
  initialHearted?: boolean
}

export function StoryCard({ story, initialHearted = false }: Props) {
  const [likesCount, setLikesCount] = useState(Number(story.likes_count ?? 0))
  const [isHearted, setIsHearted] = useState(initialHearted)
  const [pending, setPending] = useState(false)

  const handleHeart = async () => {
    if (pending || isHearted) return
    setPending(true)
    try {
      const result = await heartStoryAction(story.id)
      if (result.ok) {
        setLikesCount(result.likesCount)
        setIsHearted(true)
      }
    } catch (err) {
      console.error("Heart error", err)
    } finally {
      setPending(false)
    }
  }

  return (
    <article className="group rounded-3xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/80 backdrop-blur-lg overflow-hidden shadow-[var(--shadow-deep)] flex flex-col">
      {story.image_url && (
        <div className="relative overflow-hidden">
          <img
            src={story.image_url}
            alt={story.story_text ?? ""}
            className="w-full h-56 object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-sans uppercase tracking-[0.25em] text-[var(--aeterna-gold-muted)]">
            {story.author_name || "Guest"}
          </p>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={handleHeart}
              disabled={pending || isHearted}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/60 text-[var(--aeterna-gold-muted)] hover:border-[var(--aeterna-gold)]/80 hover:text-[var(--aeterna-gold)] disabled:opacity-80 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]/50"
              whileTap={{ scale: 1.35 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label={isHearted ? "Hearted" : "Add heart"}
            >
              <span
                className={`text-lg leading-none ${isHearted ? "text-red-400" : ""}`}
                aria-hidden
              >
                ♥
              </span>
            </motion.button>
            <span className="text-[11px] font-sans text-[var(--aeterna-gold-muted)] tabular-nums min-w-[1.5rem]">
              {likesCount}
            </span>
          </div>
        </div>
        {story.story_text && (
          <p className="text-sm font-sans text-[var(--aeterna-body)] whitespace-pre-line">
            {story.story_text}
          </p>
        )}
        <p className="mt-1 text-[11px] font-sans text-[var(--aeterna-gold-muted)]">
          {new Date(story.created_at).toLocaleString()}
        </p>
      </div>
    </article>
  )
}
