"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { buildOAuthCallbackRedirectUrl } from "@/lib/appUrl"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"

function sanitizeNextPath(param: string | null): string {
  if (!param) return "/my-memorial"
  const t = param.trim()
  if (!t.startsWith("/") || t.startsWith("//")) return "/my-memorial"
  return t
}

/** Google “G” mark — multicolor paths per brand guidelines (sign-in affordance). */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function SignInContent() {
  const { app: t } = useLandingLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = sanitizeNextPath(searchParams.get("next"))
  const [checking, setChecking] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        router.replace(nextPath)
        return
      }
      setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [router, nextPath])

  const handleContinueWithGoogle = useCallback(async () => {
    setGoogleLoading(true)
    setMessage(null)
    const redirectTo = buildOAuthCallbackRedirectUrl(nextPath)
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
      setMessage(e instanceof Error ? e.message : t.signIn.signInFailed)
      setGoogleLoading(false)
    }
  }, [nextPath])

  if (checking) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-landing px-6 text-center">
        <p className="text-landing-body text-[var(--landing-text-muted)]">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-landing px-6 md:px-12 py-20 md:py-28 text-center">
      <p className="text-landing-label text-[var(--aeterna-gold)] mb-6">{t.signIn.kicker}</p>
      <h1 className="text-landing-section-title max-w-xl mb-6">{t.signIn.title}</h1>
      <p className="text-landing-body max-w-lg mb-10">{t.signIn.body}</p>
      <div className="flex w-full max-w-md flex-col gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleContinueWithGoogle}
          disabled={googleLoading}
          dir="ltr"
          className="btn-landing-google w-full shrink-0 justify-center px-5 disabled:opacity-60"
        >
          <GoogleMark className="shrink-0" />
          <span>{googleLoading ? t.signIn.redirecting : t.signIn.continueGoogle}</span>
        </button>
        <Link
          href="/"
          className="btn-landing-outline-gold w-full shrink-0 min-h-[52px] justify-center no-underline"
        >
          {t.common.backToHome}
        </Link>
      </div>
      {message ? <p className="mt-6 text-sm text-[var(--aeterna-gold-muted)]">{message}</p> : null}
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-landing">
          <p className="text-landing-body text-[var(--landing-text-muted)]">…</p>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
