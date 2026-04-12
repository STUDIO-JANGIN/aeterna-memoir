"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { getStoriesForAdminAction, type AdminEvent } from "@/app/actions/setStorySelected"

type PageProps = {
  params: Promise<{ slug: string }>
}

// Sample cinematic film URL (can be set via env var)
const SAMPLE_MAGIC_VIDEO_URL = process.env.NEXT_PUBLIC_MAGIC_SAMPLE_VIDEO_URL || ""

const MAX_CREDITS = 5

export default function MagicFilmStudioPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : ""

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        setError("Invalid URL: missing slug.")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      const { event: e, error: err } = await getStoriesForAdminAction(slug)
      setEvent(e ?? null)
      if (err) setError(err)
      setLoading(false)
    }
    load()
  }, [slug])

  const currentTier = (event?.tier ?? "free") as "free" | "plus" | "premium"
  const remainingCredits = typeof event?.video_credits === "number" ? event.video_credits : 0
  const usedCredits = Math.max(0, MAX_CREDITS - remainingCredits)

  return (
    <main className="min-h-dvh bg-landing text-[var(--landing-text-hero)]">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-landing-label text-[var(--aeterna-gold)] mb-2">
              Aeterna Magic Album
            </p>
            <h1 className="text-landing-section-title text-[var(--aeterna-gold)]">
              Magic Film Studio
            </h1>
            <p className="mt-3 text-landing-body max-w-xl">
              Curate moments into five ~10s “moving picture” tribute clips — warm, intimate, like meeting them again in
              light. Each clip uses one credit; you have five with Premium.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href={slug ? `/p/${slug}/admin` : "/"}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-3 py-1.5 text-landing-nav text-[var(--landing-text-muted)] hover:border-[var(--aeterna-gold)] hover:text-[var(--aeterna-gold)] transition-colors"
            >
              ← Back to admin
            </Link>
            {event && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#030303]/30 border border-white/[0.08] text-[var(--landing-text-body)]">
                  {event.name ?? "Untitled album"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    currentTier === "premium"
                      ? "bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)]"
                      : currentTier === "plus"
                        ? "bg-emerald-900/60 text-emerald-200 border border-emerald-500/50"
                        : "bg-slate-800 text-slate-200 border border-slate-500/60"
                  }`}
                >
                  {currentTier === "premium"
                    ? "Premium · Magic Album"
                    : currentTier === "plus"
                      ? "Plus · Lifetime storage"
                      : "Free · Auto-delete after 7 days"}
                </span>
              </div>
            )}
          </div>
        </header>

        {loading && (
          <div className="card-landing-airy px-6 py-10 text-center text-landing-body">
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-6 py-6 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && event && (
          <div className="space-y-6">
            {/* Sample film section */}
            <section className="card-landing-airy px-6 py-6 md:py-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--aeterna-gold)] uppercase tracking-widest">
                    Sample magic film
                  </h2>
                  <p className="mt-1 text-xs text-[var(--landing-text-body)] max-w-xl">
                    Style reference for Premium: five separate ~10s “moving picture” clips (Luma Ray 2), warm and intimate —
                    like photographs that gently come alive.
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full border border-white/[0.1] px-2 py-0.5 text-[10px] text-[var(--landing-text-muted)]">
                    ~10s sample clip style
                  </span>
                </div>
              </div>
              <div className="mt-4 relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#030303] shadow-[var(--landing-shadow-deep)]">
                {SAMPLE_MAGIC_VIDEO_URL ? (
                  <video
                    className="w-full h-full aspect-video object-cover"
                    controls
                    playsInline
                    poster="/hero-elder-portrait.png"
                  >
                    <source src={SAMPLE_MAGIC_VIDEO_URL} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
                    <p className="text-xs text-[var(--aeterna-gold-muted)]">
                      The sample video URL is not set yet. Please configure{" "}
                      <span className="font-mono text-[11px]">NEXT_PUBLIC_MAGIC_SAMPLE_VIDEO_URL</span>.
                    </p>
                  </div>
                )}
                {currentTier !== "premium" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#030303]/70 text-center px-4">
                    <p className="text-sm text-[var(--aeterna-gold)] font-heading mb-2">
                      Upgrade to Premium to create films like this for your family.
                    </p>
                    <p className="text-xs text-[var(--landing-text-body)] mb-3 max-w-sm">
                      Gather 15–20 photos (10–25 supported), then on the admin page generate five ~10s tribute clips — one
                      credit per clip, five credits included with Premium.
                    </p>
                    <Link
                      href={slug ? `/p/${slug}/admin` : "/"}
                      className="btn-landing-gold inline-flex items-center gap-2 text-xs font-semibold px-4"
                    >
                      Explore Premium upgrade
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {currentTier !== "premium" && (
              <div className="rounded-2xl border border-amber-500/60 bg-amber-950/40 px-6 py-5 text-sm text-amber-50">
                <p className="font-semibold mb-1">This area is Premium-only.</p>
                <p className="text-xs text-amber-200/90">
                  Magic Film Studio is available only on the Premium plan. Upgrade from the admin page and come back.
                </p>
              </div>
            )}

            {currentTier === "premium" && (
              <>
                <section className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/70 px-6 py-5">
                  <h2 className="text-sm font-semibold text-[var(--aeterna-gold)] mb-2">
                    Premium film credits
                  </h2>
                  <p className="text-xs text-[var(--aeterna-gold-muted)] mb-4">
                    Premium includes 5 tribute-clip credits. Each ~10s clip uses one credit. Track remaining clips below.
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: MAX_CREDITS }).map((_, idx) => {
                        const index = idx + 1
                        const used = index <= usedCredits
                        return (
                          <div
                            key={index}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] border transition-colors ${
                              used
                                ? "bg-slate-900 border-slate-600 text-slate-300"
                                : "bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] border-[var(--aeterna-gold)] shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
                            }`}
                          >
                            {used ? "USED" : "★"}
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-[var(--landing-text-body)]">Remaining clip credits</p>
                      <p className="mt-0.5 text-lg font-heading text-[var(--aeterna-gold)] tabular-nums">
                        {remainingCredits}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/70 px-6 py-5 space-y-4">
                  <h2 className="text-sm font-semibold text-[var(--aeterna-gold)]">
                    3 steps to create your film
                  </h2>
                  <ol className="space-y-3 text-xs text-[var(--aeterna-body)]">
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--aeterna-gold)] text-[10px] text-[var(--aeterna-gold)]">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--landing-text-hero)] mb-0.5">
                          Select photos with the video icon
                        </p>
                        <p>
                          In the admin page&apos;s &quot;AI Tribute Film Studio&quot; section, tap the video badge on each photo you
                          want in the film. Only selected photos will be used.
                        </p>
                        <Link
                          href={`/p/${slug}/admin#ai-lab`}
                          className="mt-1 inline-flex text-[var(--aeterna-gold)] hover:underline"
                        >
                          Go to photo selection →
                        </Link>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--aeterna-gold)] text-[10px] text-[var(--aeterna-gold)]">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--landing-text-hero)] mb-0.5">
                          Choose a mood and review the 10-second preview
                        </p>
                        <p>
                          Pick Grand, Warm, or Calm, then generate a 10-second preview from top-liked photos to match the tone.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--aeterna-gold)] text-[10px] text-[var(--aeterna-gold)]">
                        3
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--landing-text-hero)] mb-0.5">
                          Generate each ~10s tribute clip
                        </p>
                        <p>
                          On the admin page, use &quot;Generate next tribute clip&quot;. One credit per clip; completed clips
                          appear in the admin studio and on the public memorial.
                        </p>
                      </div>
                    </li>
                  </ol>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

