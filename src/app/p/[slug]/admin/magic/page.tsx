"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { getStoriesForAdminAction, type AdminEvent } from "@/app/actions/setStorySelected"

type PageProps = {
  params: Promise<{ slug: string }>
}

// 샘플 마법 영화 URL (환경 변수로 설정 가능)
const SAMPLE_MAGIC_VIDEO_URL = process.env.NEXT_PUBLIC_MAGIC_SAMPLE_VIDEO_URL || ""

const MAX_CREDITS = 3

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
    <main className="min-h-screen bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)]">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)] mb-1.5">
              Aeterna Magic Album
            </p>
            <h1 className="text-2xl md:text-3xl font-serif text-[var(--aeterna-gold)]">
              마법 영화 제작소
            </h1>
            <p className="mt-2 text-sm text-[var(--aeterna-body)] max-w-xl">
              고인의 서로 다른 장면들을 모아, 최대 3편까지의 시네마틱 AI 헌정 영화를 만들 수 있습니다.
              선택된 사진과 분위기를 바탕으로 남은 마법 기회를 소중하게 사용해 주세요.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href={slug ? `/p/${slug}/admin` : "/"}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-gold-subtle)] px-3 py-1.5 text-xs text-[var(--aeterna-gold-muted)] hover:border-[var(--aeterna-gold)] hover:text-[var(--aeterna-gold)] transition-colors"
            >
              ← 관리 페이지로 돌아가기
            </Link>
            {event && (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-gold-muted)]">
                  {event.name ?? "이름 없는 앨범"}
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
                    ? "Premium · 마법 앨범"
                    : currentTier === "plus"
                      ? "Plus · 영구 보관"
                      : "Free · 7일 후 삭제"}
                </span>
              </div>
            )}
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/70 px-6 py-10 text-center text-sm text-[var(--aeterna-body)]">
            불러오는 중입니다…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-6 py-6 text-sm text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && event && (
          <div className="space-y-6">
            {/* 마법 영화 예시 섹션 */}
            <section className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/80 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--aeterna-gold)] uppercase tracking-widest">
                    마법 영화 예시
                  </h2>
                  <p className="mt-1 text-xs text-[var(--aeterna-body)] max-w-xl">
                    실제 Premium 앨범에서 만들어지는 것과 비슷한 스타일의 예시 영상입니다. 사진 12~15장을 고르고 분위기를
                    선택하면, 이와 같은 시네마틱 추모 영상을 최대 3편까지 제작하실 수 있습니다.
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full border border-[var(--border-gold-subtle)] px-2 py-0.5 text-[10px] text-[var(--aeterna-gold-muted)]">
                    1분 마법 영화 샘플
                  </span>
                </div>
              </div>
              <div className="mt-4 relative rounded-2xl overflow-hidden border border-[var(--border-gold-subtle)] bg-black">
                {SAMPLE_MAGIC_VIDEO_URL ? (
                  <video
                    className="w-full h-full aspect-video object-cover"
                    controls
                    playsInline
                    poster="/hero-elder-portrait.png"
                  >
                    <source src={SAMPLE_MAGIC_VIDEO_URL} type="video/mp4" />
                    브라우저가 비디오 재생을 지원하지 않습니다.
                  </video>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
                    <p className="text-xs text-[var(--aeterna-gold-muted)]">
                      샘플 영상 URL이 아직 설정되지 않았습니다. 환경 변수{" "}
                      <span className="font-mono text-[11px]">NEXT_PUBLIC_MAGIC_SAMPLE_VIDEO_URL</span>을
                      설정해 주세요.
                    </p>
                  </div>
                )}
                {currentTier !== "premium" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center px-4">
                    <p className="text-sm text-[var(--aeterna-gold)] font-serif mb-2">
                      Premium으로 업그레이드하면, 우리 가족만의 마법 영화를 이렇게 만들어 드립니다.
                    </p>
                    <p className="text-xs text-[var(--aeterna-body)] mb-3 max-w-sm">
                      사진 12~15장을 모아 두신 뒤, 관리자 페이지 상단의 Premium 업그레이드 버튼을 눌러 보세요. 최대 3편의
                      서로 다른 마법 영화를 제작할 수 있습니다.
                    </p>
                    <Link
                      href={slug ? `/p/${slug}/admin` : "/"}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-xs font-semibold px-4 py-2 hover:bg-[var(--aeterna-gold-light)] transition-colors"
                    >
                      Premium 업그레이드 살펴보기
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
                <p className="font-semibold mb-1">Premium 전용 공간입니다.</p>
                <p className="text-xs text-amber-200/90">
                  마법 영화 제작소는 Premium 플랜에서만 이용할 수 있습니다. 관리 페이지 상단에서 Premium으로 업그레이드한
                  뒤 다시 방문해 주세요.
                </p>
              </div>
            )}

            {currentTier === "premium" && (
              <>
                <section className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/70 px-6 py-5">
                  <h2 className="text-sm font-semibold text-[var(--aeterna-gold)] mb-2">
                    Premium 마법 크레딧
                  </h2>
                  <p className="text-xs text-[var(--aeterna-gold-muted)] mb-4">
                    Premium 구매 시 3회의 마법 영화 제작 기회가 주어집니다. 풀버전(1분) 영화를 요청할 때마다 1회씩 차감되며,
                    남은 크레딧은 아래에서 확인할 수 있습니다.
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
                      <p className="text-[var(--aeterna-body)]">남은 마법 영화 제작 기회</p>
                      <p className="mt-0.5 text-lg font-serif text-[var(--aeterna-gold)] tabular-nums">
                        {remainingCredits}회
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/70 px-6 py-5 space-y-4">
                  <h2 className="text-sm font-semibold text-[var(--aeterna-gold)]">
                    마법 영화 제작 3단계
                  </h2>
                  <ol className="space-y-3 text-xs text-[var(--aeterna-body)]">
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--aeterna-gold)] text-[10px] text-[var(--aeterna-gold)]">
                        1
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--aeterna-headline)] mb-0.5">
                          12~15장의 사진 별표(★)로 선택하기
                        </p>
                        <p>
                          관리 페이지의 &quot;AI 헌정 영상 제작소&quot; 섹션에서 영상에 넣고 싶은 사진에 별표를 남겨 두세요.
                          선택된 사진만이 마법 영화의 주인공이 됩니다.
                        </p>
                        <Link
                          href={`/p/${slug}/admin#ai-lab`}
                          className="mt-1 inline-flex text-[var(--aeterna-gold)] hover:underline"
                        >
                          사진 선택 화면으로 이동하기 →
                        </Link>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--aeterna-gold)] text-[10px] text-[var(--aeterna-gold)]">
                        2
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--aeterna-headline)] mb-0.5">
                          분위기(Mood)와 10초 미리보기 확인
                        </p>
                        <p>
                          웅장한 · 따뜻한 · 차분한 분위기 중 하나를 고른 뒤, 좋아요 상위 사진들로 10초 미리보기를 만들어
                          감정을 맞춰 보세요.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--aeterna-gold)] text-[10px] text-[var(--aeterna-gold)]">
                        3
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--aeterna-headline)] mb-0.5">
                          1분 풀버전 제작 요청하기
                        </p>
                        <p>
                          관리 페이지 하단의 &quot;1분 풀버전 제작 시작&quot; 버튼을 눌러 주세요. 요청이 접수되면 위의 Premium
                          크레딧이 1회 차감되고, 제작이 완료되면 관리자 페이지에서 바로 확인하실 수 있습니다.
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

