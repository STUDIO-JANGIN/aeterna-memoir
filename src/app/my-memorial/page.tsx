"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase/browser"
import { raceWithTimeout } from "@/lib/raceWithTimeout"
import { deleteMemorialAction } from "@/app/actions/deleteMemorial"
import { listMyMemorialsAction, type MyMemorialSummary } from "@/app/actions/listMyMemorials"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { LandingFooter } from "@/components/LandingFooter"

type Phase = "loading" | "empty" | "choose" | "error"

export default function MyMemorialPage() {
  const { app: t } = useLandingLocale()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("loading")
  const [memorials, setMemorials] = useState<MyMemorialSummary[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MyMemorialSummary | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteInputRef = useRef<HTMLInputElement>(null)

  const loadMemorials = useCallback(async () => {
    const res = await listMyMemorialsAction()
    if (!res.ok) {
      if (res.error === "SIGN_IN_REQUIRED") {
        router.replace("/sign-in?next=%2Fmy-memorial")
        return
      }
      setMessage(res.error)
      setPhase("error")
      return
    }
    if (res.memorials.length === 0) {
      setPhase("empty")
      return
    }
    setMemorials(res.memorials)
    setPhase("choose")
  }, [router])

  const handleSignOut = useCallback(async () => {
    setSigningOut(true)
    const SIGN_OUT_MS = 10_000
    try {
      const out = await raceWithTimeout(
        supabase.auth.signOut({ scope: "local" }),
        SIGN_OUT_MS,
        "timeout" as const,
      )
      if (out === "timeout") {
        window.location.assign("/")
        return
      }
      if (out.error) {
        setMessage(out.error.message)
      }
      router.push("/")
    } finally {
      setSigningOut(false)
    }
  }, [router])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session?.user) {
          router.replace("/sign-in?next=%2Fmy-memorial")
          return
        }
        setSignedIn(true)
        await loadMemorials()
      } catch (e) {
        if (!cancelled) {
          setMessage(e instanceof Error ? e.message : t.myMemorial.somethingWrong)
          setPhase("error")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadMemorials, router])

  const showSignOut =
    signedIn && (phase === "empty" || phase === "choose" || phase === "error")

  const canSubmitDelete = deleteConfirm.trim().toLowerCase() === t.myMemorial.deletePlaceholder

  useEffect(() => {
    if (!deleteTarget || typeof document === "undefined") return
    const t = window.setTimeout(() => deleteInputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [deleteTarget])

  useEffect(() => {
    if (!deleteTarget) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDeleteTarget(null)
        setDeleteConfirm("")
        setDeleteError(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [deleteTarget])

  useEffect(() => {
    if (!deleteTarget) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [deleteTarget])

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !canSubmitDelete || deleteBusy) return
    setDeleteBusy(true)
    setDeleteError(null)
    const slug = deleteTarget.slug
    try {
      const res = await deleteMemorialAction(slug)
      if (!res.ok) {
        setDeleteError(res.error)
        setDeleteBusy(false)
        return
      }
      setDeleteTarget(null)
      setDeleteConfirm("")
      const next = memorials.filter((m) => m.slug !== slug)
      setMemorials(next)
      if (next.length === 0) setPhase("empty")
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t.myMemorial.errorFallback)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-landing">
      <div
        className={`relative flex flex-1 flex-col items-center justify-center px-6 md:px-12 text-center ${
          showSignOut ? "pt-24 pb-12 md:pt-28 md:pb-16" : "py-20 md:py-28"
        }`}
      >
      {showSignOut ? (
        <div className="fixed top-0 right-0 z-[100] flex justify-end gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className="min-h-[40px] rounded-full border border-white/15 bg-[#030303]/60 px-4 text-[11px] font-medium tracking-[0.14em] uppercase text-[var(--landing-text-body)] backdrop-blur-sm hover:bg-white/[0.08] hover:text-[var(--aeterna-gold)] transition-colors disabled:opacity-50"
          >
            {signingOut ? t.common.signingOut : t.common.signOut}
          </button>
        </div>
      ) : null}

      <p className="text-landing-label text-[var(--aeterna-gold)] mb-6">{t.myMemorial.kicker}</p>

      {phase === "loading" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-4">{t.myMemorial.loadingTitle}</h1>
          <p className="text-landing-body max-w-md">{t.myMemorial.loadingBody}</p>
        </>
      )}

      {phase === "empty" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-6">{t.myMemorial.emptyTitle}</h1>
          <p className="text-landing-body max-w-lg mb-10">{t.myMemorial.emptyBody}</p>
          <Link href="/create?new=1" className="btn-landing-primary min-h-[52px] justify-center">
            {t.myMemorial.createCta}
          </Link>
          <Link
            href="/"
            className="mt-8 block text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            {t.common.backToHome}
          </Link>
        </>
      )}

      {phase === "choose" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-4">{t.myMemorial.listTitle}</h1>
          <p className="text-landing-body max-w-lg mb-10">{t.myMemorial.listBody}</p>
          <ul className="card-landing-airy w-full max-w-md text-left">
            {memorials.map((m) => (
              <li
                key={m.slug}
                className="flex items-stretch border-b border-white/[0.08] last:border-b-0"
              >
                <Link
                  href={`/p/${encodeURIComponent(m.slug)}`}
                  className="min-w-0 flex-1 px-5 py-4 sm:px-6 text-left text-[var(--landing-text-hero)] hover:bg-white/[0.04] transition-colors"
                >
                  <span className="font-[var(--font-serif)] text-lg block truncate">
                    {m.name?.trim() || "Memorial"}
                  </span>
                  <span className="block text-xs text-[var(--landing-text-muted)] mt-1 font-mono truncate">
                    /p/{m.slug}
                  </span>
                </Link>
                <div className="flex items-center gap-1 shrink-0 pr-2 sm:pr-3">
                  <Link
                    href={`/p/${encodeURIComponent(m.slug)}/admin`}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-white/15 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--aeterna-gold)] hover:bg-white/[0.06] transition-colors"
                  >
                    Admin
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteConfirm("")
                      setDeleteTarget(m)
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-[var(--landing-text-muted)] hover:border-red-400/50 hover:bg-red-950/40 hover:text-red-200/90 transition-colors"
                    aria-label={t.myMemorial.deleteMemorialAria(m.name?.trim() || m.slug)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-10 text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            {t.common.backToHome}
          </Link>
        </>
      )}

      {deleteTarget &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-memorial-title"
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
            onClick={() => {
              if (deleteBusy) return
              setDeleteTarget(null)
              setDeleteConfirm("")
              setDeleteError(null)
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0a0a0a]/98 px-5 py-6 text-left shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="delete-memorial-title" className="font-[var(--font-serif)] text-lg text-[var(--landing-text-hero)]">
                {t.myMemorial.deleteTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--landing-text-body)]">
                {t.myMemorial.deleteBody(deleteTarget.name?.trim() || t.common.memorialFallbackName)}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--aeterna-gold-muted)]">
                <span className="normal-case tracking-normal">
                  {t.myMemorial.typeDelete}{" "}
                  <span className="text-[var(--aeterna-gold)] font-mono">{t.myMemorial.deletePlaceholder}</span>
                  {t.myMemorial.afterTypeWord ? ` ${t.myMemorial.afterTypeWord}` : ""}
                </span>
              </p>
              <input
                ref={deleteInputRef}
                type="text"
                value={deleteConfirm}
                onChange={(e) => {
                  setDeleteConfirm(e.target.value)
                  setDeleteError(null)
                }}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={t.myMemorial.deletePlaceholder}
                className="mt-2 w-full rounded-xl border border-white/[0.12] bg-[#030303]/80 px-4 py-3 text-sm text-[var(--landing-text-hero)] placeholder:text-white/25 outline-none focus:border-[var(--aeterna-gold)]/40 focus:ring-1 focus:ring-[var(--aeterna-gold)]/25"
              />
              {deleteError ? (
                <p className="mt-3 text-sm text-red-300/90" role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={() => {
                    setDeleteTarget(null)
                    setDeleteConfirm("")
                    setDeleteError(null)
                  }}
                  className="min-h-[44px] rounded-full border border-white/15 px-5 text-sm font-medium text-[var(--landing-text-body)] hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  disabled={!canSubmitDelete || deleteBusy}
                  onClick={() => void handleConfirmDelete()}
                  className="min-h-[44px] rounded-full border border-red-500/50 bg-red-950/50 px-5 text-sm font-medium text-red-100 hover:bg-red-900/60 transition-colors disabled:opacity-40 disabled:hover:bg-red-950/50"
                >
                  {deleteBusy ? t.common.deleting : t.myMemorial.deleteCta}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {phase === "error" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-6">{t.myMemorial.errorTitle}</h1>
          <p className="text-landing-body max-w-lg mb-10">{message ?? t.myMemorial.errorFallback}</p>
          <button
            type="button"
            onClick={() => {
              setPhase("loading")
              void loadMemorials()
            }}
            className="btn-landing-outline-gold"
          >
            {t.common.tryAgain}
          </button>
          <Link
            href="/"
            className="mt-8 block text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            {t.common.backToHome}
          </Link>
        </>
      )}
      </div>
      <LandingFooter />
    </div>
  )
}
