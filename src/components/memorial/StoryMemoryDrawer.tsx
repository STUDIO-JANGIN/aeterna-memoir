"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ARTISAN_SPRING, artisanPresence } from "@/lib/artisanMotion"
import { ArrowUp } from "lucide-react"
import { supabase } from "@/lib/supabase/browser"
import { heartCommentAction, unheartCommentAction } from "@/app/actions/heartComment"
import {
  addStoryCommentAction,
  getStoryCommentsAction,
  type StoryCommentPublic,
} from "@/app/actions/storyComments"
import { coerceIdString, parseUuidString } from "@/lib/uuid"

type Story = {
  id: string
  author_name: string | null
  story_text: string | null
  image_url: string | null
  thumb_url?: string | null
}

function formatShortTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return "now"
  const m = Math.floor(sec / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
  /** Memorial event UUID — required for `comments.event_id`. */
  eventId: string
  sessionUser: { id: string; email: string | null } | null
  likesCount: number
  isHearted: boolean
  /** While a heart request is in flight (avoid double taps). */
  heartBusy?: boolean
  onClose: () => void
  onHeart: () => void
  showAiFilmMessaging?: boolean
  /** localStorage key for default commenter name, e.g. memorial slug */
  nameStorageKey: string
}) {
  const [isDesktop, setIsDesktop] = useState(false)
  const [comments, setComments] = useState<StoryCommentPublic[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [authorName, setAuthorName] = useState("")
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [heartedCommentIds, setHeartedCommentIds] = useState<Set<string>>(new Set())
  const [commentHeartBusyId, setCommentHeartBusyId] = useState<string | null>(null)

  /** stories.id from DB (UUID text) — never pass objects/numbers raw into server actions */
  const photoStoryId = useMemo(() => coerceIdString(story?.id), [story?.id])
  const memorialEventId = useMemo(() => coerceIdString(eventId), [eventId])

  const commentHeartsStorageKey = useMemo(
    () =>
      nameStorageKey && photoStoryId
        ? `aeterna_comment_hearts_${nameStorageKey}_${photoStoryId}`
        : null,
    [nameStorageKey, photoStoryId],
  )

  const canPostComment = useMemo(
    () => Boolean(parseUuidString(photoStoryId) && parseUuidString(memorialEventId)),
    [photoStoryId, memorialEventId],
  )

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const fn = () => setIsDesktop(mq.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`aeterna_tribute_name_${nameStorageKey}`)
      if (stored) setAuthorName(stored)
    } catch {
      // ignore
    }
  }, [nameStorageKey])

  useEffect(() => {
    if (!commentHeartsStorageKey || typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(commentHeartsStorageKey)
      if (!raw) return
      const ids = JSON.parse(raw) as unknown
      if (Array.isArray(ids)) {
        setHeartedCommentIds(new Set(ids.map((id) => String(id)).filter(Boolean)))
      }
    } catch {
      // ignore
    }
  }, [commentHeartsStorageKey])

  const loadComments = useCallback(
    async (opts?: { silent?: boolean }) => {
      const eid = parseUuidString(memorialEventId)
      const sid = parseUuidString(photoStoryId)
      if (!eid || !sid) {
        if (!opts?.silent) setCommentsLoading(false)
        setComments([])
        return
      }
      if (!opts?.silent) setCommentsLoading(true)
      try {
        const res = await getStoryCommentsAction(sid, eid)
        if (res.ok) {
          setComments(res.comments)
        } else {
          console.error("[StoryMemoryDrawer] loadComments failed", {
            photoId: sid,
            eventId: eid,
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
    const eid = parseUuidString(memorialEventId)
    const sid = parseUuidString(photoStoryId)
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

  const persistName = useCallback((name: string) => {
    try {
      localStorage.setItem(`aeterna_tribute_name_${nameStorageKey}`, name)
    } catch {
      // ignore
    }
  }, [nameStorageKey])

  const handleSend = useCallback(async () => {
    const rawPhoto = photoStoryId
    const rawEvent = memorialEventId
    if (!rawPhoto || typeof rawPhoto !== "string" || !rawPhoto.trim()) {
      console.error("Invalid Photo ID:", rawPhoto)
      window.alert("Error: Photo ID missing")
      setSendError("Error: Photo ID missing")
      return
    }
    if (!rawEvent || typeof rawEvent !== "string" || !rawEvent.trim()) {
      console.error("Invalid Event ID:", rawEvent)
      setSendError("Error: Event ID missing")
      return
    }
    const photoId = parseUuidString(rawPhoto)
    const evId = parseUuidString(rawEvent)
    if (!photoId) {
      console.error("Invalid Photo ID (not UUID):", rawPhoto)
      window.alert("Error: Photo ID missing")
      setSendError("Error: Photo ID missing")
      return
    }
    if (!evId) {
      setSendError("Error: Event ID missing")
      return
    }
    if (!body.trim()) return
    setSendError(null)
    setSending(true)
    const visitorName =
      authorName.trim() || (sessionUser ? "Guest" : "Anonymous")
    try {
      const res = await addStoryCommentAction(photoId, evId, visitorName, body)
      if (res.ok) {
        setBody("")
        persistName(authorName.trim())
        await loadComments({ silent: true })
      } else {
        setSendError(res.error)
        if (res.error === "Error: Photo ID missing" || res.error === "Error: Event ID missing") {
          window.alert(res.error)
        }
      }
    } catch (err) {
      console.error("[StoryMemoryDrawer] addStoryComment", err)
      setSendError(err instanceof Error ? err.message : "Could not send your message.")
    } finally {
      setSending(false)
    }
  }, [photoStoryId, memorialEventId, authorName, body, persistName, sessionUser, loadComments])

  const handleCommentHeart = useCallback(
    async (commentId: string) => {
      const id = String(commentId)
      if (!id || commentHeartBusyId) return
      setCommentHeartBusyId(id)
      try {
        const removing = heartedCommentIds.has(id)
        const result = removing ? await unheartCommentAction(id) : await heartCommentAction(id)
        if (result.ok) {
          setHeartedCommentIds((prev) => {
            const next = new Set(prev)
            if (removing) next.delete(id)
            else next.add(id)
            if (commentHeartsStorageKey && typeof window !== "undefined") {
              try {
                localStorage.setItem(commentHeartsStorageKey, JSON.stringify([...next]))
              } catch {
                // ignore
              }
            }
            return next
          })
          setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, likes_count: result.likesCount } : c)),
          )
        }
      } finally {
        setCommentHeartBusyId(null)
      }
    },
    [commentHeartBusyId, heartedCommentIds, commentHeartsStorageKey],
  )

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
        aria-label="Close"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-drawer-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-[var(--border-gold-subtle)] border-b-0 bg-[var(--once-bg-elevated)] shadow-[0_-24px_80px_rgba(0,0,0,0.45)] md:max-h-[85vh] md:max-w-lg md:rounded-2xl md:border-b md:shadow-2xl"
        initial={isDesktop ? artisanPresence.initial : { y: "100%" }}
        animate={isDesktop ? artisanPresence.animate : { y: 0, opacity: 1 }}
        exit={isDesktop ? artisanPresence.exit : { y: "100%" }}
        transition={ARTISAN_SPRING}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Mobile drag handle + swipe area */}
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

          <div className="flex min-h-0 flex-1 flex-col md:max-h-[85vh]">
            {/* Header — close (desktop inline; mobile top-right) */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-gold-subtle)]/30 px-3 py-2 md:px-4">
              <p id="memory-drawer-title" className="truncate font-[var(--font-serif)] text-sm text-[var(--aeterna-gold)]">
                Memory
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-[var(--once-text-secondary)] hover:bg-white/10 hover:text-[var(--once-text-primary)]"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image */}
            <div className="relative shrink-0 bg-[var(--once-bg)] md:max-h-[38vh]">
              {story.image_url ? (
                <motion.img
                  layoutId={`story-img-${story.id}`}
                  src={story.thumb_url ?? story.image_url}
                  alt=""
                  className="mx-auto max-h-[32vh] w-full object-contain md:max-h-[38vh]"
                  transition={ARTISAN_SPRING}
                  draggable={false}
                />
              ) : (
                <div className="flex h-36 items-center justify-center text-sm text-[var(--aeterna-body)]">No image</div>
              )}
            </div>

            {/* Scroll: story, hearts, and shared memories — scroll-touch + touch-pan-y for smooth mobile momentum */}
            <div className="scroll-touch memorial-drawer-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 pb-2 pt-3">
              <p className="font-[var(--font-serif)] text-base text-[var(--aeterna-gold)]">{story.author_name ?? "Anonymous"}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--once-text-primary)]">{story.story_text ?? ""}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-gold-subtle)]/50 bg-[#030303]/20 px-3 py-2.5">
                <motion.button
                  type="button"
                  onClick={onHeart}
                  disabled={heartBusy}
                  className={`rounded-full p-2 disabled:opacity-50 ${isHearted ? "text-red-400" : "text-[var(--once-text-secondary)] hover:text-red-400/90"}`}
                  whileTap={{ scale: heartBusy ? 1 : 1.15 }}
                  aria-label={isHearted ? "Remove heart" : "Heart this memory"}
                >
                  <svg className="h-7 w-7" fill={isHearted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </motion.button>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-[var(--once-text-primary)]">{likesCount}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">Hearts</p>
                </div>
                {showAiFilmMessaging && (
                  <p className="ml-auto max-w-[12rem] text-[10px] leading-snug text-[var(--aeterna-gold-muted)]">
                    Loved photos may be featured in the film.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)]">
                  Share a memory
                </p>
                {commentsLoading ? (
                  <p className="text-xs text-[var(--once-text-muted)]">Loading…</p>
                ) : comments.length === 0 ? (
                  <p className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs italic text-[var(--once-text-muted)]">
                    No messages yet — you can share a memory below.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {comments.map((c) => {
                      const cid = String(c.id)
                      const count = c.likes_count ?? 0
                      const isHearted = heartedCommentIds.has(cid)
                      const busy = commentHeartBusyId === cid
                      return (
                        <li
                          key={c.id}
                          className="group flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm"
                        >
                          <div className="min-w-0 flex-1 leading-snug">
                            <span className="font-medium text-[var(--once-text-primary)]">{c.visitor_name}</span>
                            <span className="text-[var(--once-text-muted)]"> — </span>
                            <span className="text-[var(--once-text-primary)]">{c.text}</span>
                            <span className="text-[var(--once-text-muted)]"> — </span>
                            <span className="whitespace-nowrap text-xs text-[var(--aeterna-gold-muted)] tabular-nums">
                              {formatShortTime(c.created_at)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleCommentHeart(cid)}
                            disabled={busy}
                            className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-1 py-0.5 transition disabled:opacity-50 ${
                              isHearted
                                ? "text-red-400"
                                : "text-[var(--once-text-muted)] hover:bg-white/[0.06] hover:text-red-400/90"
                            }`}
                            aria-label={isHearted ? "Remove heart from this message" : "Heart this message"}
                            title={isHearted ? "Remove heart" : "Heart"}
                          >
                            <svg className="h-4 w-4" fill={isHearted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
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
                )}
              </div>
            </div>

            {/* Composer — chat bubble style */}
            <form
              className="shrink-0 border-t border-[var(--border-gold-subtle)]/40 bg-[var(--once-bg)]/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              onSubmit={(e) => {
                e.preventDefault()
                if (sending || !body.trim() || !canPostComment) return
                void handleSend()
              }}
            >
              <label htmlFor="tribute-author" className="sr-only">
                Your name
              </label>
              <input
                id="tribute-author"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={60}
                className="mb-2 w-full rounded-xl border border-[var(--border-gold-subtle)]/50 bg-[var(--aeterna-charcoal)]/80 px-3 py-2 text-xs text-[var(--once-text-primary)] placeholder:text-[var(--once-text-muted)] focus:border-[var(--aeterna-gold-muted)] focus:outline-none"
              />
              <div className="flex items-end gap-2 rounded-2xl border border-[var(--border-gold-subtle)]/60 bg-[var(--aeterna-charcoal-soft)]/90 pl-3 pr-1 py-1.5">
                <label htmlFor="tribute-body" className="sr-only">
                  Share a memory
                </label>
                <textarea
                  id="tribute-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, 500))}
                  rows={1}
                  placeholder="Write a few words…"
                  className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-sm text-[var(--once-text-primary)] placeholder:text-[var(--once-text-muted)] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      if (!sending && body.trim() && canPostComment) void handleSend()
                    }
                  }}
                />
                <span className="mb-2 shrink-0 text-[10px] tabular-nums text-[var(--once-text-muted)]">{body.length}/500</span>
                <button
                  type="submit"
                  disabled={sending || !body.trim() || !canPostComment}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] shadow-md transition hover:bg-[var(--aeterna-gold-light)] disabled:opacity-40"
                  aria-label="Send"
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>
              {sendError && <p className="mt-2 text-center text-xs text-red-400/90">{sendError}</p>}
            </form>
          </div>
      </motion.div>
    </motion.div>
  )
}
