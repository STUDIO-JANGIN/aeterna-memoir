"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/browser"
import { buildOAuthCallbackRedirectUrl } from "@/lib/appUrl"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { LandingLanguageSwitcher } from "@/components/landing/LandingLanguageSwitcher"

function sanitizeNextPath(param: string | null): string {
  if (!param) return "/my-memorial"
  const t = param.trim()
  if (!t.startsWith("/") || t.startsWith("//")) return "/my-memorial"
  return t
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
      <div className="absolute end-4 top-4 z-10 md:end-8 md:top-8">
        <LandingLanguageSwitcher />
      </div>
      <p className="text-landing-label text-[var(--aeterna-gold)] mb-6">{t.signIn.kicker}</p>
      <h1 className="text-landing-section-title max-w-xl mb-6">{t.signIn.title}</h1>
      <p className="text-landing-body max-w-lg mb-10">{t.signIn.body}</p>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md w-full">
        <button
          type="button"
          onClick={handleContinueWithGoogle}
          disabled={googleLoading}
          className="btn-landing-primary w-full sm:w-auto min-h-[52px] justify-center disabled:opacity-60"
        >
          {googleLoading ? t.signIn.redirecting : t.signIn.continueGoogle}
        </button>
        <Link
          href="/"
          className="text-sm text-[var(--landing-text-body)] hover:text-[var(--aeterna-gold)] transition-colors"
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
