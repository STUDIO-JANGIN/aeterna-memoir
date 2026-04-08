"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { listMyMemorialsAction, type MyMemorialSummary } from "@/app/actions/listMyMemorials"
import { buildOAuthCallbackRedirectUrl } from "@/lib/appUrl"

type Phase =
  | "loading"
  | "signed_out"
  | "empty"
  | "choose"
  | "error"

export default function MyMemorialPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("loading")
  const [memorials, setMemorials] = useState<MyMemorialSummary[]>([])
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadMemorials = useCallback(async () => {
    const res = await listMyMemorialsAction()
    if (!res.ok) {
      if (res.error === "SIGN_IN_REQUIRED") {
        setPhase("signed_out")
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
    if (res.memorials.length === 1) {
      router.replace(`/p/${encodeURIComponent(res.memorials[0].slug)}/admin`)
      return
    }
    setMemorials(res.memorials)
    setPhase("choose")
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
          setPhase("signed_out")
          return
        }
        await loadMemorials()
      } catch (e) {
        if (!cancelled) {
          setMessage(e instanceof Error ? e.message : "Something went wrong.")
          setPhase("error")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadMemorials])

  const handleContinueWithGoogle = async () => {
    setGoogleLoading(true)
    setMessage(null)
    const redirectTo = buildOAuthCallbackRedirectUrl("/my-memorial")
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      })
      if (error) {
        setMessage(error.message)
        setGoogleLoading(false)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign-in could not start.")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-landing px-6 md:px-12 py-20 md:py-28 text-center">
      <p className="text-landing-label text-[var(--aeterna-gold)] mb-6">My memorial</p>

      {phase === "loading" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-4">Loading</h1>
          <p className="text-landing-body max-w-md">Checking your account…</p>
        </>
      )}

      {phase === "signed_out" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-6">Sign in to open your memorial</h1>
          <p className="text-landing-body max-w-lg mb-10">
            Use the same Google account you used when you created your memorial. We&apos;ll take you to your
            family dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md w-full">
            <button
              type="button"
              onClick={handleContinueWithGoogle}
              disabled={googleLoading}
              className="btn-landing-primary w-full sm:w-auto min-h-[52px] justify-center disabled:opacity-60"
            >
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
            <Link
              href="/"
              className="text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
            >
              Back to home
            </Link>
          </div>
          {message ? <p className="mt-6 text-sm text-[var(--aeterna-gold-muted)]">{message}</p> : null}
        </>
      )}

      {phase === "empty" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-6">No memorial yet</h1>
          <p className="text-landing-body max-w-lg mb-10">
            We couldn&apos;t find a memorial linked to this account. Create one to get started.
          </p>
          <Link href="/create" className="btn-landing-primary min-h-[52px] justify-center">
            Create a memorial
          </Link>
          <Link
            href="/"
            className="mt-8 block text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            Back to home
          </Link>
        </>
      )}

      {phase === "choose" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-4">Your memorials</h1>
          <p className="text-landing-body max-w-lg mb-10">Choose a dashboard to manage.</p>
          <ul className="card-landing-airy w-full max-w-md divide-y divide-white/[0.08] text-left">
            {memorials.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/p/${encodeURIComponent(m.slug)}/admin`}
                  className="block px-6 py-4 text-[var(--landing-text-hero)] hover:bg-white/[0.04] transition-colors"
                >
                  <span className="font-[var(--font-serif)] text-lg">{m.name?.trim() || "Memorial"}</span>
                  <span className="block text-xs text-[var(--landing-text-muted)] mt-1 font-mono">
                    /p/{m.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-10 text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            Back to home
          </Link>
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="text-landing-section-title max-w-xl mb-6">Something went wrong</h1>
          <p className="text-landing-body max-w-lg mb-10">{message ?? "Please try again."}</p>
          <button
            type="button"
            onClick={() => {
              setPhase("loading")
              void loadMemorials()
            }}
            className="btn-landing-outline-gold"
          >
            Try again
          </button>
          <Link
            href="/"
            className="mt-8 block text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
          >
            Back to home
          </Link>
        </>
      )}
    </div>
  )
}
