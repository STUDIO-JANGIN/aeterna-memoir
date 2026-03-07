"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { AnimatePresence, motion } from "framer-motion"
import { RevealSection } from "@/components/RevealSection"

type AuthView = "signin" | "signup"

export default function CreateEventPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authView, setAuthView] = useState<AuthView>("signin")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSubmitLoading, setAuthSubmitLoading] = useState(false)

  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const getInvitationText = () => {
    const url = createdEventId ? `${window.location.origin}/event/${createdEventId}` : window.location.origin
    return `Please join us in honoring the life of ${name}. Share your photos and memories at:\n\n${url}`
  }

  const handleCopyInvitationLink = async () => {
    const text = getInvitationText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const input = document.createElement("input")
      input.value = text
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthSubmitLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    setAuthSubmitLoading(false)
    if (error) {
      setAuthError(error.message === "Invalid login credentials" ? "Invalid email or password." : error.message)
      return
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthSubmitLoading(true)
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
    setAuthSubmitLoading(false)
    if (error) {
      setAuthError(error.message)
      return
    }
    setAuthError(null)
    setAuthView("signin")
    setAuthPassword("")
    setAuthError("Check your email to confirm your account, then sign in below.")
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setAuthView("signin")
    setAuthEmail("")
    setAuthPassword("")
    setAuthError(null)
  }

  const handleSignInWithGoogle = async () => {
    setAuthError(null)
    setAuthSubmitLoading(true)
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : undefined
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : undefined,
    })
    if (error) {
      const isProviderDisabled =
        error.message?.toLowerCase().includes("not enabled") ||
        error.message?.toLowerCase().includes("unsupported provider") ||
        (error as { error_code?: string })?.error_code === "validation_failed"
      setAuthError(
        isProviderDisabled
          ? "Google sign-in is not enabled yet. The site owner needs to enable it in Supabase: Authentication → Providers → Google."
          : error.message
      )
      setAuthSubmitLoading(false)
      return
    }
    if (data?.url) window.location.href = data.url
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setLoading(true)

    const { data, error } = await supabase
      .from("events")
      .insert([{
        name,
        creator_email: user.email,
        birth_date: "19XX",
        death_date: "202X",
        location: "Location TBD",
        ceremony_time: "Time TBD"
      }])
      .select()

    if (!error && data && data[0]) {
      setCreatedEventId(data[0].id)
      setShowSuccessPopup(true)
    } else {
      alert("Error creating memorial.")
    }
    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-12 font-serif text-[var(--aeterna-gold-muted)]">
        <p className="text-[11px] uppercase tracking-[0.3em]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex flex-col items-center justify-center p-12 md:p-16 text-center font-serif text-white">
      <RevealSection className="w-full flex items-center justify-center">
        <div className="max-w-lg w-full p-14 md:p-16 rounded-[28px] border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)]/90 shadow-[var(--shadow-deep)]">
          {!user ? (
            <>
              <h1 className="text-3xl md:text-4xl mb-2 text-white font-light tracking-tight">
                {authView === "signin" ? "Sign in" : "Create account"}
              </h1>
              <p className="text-[var(--aeterna-gold-muted)] mb-8 text-base leading-relaxed">
                {authView === "signin"
                  ? "Sign in to create and manage a memorial."
                  : "Create an account to create and manage a memorial."}
              </p>

              {authError && (
                <p className="mb-6 text-sm text-white/90 bg-[var(--aeterna-gold-pale)] border border-[var(--border-gold)] rounded-xl px-4 py-3 text-left">
                  {authError}
                </p>
              )}

              <button
                type="button"
                onClick={handleSignInWithGoogle}
                disabled={authSubmitLoading}
                className="w-full py-4 rounded-[24px] border border-[var(--aeterna-gold)]/50 text-[var(--aeterna-gold)] font-serif text-sm tracking-[0.12em] bg-transparent hover:bg-[var(--aeterna-gold-pale)] transition-colors flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--aeterna-gold)]/50 text-center my-4">or</p>

              {authView === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="text-left">
                    <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-3 block font-serif">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border-b border-[var(--border-gold-subtle)] py-4 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors bg-transparent font-serif text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-3 block font-serif">
                      Password
                    </label>
                    <input
                      required
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border-b border-[var(--border-gold-subtle)] py-4 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors bg-transparent font-serif text-white placeholder:text-white/40"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={authSubmitLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 rounded-[24px] font-serif text-sm uppercase tracking-[0.2em] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] bg-transparent hover:bg-[var(--aeterna-gold-pale)] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {authSubmitLoading ? "Signing in…" : "Sign in"}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="text-left">
                    <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-3 block font-serif">
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border-b border-[var(--border-gold-subtle)] py-4 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors bg-transparent font-serif text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-3 block font-serif">
                      Password
                    </label>
                    <input
                      required
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full border-b border-[var(--border-gold-subtle)] py-4 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors bg-transparent font-serif text-white placeholder:text-white/40"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={authSubmitLoading}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 rounded-[24px] font-serif text-sm uppercase tracking-[0.2em] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] bg-transparent hover:bg-[var(--aeterna-gold-pale)] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {authSubmitLoading ? "Creating account…" : "Create account"}
                  </motion.button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setAuthView(authView === "signin" ? "signup" : "signin")
                  setAuthError(null)
                }}
                className="mt-6 w-full text-sm text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] transition-colors"
              >
                {authView === "signin" ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl mb-6 text-white font-light tracking-tight">
                Start a Memorial
              </h1>
              <p className="text-[var(--aeterna-gold-muted)] mb-2 text-base leading-relaxed">
                Enter your loved one&apos;s name to gently create a memorial space in just a few moments.
              </p>
              <p className="text-[var(--aeterna-gold)]/60 text-sm mb-8">Signed in as {user.email}</p>

              <form onSubmit={handleCreate} className="space-y-8">
                <div className="text-left">
                  <label className="text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-3 block font-serif">
                    Loved One&apos;s Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Robert Sterling"
                    className="w-full border-b border-[var(--border-gold-subtle)] py-4 focus:outline-none focus:border-[var(--aeterna-gold)] transition-colors bg-transparent font-serif text-white placeholder:text-white/40"
                  />
                </div>
                <motion.button
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-5 rounded-[24px] font-serif text-sm uppercase tracking-[0.2em] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] bg-transparent hover:bg-[var(--aeterna-gold-pale)] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Creating..." : "Launch Memorial Now"}
                </motion.button>
              </form>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-6 text-sm text-[var(--aeterna-gold)]/60 hover:text-[var(--aeterna-gold)] transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </RevealSection>

      {/* Success popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--aeterna-charcoal)]/90 backdrop-blur-xl p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="relative max-w-lg w-full rounded-[32px] border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] shadow-[var(--shadow-deep)] px-10 md:px-14 py-12 md:py-14 text-center"
              initial={{ opacity: 0, scale: 0.9, y: 8, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, y: 6, filter: "blur(6px)" }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-4">
                Memorial created
              </p>
              <h2 className="font-serif text-2xl md:text-4xl font-light text-white mb-4">
                {name}
              </h2>
              <p className="font-serif text-base text-[var(--aeterna-gold-muted)] mb-10 leading-relaxed">
                Share the link below so family and friends can leave tributes.
              </p>
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={handleCopyInvitationLink}
                  className="w-full min-h-[56px] px-8 py-4 rounded-[999px] border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] font-serif text-sm tracking-[0.2em] uppercase bg-transparent hover:bg-[var(--aeterna-gold-pale)] transition-colors"
                >
                  Copy Invitation Link
                </button>
                <p className="font-serif text-xs text-[var(--aeterna-gold-muted)] tracking-wide leading-relaxed">
                  Share this with family and friends via WhatsApp or Email.
                </p>
              </div>
              <button
                type="button"
                onClick={() => createdEventId && router.push(`/event/${createdEventId}`)}
                className="mt-10 w-full min-h-[56px] px-8 py-4 rounded-[999px] border border-[var(--aeterna-gold)]/60 text-[var(--aeterna-gold)] font-serif text-sm tracking-[0.18em] uppercase hover:bg-[var(--aeterna-gold-pale)] transition-colors"
              >
                Go to Memorial Page
              </button>
              <button
                type="button"
                onClick={() => createdEventId && router.push(`/admin/${createdEventId}`)}
                className="mt-4 w-full min-h-[48px] px-8 py-3 rounded-[999px] border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)] font-serif text-xs tracking-[0.18em] uppercase hover:bg-[var(--aeterna-gold-pale)] transition-colors"
              >
                Family Dashboard (edit profile &amp; review tributes)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] px-8 py-4 rounded-[24px] border border-[var(--border-gold)] bg-[var(--aeterna-charcoal-soft)] text-[var(--aeterna-gold)] font-serif text-sm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            Invitation copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
