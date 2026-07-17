"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ARTISAN_SPRING, artisanPresence } from "@/lib/artisanMotion"
import { ArrowUp } from "lucide-react"
import { supabase } from "@/lib/supabase/browser"
import { heartCommentAction } from "@/app/actions/heartComment"
import {
  addStoryCommentAction,
  getStoryCommentsAction,
  type StoryCommentPublic,
} from "@/app/actions/storyComments"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { LegalFormCaption } from "@/components/LegalFormCaption"
import { formatMemorialCommentTime } from "@/lib/formatDate"
import { bcp47ForLandingLocale } from "@/lib/invitePdfLocale"
import { coerceIdString, parseUuidString } from "@/lib/uuid"

function sameCommentId(a: string, b: string): boolean {
  const pa = parseUuidString(a) ?? parseUuidString(String(a))
  const pb = parseUuidString(b) ?? parseUuidString(String(b))
  if (pa && pb) return pa === pb
  return String(a).trim() === String(b).trim()
}

function canonicalCommentId(raw: string): string | null {
  return parseUuidString(raw) ?? parseUuidString(String(raw))
}

type Story = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  thumb_url?: string | null
}

const DRAG_CLOSE = 100

export function StoryMemoryDrawer({
  story,
  eventId,
  sessionUser,
  likesCount,
  isHearted,
  heartBusy = false,
  onClose,
  onHeart,
  showAiFilmMessaging = false,
  nameStorageKey,
}: {
  story: Story
  eventId: string
  sessionUser: { id: string; email: string | null } | null
  likesCount: number
  isHearted: boolean
  heartBusy?: boolean
  onClose: () => void
  onHeart: () => void
  showAiFilmMessaging?: boolean
  nameStorageKey: string
}) {
  const { app, locale } = useLandingLocale()
  const m = app.memorial
  const common = app.common
  const localeTag = bcp47ForLandingLocale(locale)

  const [isDesktop, setIsDesktop] = useState(false)
  const [comments, setComments] = useState<StoryCommentPublic[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [authorName, setAuthorName] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [heartedCommentIds, setHeartedCommentIds] = useState<Set<string>>(new Set())
  const [commentHeartBusyId, setCommentHeartBusyId] = useState<string | null>(null)
  const composerRef = useRef<HTMLFormElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const photoStoryId = coerceIdString(story?.id)
  const memorialEventId = coerceIdString(eventId)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const fn = () => setIsDesktop(mq.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`aeterna_tribute_name_${nameStorageKey}`)
      if (stored) setAuthorName(stored)
    } catch {
      // ignore
    }
  }, [nameStorageKey])

  const loadComments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!photoStoryId.trim() || !memorialEventId.trim()) {
        if (!opts?.silent) setCommentsLoading(false)
        setComments([])
        return
      }
      if (!opts?.silent) setCommentsLoading(true)
      try {
        const res = await getStoryCommentsAction(photoStoryId, memorialEventId)
        if (res.ok) {
          setComments((prev) => {
            if (opts?.silent && res.comments.length === 0 && prev.length > 0) return prev
            return res.comments
          })
        } else {
          console.error("[StoryMemoryDrawer] loadComments failed", {
            photoId: photoStoryId,
            eventId: memorialEventId,
            error: res.error,
          })
          setComments([])
        }
      } finally {
        if (!opts?.silent) setCommentsLoading(false)
      }
    },
    [photoStoryId, memorialEventId],
  )

  useEffect(() => {
    void loadComments()
  }, [loadComments])

  useEffect(() => {
    const sid = parseUuidString(photoStoryId)
    const eid = parseUuidString(memorialEventId)
    if (!eid || !sid) return
    const channel = supabase
      .channel(`comments-${eid}-${sid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `photo_id=eq.${sid}`,
        },
        () => {
          void loadComments({ silent: true })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [memorialEventId, photoStoryId, loadComments])

  const persistName = useCallback(
    (name: string) => {
      try {
        localStorage.setItem(`aeterna_tribute_name_${nameStorageKey}`, name)
      } catch {
        // ignore
      }
    },
    [nameStorageKey],
  )

  const handleSend = useCallback(async () => {
    const trimmed = body.trim()
    if (!trimmed || sending) return
    if (!photoStoryId.trim() || !memorialEventId.trim()) {
      setSendError("This memory could not be loaded. Please close and try again.")
      return
    }

    setSendError(null)
    setSending(true)
    const visitorName =
      authorName.trim() || (sessionUser ? m.storyDrawerGuestName : m.storyDrawerAnonymous)

    try {
      const res = await addStoryCommentAction(photoStoryId, memorialEventId, visitorName, trimmed)
      if (res.ok) {
        setBody("")
        persistName(authorName.trim())
        setComments((prev) => {
          const exists = prev.some((c) => sameCommentId(c.id, res.comment.id))
          return exists ? prev : [...prev, res.comment]
        })
        void loadComments({ silent: true })
      } else {
        setSendError(res.error)
      }
    } catch (err) {
      console.error("[StoryMemoryDrawer] addStoryComment", err)
      setSendError(err instanceof Error ? err.message : "Could not send your message.")
    } finally {
      setSending(false)
    }
  }, [
    photoStoryId,
    memorialEventId,
    authorName,
    body,
    persistName,
    sessionUser,
    loadComments,
    m,
    sending,
  ])

  const handleCommentHeart = useCallback(
    async (rawCommentId: string) => {
      const id = canonicalCommentId(rawCommentId)
      if (!id) return
      if (commentHeartBusyId === id) return

      setCommentHeartBusyId(id)

      const bump = (delta: number) => {
        setComments((prev) =>
          prev.map((c) => {
            if (!sameCommentId(c.id, id)) return c
            return { ...c, likes_count: Math.max(0, (c.likes_count ?? 0) + delta) }
          }),
        )
      }

      bump(1)

      try {
        const result = await heartCommentAction(id)
        if (result.ok) {
          setHeartedCommentIds((prev) => {
            const next = new Set(prev)
            next.add(id)
            return next
          })
          setComments((prev) =>
            prev.map((c) => {
              if (!sameCommentId(c.id, id)) return c
              return { ...c, likes_count: result.likesCount }
            }),
          )
        } else {
          bump(-1)
          console.warn("[StoryMemoryDrawer] heartCommentAction failed", result.error)
        }
      } catch (e) {
        bump(-1)
        console.warn("[StoryMemoryDrawer] heartCommentAction threw", e)
      } finally {
        setCommentHeartBusyId(null)
      }
    },
    [commentHeartBusyId],
  )

  const canSubmit = body.trim().length > 0 && !sending

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
      initial={artisanPresence.initial}
      animate={artisanPresence.animate}
      exit={artisanPresence.exit}
      transition={ARTISAN_SPRING}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#030303]/65 backdrop-blur-[3px]"
        aria-label={common.close}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-drawer-title"
        className="relative z-10 grid max-h-[92dvh] w-full max-w-full grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-[1.75rem] border border-[var(--border-gold-subtle)] border-b-0 bg-[var(--once-bg-elevated)] shadow-[0_-24px_80px_rgba(0,0,0,0.45)] md:max-h-[85vh] md:max-w-lg md:rounded-2xl md:border-b md:shadow-2xl"
        initial={isDesktop ? artisanPresence.initial : { y: "100%" }}
        animate={isDesktop ? artisanPresence.animate : { y: 0, opacity: 1 }}
        exit={isDesktop ? artisanPresence.exit : { y: "100%" }}
        transition={ARTISAN_SPRING}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <motion.div
          className="flex shrink-0 cursor-grab flex-col items-center border-b border-[var(--border-gold-subtle)]/40 bg-[var(--once-bg)]/80 py-2 active:cursor-grabbing md:hidden"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.45 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > DRAG_CLOSE || info.velocity.y > 450) onClose()
          }}
        >
          <div className="h-1 w-10 rounded-full bg-white/25" aria-hidden />
        </motion.div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-gold-subtle)]/30 px-3 py-2 md:px-4">
          <p id="memory-drawer-title" className="truncate font-[var(--font-serif)] text-sm text-[var(--aeterna-gold)]">
            {m.storyDrawerTitle}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--once-text-secondary)] hover:bg-white/10 hover:text-[var(--once-text-primary)]"
            aria-label={common.close}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo — shorter on mobile so composer stays on screen */}
        <div className="relative shrink-0 bg-[var(--once-bg)]">
          {story.image_url ? (
            <motion.img
              layoutId={`story-img-${story.id}`}
              src={story.thumb_url ?? story.image_url}
              alt=""
              className="mx-auto max-h-[26vh] w-full object-contain md:max-h-[34vh]"
              transition={ARTISAN_SPRING}
              draggable={false}
            />
          ) : (
            <div className="flex h-28 items-center justify-center text-sm text-[var(--aeterna-body)] md:h-36">
              {m.storyDrawerNoImage}
            </div>
          )}
        </div>

        {/* Scroll: caption, hearts, existing messages only */}
        <div className="scroll-touch min-h-0 overflow-y-auto overscroll-y-contain px-4 py-3">
          <p className="font-[var(--font-serif)] text-base text-[var(--aeterna-gold)]">
            {story.author_name ?? m.storyDrawerAnonymous}
          </p>
          {story.story_text?.trim() ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--once-text-primary)]">{story.story_text}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-gold-subtle)]/50 bg-[#030303]/20 px-3 py-2.5">
            <motion.button
              type="button"
              onClick={onHeart}
              disabled={heartBusy}
              className={`rounded-full p-2 disabled:opacity-50 ${isHearted ? "text-red-400" : "text-[var(--once-text-secondary)] hover:text-red-400/90"}`}
              whileTap={{ scale: heartBusy ? 1 : 1.15 }}
              aria-label={isHearted ? m.storyDrawerHeartAriaRemove : m.storyDrawerHeartAriaAdd}
            >
              <svg className="h-7 w-7" fill={isHearted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </motion.button>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-[var(--once-text-primary)]">{likesCount}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">
                {m.storyDrawerHeartsLabel}
              </p>
            </div>
            {showAiFilmMessaging ? (
              <p className="ml-auto max-w-[12rem] text-[10px] leading-snug text-[var(--aeterna-gold-muted)]">
                {m.storyDrawerAiFilmHint}
              </p>
            ) : null}
          </div>

          {commentsLoading ? (
            <p className="mt-5 text-xs text-[var(--once-text-muted)]">{m.storyDrawerCommentsLoading}</p>
          ) : comments.length > 0 ? (
            <div className="mt-5 pb-1">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)]">
                {m.storyDrawerCommentsHeading}
              </p>
              <ul className="space-y-2.5">
                {comments.map((c) => {
                  const canon = canonicalCommentId(String(c.id))
                  const cid = canon ?? String(c.id).trim()
                  const count = c.likes_count ?? 0
                  const youHearted = canon ? heartedCommentIds.has(canon) : heartedCommentIds.has(cid)
                  const busy = canon ? commentHeartBusyId === canon : commentHeartBusyId === cid
                  const showFilled = youHearted || count > 0
                  return (
                    <li
                      key={c.id}
                      className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <div className="min-w-0 flex-1 leading-snug">
                        <span className="font-medium text-[var(--once-text-primary)]">{c.visitor_name}</span>
                        <span className="text-[var(--once-text-muted)]"> — </span>
                        <span className="text-[var(--once-text-primary)]">{c.text}</span>
                        <span className="text-[var(--once-text-muted)]"> — </span>
                        <span className="whitespace-nowrap text-xs text-[var(--aeterna-gold-muted)] tabular-nums">
                          {formatMemorialCommentTime(c.created_at, localeTag)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCommentHeart(String(c.id))}
                        disabled={busy}
                        className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-0.5 transition disabled:opacity-50 ${
                          showFilled
                            ? "text-red-400"
                            : "text-[var(--once-text-muted)] hover:bg-white/[0.06] hover:text-red-400/90"
                        }`}
                        aria-label={m.storyDrawerCommentHeartAriaAdd}
                        title={m.storyDrawerCommentHeartTitleAdd}
                      >
                        <svg
                          className="h-4 w-4"
                          fill={showFilled ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-[10px] font-medium tabular-nums leading-none">{count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Composer — isolated panel; opaque fields so scroll text never bleeds through */}
        <form
          ref={composerRef}
          className="relative isolate shrink-0 border-t border-[var(--border-gold-subtle)]/50 bg-[var(--once-bg)] px-4 py-3 shadow-[0_-12px_32px_rgba(0,0,0,0.35)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            void handleSend()
          }}
        >
          <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)]">
            {m.storyDrawerComposerLabel}
          </p>

          <label htmlFor="tribute-author" className="sr-only">
            {m.storyDrawerYourNamePlaceholder}
          </label>
          <input
            id="tribute-author"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={m.storyDrawerYourNamePlaceholder}
            maxLength={60}
            autoComplete="name"
            className="mb-2.5 w-full rounded-xl border border-[var(--border-gold-subtle)]/50 bg-[var(--aeterna-charcoal)] px-3 py-2.5 text-sm text-[var(--once-text-primary)] placeholder:text-[var(--once-text-muted)] focus:border-[var(--aeterna-gold-muted)] focus:outline-none"
          />

          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border-gold-subtle)]/60 bg-[var(--aeterna-charcoal)] px-3 py-2">
            <label htmlFor="tribute-body" className="sr-only">
              {m.storyDrawerComposerPlaceholder}
            </label>
            <textarea
              ref={bodyRef}
              id="tribute-body"
              value={body}
              onChange={(e) => {
                setSendError(null)
                setBody(e.target.value.slice(0, 500))
              }}
              rows={2}
              placeholder={m.storyDrawerComposerPlaceholder}
              className="max-h-28 min-h-[48px] flex-1 resize-none rounded-lg bg-[var(--aeterna-charcoal)] py-1.5 text-sm leading-relaxed text-[var(--once-text-primary)] placeholder:text-[var(--once-text-muted)] focus:outline-none"
              onFocus={() => {
                window.setTimeout(() => {
                  composerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                }, 300)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  if (canSubmit) void handleSend()
                }
              }}
            />
            <span className="mb-1 shrink-0 self-end text-[10px] tabular-nums text-[var(--once-text-muted)]">
              {body.length}/500
            </span>
            <button
              type="submit"
              disabled={!canSubmit}
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] shadow-md transition hover:bg-[var(--aeterna-gold-light)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={m.storyDrawerSendAria}
            >
              <ArrowUp className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          {sendError ? <p className="mt-2 text-center text-xs text-red-400/90">{sendError}</p> : null}
          <LegalFormCaption className="mt-2 px-0.5" />
        </form>
      </motion.div>
    </motion.div>
  )
}
