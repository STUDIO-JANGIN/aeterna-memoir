"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Clock, Heart, QrCode, Sparkles } from "lucide-react"
import { RevealSection } from "@/components/RevealSection"
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

const FAQ_ITEMS = [
  {
    q: "How does Aeterna work?",
    a: "Aeterna is a digital shrine. Create a space, share a QR or link, and let family and friends add photos and stories. No app needed; they just scan and contribute. The first 7 days are a free window to gather memories. Upgrade anytime to preserve the shrine forever.",
  },
  {
    q: "Is it for pets too?",
    a: "Yes. We believe every soul that leaves footprints on our hearts—human or pet—deserves a sacred space.",
  },
  {
    q: "Can guests participate without an app?",
    a: "Absolutely. Anyone with the link or QR can open it in their browser, upload a photo, and leave a heart or comment instantly.",
  },
  {
    q: "What is the 'AI Tribute Film'?",
    a: "It's our upcoming V2 feature. It will transform the community's most-loved photos into a cinematic 1-minute film. Pre-order is available with The Eternal Film (V2) tier.",
  },
]

/** Screen-reader summaries (match column mockups + copy). */
const STEP_FLOW_LABELS = [
  "Create a digital shrine: a dignified memorial for your loved one or pet.",
  "Scan and share: QR at the service or a link—guests upload photos and stories, no app required.",
  "Connect and relive: the community hearts favorite memories; the most-loved stories rise to the top.",
] as const

const HOW_IT_WORKS_STEPS = [
  {
    title: "Create a Digital Shrine",
    description:
      "Build a dignified memorial space for your loved one or pet in seconds.",
    Icon: Sparkles,
    mockup: "create" as const,
  },
  {
    title: "Scan & Share",
    description:
      "Place a QR code at the service or share a link. Guests upload photos and stories instantly—no app required.",
    Icon: QrCode,
    mockup: "qr" as const,
  },
  {
    title: "Connect & Relive",
    description:
      "The community hearts their favorite memories, and the most-loved stories rise to the top.",
    Icon: Heart,
    mockup: "connect" as const,
  },
] as const

type PlanRow = {
  tierName: string
  price: string
  value: string
  cta: string
  href: string
  emphasis: "subtle" | "gold"
  planLabel?: string
  statusTag?: string
}

const PLANS: PlanRow[] = [
  {
    tierName: "Sacred Window",
    price: "$0",
    value: "7 days to gather memories. A gentle, peaceful start.",
    cta: "Start",
    href: "/create?plan=free",
    emphasis: "subtle",
  },
  {
    tierName: "Eternal Legacy",
    price: "$19.99",
    value: "Keep every photo and story preserved forever. No expiration.",
    cta: "Select",
    href: "/create?plan=forever",
    emphasis: "gold",
  },
  {
    tierName: "The Eternal Film (V2)",
    statusTag: "PRE-ORDER / COMING SOON",
    price: "$39.99",
    value:
      "Everything in Legacy, plus priority access to your 1-minute AI tribute film once V2 launches.",
    cta: "Select",
    href: "/create?plan=film",
    emphasis: "subtle",
  },
]

/** Same footprint + shared baseline: phones align on one horizontal line on md+. */
function HowItWorksMockup({ mockup }: { mockup: (typeof HOW_IT_WORKS_STEPS)[number]["mockup"] }) {
  const shellClass = "shadow-[0_32px_80px_rgba(0,0,0,0.45)]"
  const slotClass =
    "flex h-full min-h-[min(400px,56vw)] w-full items-end justify-center md:min-h-[448px]"

  const phone = (inner: ReactNode) => (
    <div className={slotClass}>
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

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [videoError, setVideoError] = useState(false)
  const hasVideo = !!LANDING_BACKGROUND_VIDEO_URL
  const showPlaceholder = !hasVideo || videoError

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative min-h-dvh w-full bg-landing text-[#9a9a9a]">
      {/* once.film–inspired: calm, editorial, lots of air — nav centered, logo / CTA balanced */}
      <header className="fixed top-0 left-0 right-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10 py-5 bg-[color:var(--landing-bg)]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-2 justify-self-start min-w-0">
          <img src="/aeterna-logo.png" alt="Aeterna" className="w-7 h-7 md:w-8 md:h-8 object-contain opacity-90" />
          <span className="font-[var(--font-display)] text-sm md:text-base tracking-[0.12em] uppercase text-[#e8e4dc]">Aeterna</span>
        </div>
        <nav className="flex items-center justify-center gap-3 sm:gap-5 md:gap-10 justify-self-center min-w-0">
          <button type="button" onClick={() => scrollTo("how-it-works")} className="text-landing-nav hover:text-[#e8e4dc] transition-colors">
            How it works
          </button>
          <button type="button" onClick={() => scrollTo("pricing")} className="text-landing-nav hover:text-[#e8e4dc] transition-colors">
            Pricing
          </button>
          <button type="button" onClick={() => scrollTo("faq")} className="text-landing-nav hover:text-[#e8e4dc] transition-colors">
            FAQ
          </button>
        </nav>
        <div className="flex items-center justify-end justify-self-end shrink-0">
          <Link
            href="/create"
            className="inline-flex min-h-[34px] md:min-h-[40px] items-center rounded-full border border-white/[0.1] bg-black px-3 sm:px-4 md:px-5 text-[9px] sm:text-[10px] font-medium tracking-[0.14em] sm:tracking-[0.16em] uppercase text-[#f5f5f4] hover:bg-neutral-950 transition-colors"
          >
            Create
          </Link>
        </div>
      </header>

      {/* Background */}
      <div className="absolute inset-0 z-0 min-h-dvh pointer-events-none">
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
            {/* Tonal overlay — same hue as --landing-bg so video grade matches the scroll canvas */}
            <div className="absolute inset-0 z-[1] bg-[color:var(--landing-bg)]/50 pointer-events-none" />
          </>
        )}
        {/* Multi-stop fade: video/poster → solid canvas (extends past 100dvh for smooth first scroll) */}
        <div aria-hidden className="landing-hero-vignette" />
      </div>

      <div className="relative z-10 pt-[76px]">
        {/* Hero: copy + mockups */}
        <main className="px-5 md:px-10 pt-10 pb-20 md:pt-20 md:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-2 lg:gap-12 xl:gap-16 lg:items-center lg:gap-y-0">
              {/* Value proposition — always on top on mobile; left column on desktop */}
              <div className="relative z-20 order-1 flex flex-col items-center text-center lg:items-start lg:text-left px-1 sm:px-2 pb-4 sm:pb-10 lg:pb-0">
                <RevealSection className="w-full max-w-xl mx-auto lg:mx-0 lg:max-w-xl space-y-0">
                  <h1 className="text-landing-hero font-semibold text-balance max-md:!text-[clamp(1.35rem,4vw,1.7rem)] max-md:!leading-[1.3] max-md:tracking-[-0.015em] md:leading-[1.1]">
                    A Digital Shrine for Sacred Memory
                  </h1>
                  <p className="mt-5 md:mt-8 text-sm md:text-lg leading-[1.68] md:leading-relaxed text-[#b8b8b8] font-[var(--font-sans)] max-w-xl mx-auto lg:mx-0 text-balance">
                    A lasting space for people and pets—preserved with dignity. Share instantly by QR or link: no app, no friction; guests add photos and stories from any phone. A gentle memorial feed where visitors heart and comment on each memory—like a sacred timeline of their legacy.
                  </p>
                  <p className="mt-5 md:mt-4 text-[11px] md:text-sm leading-[1.62] md:leading-relaxed font-[var(--font-sans)] max-w-xl mx-auto lg:mx-0 text-balance italic text-[#f0ebe3] [text-shadow:0px_2px_10px_rgba(0,0,0,0.8)]">
                    Footprints, remembrance, and preservation—in one hallowed place.
                  </p>
                </RevealSection>
                <RevealSection className="mt-12 w-full max-w-xl mx-auto lg:mx-0 pt-2 md:mt-10 md:pt-0 border-t border-white/[0.06] md:border-0">
                  <Link
                    href="/create"
                    className="inline-flex min-h-[50px] md:min-h-[54px] w-full sm:w-auto items-center justify-center rounded-full bg-[var(--aeterna-gold)] px-8 md:px-14 text-[10px] md:text-[11px] font-semibold tracking-[0.16em] uppercase text-[#0c0c0c] border border-[var(--aeterna-gold)] shadow-[0_16px_50px_-6px_rgba(197,160,89,0.42)] hover:bg-[var(--aeterna-gold-light)] hover:shadow-[0_20px_56px_-4px_rgba(197,160,89,0.5)] transition-all duration-300"
                  >
                    Create a Memorial Now
                  </Link>
                </RevealSection>
              </div>

              {/* iPhone mockups — own column / region; contained so text never sits underneath */}
              <RevealSection className="order-2 relative z-10 w-full flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[min(100%,400px)] lg:max-w-[440px] h-[min(380px,78vw)] sm:h-[420px] md:h-[440px] lg:h-[min(480px,52vh)] isolate">
                  {/* Foreground mockup — inclusive elder portrait (faces kept below Dynamic Island) */}
                  <div
                    className="absolute right-0 top-4 z-20 w-[56%] min-w-[180px] sm:top-6 sm:w-[54%]"
                    style={{ transform: "perspective(1600px) rotateY(-11deg) rotateZ(2deg)" }}
                  >
                    <IPhoneShell className="origin-center">
                      <img
                        src="/landing-hero-blasian-patriarch.png"
                        alt="Warm portrait of a dignified elder, representing inclusive remembrance"
                        className="absolute inset-0 z-0 h-full w-full object-cover object-[center_22%]"
                        width={900}
                        height={1950}
                        loading="eager"
                        decoding="async"
                      />
                      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
                    </IPhoneShell>
                  </div>
                  {/* Pets — background */}
                  <div
                    className="absolute bottom-4 left-0 z-10 w-[52%] min-w-[170px] sm:bottom-6 sm:w-[50%]"
                    style={{ transform: "perspective(1600px) rotateY(-7deg) rotateZ(-3deg)" }}
                  >
                    <IPhoneShell className="origin-center shadow-[0_28px_72px_rgba(0,0,0,0.48)]">
                      <img
                        src="/landing-hero-pets.png"
                        alt=""
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

        {/* How it works — 3-column scan (icons + bold headers + mockups) */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-landing px-5 py-16 md:px-10 md:py-28"
        >
          <div className="max-w-6xl mx-auto">
            <RevealSection className="text-center mb-12 md:mb-20">
              <p className="text-[9px] md:text-[10px] tracking-[0.32em] md:tracking-[0.35em] uppercase text-[#737373] mb-5 md:mb-4">
                How it works
              </p>
              <h2 className="font-[var(--font-serif)] text-[1.35rem] leading-[1.35] sm:text-2xl md:text-[2rem] md:leading-tight text-[#e8e4dc] font-normal tracking-tight text-balance px-1">
                Shrine · Share · Gather
              </h2>
              <p className="mt-5 max-w-2xl mx-auto px-2 text-xs md:text-sm leading-[1.65] text-[#8a8a8a] font-[var(--font-sans)] text-balance">
                Three pillars: a digital shrine for humans and pets; zero-friction access by QR or link with no app; and a community memorial where visitors heart and comment—so the moments that matter stay in view.
              </p>
              <p className="sr-only">
                Core flow in seconds: create a digital shrine, share by QR or link with no download, guests upload from mobile; community hearts and comments on memories.
              </p>
            </RevealSection>

            <ol className="m-0 grid list-none grid-cols-1 gap-16 p-0 md:grid-cols-3 md:items-stretch md:gap-8 lg:gap-12">
              {HOW_IT_WORKS_STEPS.map((step, i) => {
                const Icon = step.Icon
                return (
                  <li
                    key={step.title}
                    className="relative flex list-none flex-col items-center text-center md:h-full md:min-h-[560px] lg:min-h-[600px]"
                  >
                    <span className="sr-only">{STEP_FLOW_LABELS[i]}</span>
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
                        <HowItWorksMockup mockup={step.mockup} />
                      </div>
                    </RevealSection>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Time window — quiet, not alarmist */}
        <section className="border-t border-white/[0.03] bg-landing px-5 py-16 md:px-10">
          <RevealSection className="max-w-xl mx-auto text-center">
            <div className="inline-flex items-center justify-center gap-2 text-[#737373] mb-4">
              <Clock className="h-4 w-4" strokeWidth={1} aria-hidden />
              <span className="text-[10px] tracking-[0.3em] uppercase">First seven days</span>
            </div>
            <p className="font-[var(--font-serif)] text-lg md:text-xl text-[#a3a3a3] leading-relaxed">
              The first 7 days are a free window to gather memories. Upgrade anytime to preserve the shrine forever.
            </p>
          </RevealSection>
        </section>

        {/* Pricing — extremely simple */}
        <section
          id="pricing"
          className="scroll-mt-24 border-t border-white/[0.03] bg-landing px-5 py-20 md:px-10 md:py-28"
        >
          <div className="max-w-3xl mx-auto">
            <RevealSection className="text-center mb-14">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#737373] mb-4">Pricing</p>
              <h2 className="font-[var(--font-serif)] text-2xl md:text-[2rem] text-[#e8e4dc] font-normal">Sacred preservation. One-time.</h2>
            </RevealSection>

            <p className="text-center text-xs text-[#737373] mb-8">All prices in US dollars (USD).</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
              {PLANS.map((plan) => (
                <RevealSection key={plan.price}>
                  <div
                    className={`rounded-2xl border px-6 py-8 text-center h-full flex flex-col ${
                      plan.emphasis === "gold"
                        ? "border-[var(--aeterna-gold)]/35 bg-[var(--aeterna-gold)]/[0.04]"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <p className="font-[var(--font-display)] text-[10px] tracking-[0.18em] text-[#c4a86a] uppercase mb-1">
                      {plan.tierName}
                    </p>
                    {plan.planLabel ? (
                      <p className="font-[var(--font-display)] text-[9px] tracking-[0.22em] text-[#9a8a6e] uppercase mb-2">
                        {plan.planLabel}
                      </p>
                    ) : null}
                    {plan.statusTag ? (
                      <span className="mb-3 inline-flex max-w-[14rem] items-center justify-center self-center rounded-md border border-[var(--aeterna-gold)]/25 bg-[var(--aeterna-gold)]/[0.08] px-2.5 py-1 text-[7px] font-semibold uppercase leading-snug tracking-[0.18em] text-[#d8c896]">
                        {plan.statusTag}
                      </span>
                    ) : null}
                    <p className="font-[var(--font-serif)] text-3xl md:text-4xl text-[#f4f1ea] tabular-nums">
                      {plan.price}{" "}
                      <span className="text-lg font-normal text-white/35 md:text-xl">USD</span>
                    </p>
                    <p className="mt-4 font-[var(--font-sans)] text-sm text-[#a3a3a3] leading-snug">{plan.value}</p>
                    <div className="flex-1" />
                    <Link
                      href={plan.href}
                      className={`mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full text-[10px] tracking-[0.16em] uppercase font-medium transition-colors ${
                        plan.emphasis === "gold"
                          ? "bg-[var(--aeterna-gold)] text-[color:var(--landing-bg)] hover:bg-[var(--aeterna-gold-light)]"
                          : "border border-white/[0.12] text-[#e8e4dc] hover:bg-white/[0.04]"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-white/[0.03] bg-landing px-5 py-20 md:px-10 md:py-28"
        >
          <div className="max-w-2xl mx-auto">
            <RevealSection className="text-center mb-12">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#737373] mb-4">FAQ</p>
              <h2 className="font-[var(--font-serif)] text-2xl md:text-[2rem] text-[#e8e4dc] font-normal">Guidance</h2>
            </RevealSection>
            <div className="space-y-2">
              {FAQ_ITEMS.map((faq, i) => (
                <RevealSection key={i}>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 text-left flex items-center justify-between gap-4">
                      <span className="font-[var(--font-sans)] text-sm text-[#d4d4d4] pr-2">{faq.q}</span>
                      <span className="shrink-0 text-[#737373] text-lg leading-none w-6 text-center">{openFaq === i ? "−" : "+"}</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-5 pt-0">
                        <p className="font-[var(--font-sans)] text-sm text-[#737373] leading-relaxed border-t border-white/[0.06] pt-4">{faq.a}</p>
                      </div>
                    )}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.03] bg-landing px-5 py-14 text-center">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#525252]">
            For celebration-of-life professionals & care providers · partnerships@aeterna.com
          </p>
        </footer>
      </div>
    </div>
  )
}
