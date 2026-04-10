"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { Heart, QrCode, Sparkles } from "lucide-react"
import { Navbar } from "@/components/Layout/Navbar"
import { RevealSection } from "@/components/RevealSection"
import { LandingLanguageSwitcher } from "@/components/landing/LandingLanguageSwitcher"
import { LandingLocaleProvider, useLandingLocale } from "@/components/landing/LandingLocaleContext"
import { getLandingHeroImages } from "@/lib/landingHeroMedia"
import {
  formatLandingTierPrice,
  getPricingCurrencyId,
  landingPlanHref,
} from "@/lib/landingPricing"
import {
  IPhoneShell,
  StepScreenConnectVote,
  StepScreenCreate,
  StepScreenMemorialShare,
} from "@/components/landing/IPhoneMockup"

const LANDING_BACKGROUND_VIDEO_URL =
  process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL ?? "/hero-bg.mp4"
const LANDING_BACKGROUND_POSTER_URL =
  process.env.NEXT_PUBLIC_LANDING_BACKGROUND_POSTER_URL ?? "/hero-fallback.jpg"

const HOW_IT_WORKS_META = [
  { Icon: Sparkles, mockup: "create" as const },
  { Icon: QrCode, mockup: "qr" as const },
  { Icon: Heart, mockup: "connect" as const },
] as const

const LANDING_NAV_IDS = ["how-it-works", "pricing", "faq"] as const
type LandingNavId = (typeof LANDING_NAV_IDS)[number]

const PLAN_TIER_EMPHASIS = ["subtle", "gold", "subtle"] as const

/** Same footprint + shared baseline: phones align on one horizontal line on md+. */
function HowItWorksMockup({ mockup }: { mockup: (typeof HOW_IT_WORKS_META)[number]["mockup"] }) {
  const shellClass = "shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
  const slotClass =
    "flex h-full min-h-[min(400px,56vw)] w-full items-end justify-center md:min-h-[448px]"

  const phone = (inner: ReactNode) => (
    <div className={slotClass} dir="ltr">
      <div className="relative w-full max-w-[260px]">
        <div
          className="pointer-events-none absolute -inset-3 rounded-[2.5rem] bg-[var(--aeterna-gold)]/[0.06] blur-3xl md:-inset-4"
          aria-hidden
        />
        {inner}
      </div>
    </div>
  )

  if (mockup === "create") {
    return phone(
      <IPhoneShell className={`relative z-10 mx-auto w-full ${shellClass}`}>
        <StepScreenCreate />
      </IPhoneShell>,
    )
  }

  if (mockup === "qr") {
    return phone(
      <IPhoneShell className={`relative z-10 mx-auto w-full ${shellClass}`}>
        <StepScreenMemorialShare />
      </IPhoneShell>,
    )
  }

  return phone(
    <IPhoneShell className={`relative z-10 mx-auto w-full ${shellClass}`}>
      <StepScreenConnectVote />
    </IPhoneShell>,
  )
}

function LandingPageInner() {
  const { locale, strings: t } = useLandingLocale()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [videoError, setVideoError] = useState(false)
  const [activeNavId, setActiveNavId] = useState<LandingNavId | null>(null)
  const hasVideo = !!LANDING_BACKGROUND_VIDEO_URL
  const showPlaceholder = !hasVideo || videoError
  const stepFlowLabels = t.howItWorks.steps.map((s) => `${s.title}: ${s.description}`)
  const heroImages = getLandingHeroImages(locale)
  const pricingCurrency = getPricingCurrencyId(locale)

  /** After client navigation from other routes (e.g. memorial “upgrade” → /#pricing), scroll to pricing. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.location.hash?.replace(/^#/, "") ?? ""
    if (raw !== "pricing") return
    const t = window.setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const elements = LANDING_NAV_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio > 0.04)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const first = visible[0]
        if (first?.target.id && LANDING_NAV_IDS.includes(first.target.id as LandingNavId)) {
          setActiveNavId(first.target.id as LandingNavId)
        }
      },
      { root: null, rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.05, 0.1, 0.15, 0.25, 0.35, 0.5] },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const landingNavButtonClass = (id: LandingNavId) => {
    const active = activeNavId === id
    return [
      "text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.22em] pb-1 border-b-[0.5px] transition-colors duration-200",
      active
        ? "border-[rgba(255,255,255,0.1)] text-[#f5f5f7] bg-[linear-gradient(to_right,transparent,rgba(212,175,55,0.1),transparent)] rtl:bg-[linear-gradient(to_left,transparent,rgba(212,175,55,0.1),transparent)]"
        : "border-transparent text-[rgba(245,245,247,0.72)] hover:text-[#f5f5f7]",
    ].join(" ")
  }

  return (
    <div
      className="relative min-h-dvh w-full bg-landing text-[#f5f5f7] leading-[1.6]"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      {/* once.film–inspired: calm, editorial, lots of air; nav centered, logo / CTA balanced */}
      <Navbar pageDir={locale === "ar" ? "rtl" : "ltr"} end={<LandingLanguageSwitcher />}>
        <button
          type="button"
          onClick={() => scrollTo("how-it-works")}
          className={landingNavButtonClass("how-it-works")}
        >
          {t.nav.howItWorks}
        </button>
        <button
          type="button"
          onClick={() => scrollTo("pricing")}
          className={landingNavButtonClass("pricing")}
        >
          {t.nav.pricing}
        </button>
        <button type="button" onClick={() => scrollTo("faq")} className={landingNavButtonClass("faq")}>
          {t.nav.faq}
        </button>
      </Navbar>

      {/* Background — decorative video/poster: LTR so playback/scrub semantics stay global; no mirroring of footage */}
      <div className="absolute inset-0 z-0 min-h-dvh pointer-events-none" dir="ltr">
        <div className={`absolute inset-0 transition-opacity ${showPlaceholder ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-landing" />
          <img src={LANDING_BACKGROUND_POSTER_URL} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.12]" fetchPriority="high" />
        </div>
        {hasVideo && !videoError && (
          <>
            <video
              className="absolute inset-0 z-0 h-full w-full max-h-[100dvh] object-cover object-[center_10%] max-md:object-[center_6%]"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/hero-fallback.jpg"
              onError={() => setVideoError(true)}
            >
              <source src={LANDING_BACKGROUND_VIDEO_URL} type="video/mp4" />
            </video>
            {/* Tonal overlay: same hue as --landing-bg so video grade matches the scroll canvas */}
            <div className="absolute inset-0 z-[1] bg-[color:var(--landing-bg)]/50 pointer-events-none" />
          </>
        )}
        {/* Multi-stop fade: video/poster → solid canvas (extends past 100dvh for smooth first scroll) */}
        <div aria-hidden className="landing-hero-vignette" />
      </div>

      <div className="relative z-0 pt-20 md:pt-[76px]">
        {/* Hero: copy + mockups */}
        <main className="px-5 md:px-10 pt-6 pb-24 md:pt-20 md:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-y-14 lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center lg:gap-y-0">
              {/* Value proposition: always on top on mobile; left column on desktop */}
              <div className="relative z-20 order-1 flex flex-col items-center text-center lg:items-start lg:text-start px-1 sm:px-2 pb-2 sm:pb-10 lg:pb-0">
                <RevealSection className="w-full max-w-xl mx-auto lg:mx-0 lg:max-w-xl space-y-0">
                  <h1 className="text-landing-hero font-semibold text-balance md:leading-[1.1] max-md:!text-[clamp(1.875rem,7.5vw,2.75rem)] max-md:!leading-[1.14] max-md:tracking-[-0.035em]">
                    {t.hero.title1}{" "}
                    <br className="md:hidden" aria-hidden />
                    {t.hero.title2}
                  </h1>
                  <p className="mt-4 md:mt-8 text-[13px] md:text-lg leading-[1.72] md:leading-[1.6] text-[#f5f5f7]/90 font-[var(--font-sans)] max-w-xl mx-auto lg:mx-0 text-balance max-md:px-0.5">
                    {t.hero.body}
                  </p>
                  <p className="mt-5 md:mt-4 text-[11px] md:text-sm leading-[1.68] md:leading-relaxed font-[var(--font-sans)] max-w-xl mx-auto lg:mx-0 text-balance italic text-[#f0ebe3] [text-shadow:0px_2px_10px_rgba(0,0,0,0.8)] max-md:px-0.5">
                    {t.hero.tagline}
                  </p>
                </RevealSection>
                <RevealSection className="mt-8 w-full max-w-xl mx-auto lg:mx-0 pt-2 md:mt-10 md:pt-0 border-t border-white/[0.06] md:border-0 max-md:pb-2">
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4 items-stretch sm:items-center justify-center lg:justify-start">
                    <Link
                      href="/create"
                      className="cta-silk inline-flex min-h-[50px] md:min-h-[54px] w-full sm:w-auto items-center justify-center rounded-full bg-[var(--aeterna-gold)] px-8 md:px-12 text-[10px] md:text-[11px] font-semibold tracking-[0.16em] uppercase text-[#0c0c0c] border border-[var(--aeterna-gold)] shadow-[0_16px_50px_-6px_rgba(197,160,89,0.42)] hover:bg-[var(--aeterna-gold-light)] hover:shadow-[0_20px_56px_-4px_rgba(197,160,89,0.5)]"
                    >
                      {t.hero.ctaCreate}
                    </Link>
                    <Link
                      href="/sign-in?next=%2Fmy-memorial"
                      className="inline-flex min-h-[50px] md:min-h-[54px] w-full sm:w-auto items-center justify-center rounded-full border border-[var(--aeterna-gold)]/55 bg-[#030303]/35 px-8 md:px-10 text-[10px] md:text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--aeterna-gold)] shadow-[0_8px_28px_-8px_rgba(0,0,0,0.4)] hover:bg-[var(--aeterna-gold)]/10 hover:border-[var(--aeterna-gold)]/80 transition-colors"
                    >
                      {t.hero.ctaMyMemorial}
                    </Link>
                  </div>
                </RevealSection>
              </div>

              {/* iPhone mockups — LTR: keep photo/device composition unmirrored (intrinsic likeness + brand) */}
              <RevealSection className="order-2 relative z-10 w-full flex justify-center lg:justify-end max-lg:mt-2 max-lg:pt-4">
                <div
                  dir="ltr"
                  className={`relative w-full max-w-[min(100%,400px)] lg:max-w-[440px] h-[min(380px,78vw)] sm:h-[420px] md:h-[440px] lg:h-[min(480px,52vh)] isolate max-md:overflow-x-clip max-md:overflow-y-visible ${locale === "ar" ? "landing-hero-ar-mood" : ""}`}
                >
                  {/* Foreground mockup: inclusive elder portrait (faces kept below Dynamic Island) */}
                  <div
                    className="absolute right-0 top-4 z-20 w-[56%] min-w-[180px] sm:top-6 sm:w-[54%]"
                    style={{ transform: "perspective(1600px) rotateY(-11deg) rotateZ(2deg)" }}
                  >
                    <IPhoneShell className="origin-center">
                      <img
                        src={heroImages.portrait}
                        alt={t.hero.heroPortraitAlt}
                        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_22%]"
                        width={900}
                        height={1950}
                        loading="eager"
                        decoding="async"
                      />
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
                    </IPhoneShell>
                  </div>
                  {/* Pets: background */}
                  <div
                    className="absolute bottom-4 left-0 z-10 w-[52%] min-w-[170px] sm:bottom-6 sm:w-[50%]"
                    style={{ transform: "perspective(1600px) rotateY(-7deg) rotateZ(-3deg)" }}
                  >
                    <IPhoneShell className="origin-center shadow-[0_28px_72px_rgba(0,0,0,0.48)]">
                      <img
                        src={heroImages.secondary}
                        alt={t.hero.heroSecondaryAlt}
                        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_top]"
                        width={900}
                        height={1950}
                        loading="eager"
                        decoding="async"
                      />
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                    </IPhoneShell>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </main>

        {/* How it works: 3-column scan (icons + bold headers + mockups) */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-landing px-5 pt-28 pb-16 md:px-10 md:py-28"
        >
          <div className="max-w-6xl mx-auto">
            <RevealSection className="text-center mb-12 md:mb-20">
              <p className="text-[9px] md:text-[10px] tracking-[0.32em] md:tracking-[0.35em] uppercase text-[#737373] mb-5 md:mb-4">
                {t.howItWorks.kicker}
              </p>
              <h2 className="font-[var(--font-serif)] text-[1.35rem] leading-[1.35] sm:text-2xl md:text-[2rem] md:leading-tight text-[color:var(--landing-text-title)] font-normal tracking-[0.05em] text-balance px-1">
                {t.howItWorks.title}
              </h2>
              <p className="mt-5 max-w-2xl mx-auto px-2 text-xs md:text-sm leading-[1.65] text-[#8a8a8a] font-[var(--font-sans)] text-balance">
                {t.howItWorks.subtitle}
              </p>
              <p className="sr-only">{stepFlowLabels.join(" ")}</p>
            </RevealSection>

            <ol className="m-0 grid list-none grid-cols-1 gap-16 p-0 md:grid-cols-3 md:items-stretch md:gap-8 lg:gap-12">
              {HOW_IT_WORKS_META.map((meta, i) => {
                const step = t.howItWorks.steps[i]
                const Icon = meta.Icon
                return (
                  <li
                    key={step.title}
                    className="relative flex list-none flex-col items-center text-center md:h-full md:min-h-[560px] lg:min-h-[600px]"
                  >
                    <span className="sr-only">{stepFlowLabels[i]}</span>
                    <RevealSection className="flex w-full flex-1 flex-col items-center md:h-full md:min-h-0">
                      <div className="mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--aeterna-gold)]/30 bg-[var(--aeterna-gold)]/[0.08] text-[var(--aeterna-gold)] shadow-[0_0_40px_rgba(197,160,89,0.12)]">
                        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                      </div>
                      <div className="flex max-w-[320px] shrink-0 flex-col items-center px-1">
                        <h3 className="font-[var(--font-serif)] text-xl md:text-[1.35rem] text-[#e8e4dc] font-semibold tracking-tight text-balance">
                          {step.title}
                        </h3>
                        <p className="mt-3 min-h-[4.5rem] text-sm leading-relaxed text-[#a3a3a3] font-[var(--font-sans)] text-balance md:min-h-[5rem]">
                          {step.description}
                        </p>
                      </div>
                      <div className="relative mt-6 flex w-full flex-1 flex-col justify-end md:mt-8 md:px-0">
                        <HowItWorksMockup mockup={meta.mockup} />
                      </div>
                    </RevealSection>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Pricing: extremely simple */}
        <section
          id="pricing"
          className="scroll-mt-24 border-t border-white/[0.03] bg-landing px-5 py-20 md:px-10 md:py-28"
        >
          <div className="max-w-3xl mx-auto">
            <RevealSection className="text-center mb-14">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#737373] mb-4">{t.pricing.kicker}</p>
              <h2 className="font-[var(--font-serif)] text-2xl md:text-[2rem] text-[color:var(--landing-text-title)] font-normal tracking-[0.05em]">
                {t.pricing.title}
              </h2>
              <p className="mt-6 max-w-2xl mx-auto px-2 text-xs md:text-sm leading-[1.65] text-[#8a8a8a] font-[var(--font-sans)] text-balance">
                {t.pricing.subtitle}
              </p>
            </RevealSection>

            <p className="text-center text-xs text-[#737373] mb-8">{t.pricing.pricingFootnote}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 md:items-stretch gap-6 md:gap-4">
              {t.pricing.plans.map((plan, i) => {
                const tierIndex = i as 0 | 1 | 2
                const emphasis = PLAN_TIER_EMPHASIS[tierIndex]
                const href = landingPlanHref(tierIndex, locale)
                const statusTag = "statusTag" in plan ? plan.statusTag : undefined
                const { primary, suffix } = formatLandingTierPrice(pricingCurrency, tierIndex)
                return (
                  <RevealSection key={href} className="h-full">
                    <div className="card-treasure h-full rounded-2xl">
                      <div
                        className={`card-treasure-inner flex h-full min-h-full flex-col rounded-2xl px-6 py-8 text-center ${
                          emphasis === "gold"
                            ? "ring-1 ring-[var(--aeterna-gold)]/25 bg-[var(--aeterna-gold)]/[0.06]"
                            : ""
                        }`}
                      >
                        {/* min-h aligns price row across cards */}
                        <div className="flex min-h-[80px] w-full flex-col items-center justify-end md:min-h-[88px]">
                          {statusTag ? (
                            <span className="mb-3 inline-flex max-w-[14rem] items-center justify-center self-center rounded-md border border-[var(--aeterna-gold)]/25 bg-[var(--aeterna-gold)]/[0.08] px-2.5 py-1 text-[7px] font-semibold uppercase leading-snug tracking-[0.18em] text-[#d8c896]">
                              {statusTag}
                            </span>
                          ) : null}
                          <p className="font-[var(--font-display)] text-[10px] tracking-[0.18em] text-[#c4a86a] uppercase mb-1">
                            {plan.tierName}
                          </p>
                        </div>
                        <p
                          dir="ltr"
                          lang={locale === "ja" ? "ja" : "en"}
                          className="font-[var(--font-serif)] text-3xl md:text-4xl text-[color:var(--landing-text-hero)] tabular-nums tracking-[0.02em]"
                        >
                          <span className="inline-block">{primary}</span>{" "}
                          <span className="text-lg font-normal text-white/35 md:text-xl">{suffix}</span>
                        </p>
                        <p className="mt-4 font-[var(--font-sans)] text-sm text-[#a3a3a3] leading-snug">{plan.value}</p>
                        <div className="flex-1" />
                        <Link
                          href={href}
                          className={`cta-silk btn-tap mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full text-[10px] tracking-[0.16em] uppercase font-medium ${
                            statusTag
                              ? "animate-artisan-pulse border border-[var(--aeterna-gold)]/35 text-[color:var(--landing-text-hero)] hover:bg-white/[0.06]"
                              : emphasis === "gold"
                                ? "bg-[var(--aeterna-gold)] text-[color:var(--landing-bg)] hover:bg-[var(--aeterna-gold-light)]"
                                : "border border-white/[0.12] text-[color:var(--landing-text-title)] hover:bg-white/[0.04]"
                          }`}
                        >
                          {plan.cta}
                        </Link>
                      </div>
                    </div>
                  </RevealSection>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-white/[0.03] bg-landing px-5 py-20 md:px-10 md:py-28"
        >
          <div className="max-w-2xl mx-auto">
            <RevealSection className="text-center mb-14 md:mb-16">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#737373] mb-4">{t.faq.kicker}</p>
              <h2 className="font-[var(--font-serif)] text-2xl md:text-[2rem] text-[color:var(--landing-text-title)] font-normal tracking-[0.05em]">
                {t.faq.title}
              </h2>
              <p className="mt-5 max-w-md mx-auto font-[var(--font-sans)] text-sm md:text-[15px] text-[#8a8a8a] leading-relaxed">
                {t.faq.subtitle}
              </p>
            </RevealSection>
            <div className="space-y-3 md:space-y-4">
              {t.faq.items.map((faq, i) => (
                <RevealSection key={i}>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-5 md:py-[1.375rem] text-start flex items-start justify-between gap-5"
                    >
                      <span className="font-[var(--font-sans)] text-[15px] md:text-base text-[#e5e5e5] leading-snug pe-2 tracking-[-0.01em]">
                        {faq.q}
                      </span>
                      <span className="shrink-0 mt-0.5 text-[#737373] text-xl leading-none w-7 text-center tabular-nums font-light">
                        {openFaq === i ? "−" : "+"}
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-6 md:pb-7 pt-0">
                        <p className="font-[var(--font-sans)] text-[15px] text-[#9ca3a3] leading-[1.75] border-t border-white/[0.06] pt-5">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.03] bg-landing px-5 py-14 text-center">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#525252]">{t.footer}</p>
        </footer>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <LandingLocaleProvider>
      <LandingPageInner />
    </LandingLocaleProvider>
  )
}
