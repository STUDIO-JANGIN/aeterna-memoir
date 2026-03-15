"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { RevealSection } from "@/components/RevealSection"
import { QRCodeSVG } from "qrcode.react"

const LANDING_BACKGROUND_VIDEO_URL = process.env.NEXT_PUBLIC_LANDING_BACKGROUND_VIDEO_URL ?? ""
const LANDING_BACKGROUND_POSTER_URL =
  process.env.NEXT_PUBLIC_LANDING_BACKGROUND_POSTER_URL ??
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80"

const FAQ_ITEMS = [
  { q: "How does Aeterna work?", a: "We know how overwhelming loss can be. Aeterna gives you a gentle way to gather memories: create a space, share a link or QR with family and friends, and they can add one photo and a short story. Others can like and vote. When you’re ready, the top 20 can become a Luma AI tribute film—so their light stays with you, in a way that feels dignified and lasting." },
  { q: "What happens with the free tier?", a: "We wanted the first 7 days to feel sacred and unpressured. Your memorial is a safe place to collect photos and stories. If you’d like to keep it forever—and, with Premium, add an AI tribute film—you can upgrade when the time feels right. There’s no wrong choice; we’re here to support you." },
  { q: "What is the Luma AI tribute film?", a: "It’s a short, cinematic film made from the top 20 most-loved photos—peaceful, slow, and dignified. Many families tell us it feels like a final gift: a way to see their person or pet in motion again, and to keep that moment forever. Premium includes one film per memorial." },
  { q: "Can guests participate without an app?", a: "Yes. We made it simple for everyone. Anyone with the link or QR code can open the memorial in their browser, add a photo and story, and leave a like—no app download. We wanted even the least tech-savvy relative to be able to contribute without stress." },
  { q: "What about donations (memorial fund)?", a: "If you choose to accept donations, they can be given by card, Apple Pay, or Google Pay. We’re transparent: a 1% platform fee helps us keep Aeterna running and support more families. Every contribution goes to the cause you set." },
  { q: "Why Aeterna?", a: "Aeterna means 'eternal' in Latin. We built it because we believe the people and pets we love deserve more than a folder of photos—they deserve a place that feels sacred, shared, and lasting. However you choose to remember them, we’re here to hold that space with you." },
]

function IconClock({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function IconFilm({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
    </svg>
  )
}

function IconShare({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <path d="M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )
}

function IconHeart({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function IconAlert({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [createUrl, setCreateUrl] = useState("")
  const [videoError, setVideoError] = useState(false)
  const hasVideo = !!LANDING_BACKGROUND_VIDEO_URL
  const showPlaceholder = !hasVideo || videoError

  useEffect(() => {
    if (typeof window !== "undefined") setCreateUrl(`${window.location.origin}/create`)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-[#A0A0A0]">
      {/* ─── Header: Bold & minimal ─── */}
      <header className="fixed top-0 left-0 right-0 z-40 grid grid-cols-3 items-center px-5 md:px-10 py-4 bg-[#020617]/95 backdrop-blur-md border-b border-[var(--border-gold-subtle)]">
        <div className="flex items-center gap-2">
          <img src="/aeterna-logo.png" alt="Aeterna" className="w-8 h-8 md:w-9 md:h-9 object-contain" />
          <span className="font-[var(--font-display)] font-bold text-xl md:text-2xl tracking-tight text-[var(--aeterna-gold)]">AETERNA</span>
        </div>
        <nav className="flex items-center justify-center gap-4 md:gap-10 justify-self-center">
          <button type="button" onClick={() => scrollTo("how-it-works")} className="font-[var(--font-display)] font-bold text-xs md:text-sm tracking-wide uppercase text-[#F4F1EA]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            How it works
          </button>
          <button type="button" onClick={() => scrollTo("pricing")} className="font-[var(--font-display)] font-bold text-xs md:text-sm tracking-wide uppercase text-[#F4F1EA]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            Pricing
          </button>
          <button type="button" onClick={() => scrollTo("faq")} className="font-[var(--font-display)] font-bold text-xs md:text-sm tracking-wide uppercase text-[#F4F1EA]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            FAQ
          </button>
        </nav>
        <div />
      </header>

      {/* ─── Sticky CTA + QR (right) ─── */}
      <aside className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center w-[180px]" aria-label="Get started">
        <div className="rounded-3xl bg-[#0b1220] border border-[var(--border-gold-subtle)] p-5 shadow-2xl flex flex-col items-center gap-3">
          {createUrl ? <QRCodeSVG value={createUrl} size={120} level="M" className="rounded-xl" /> : <div className="w-[120px] h-[120px] bg-white/10 rounded-xl animate-pulse" />}
          <Link href="/create" className="w-full min-h-[40px] px-4 py-2 rounded-full bg-[var(--aeterna-gold)] text-[#020617] font-[var(--font-display)] font-bold text-xs uppercase text-center hover:bg-[var(--aeterna-gold-light)] transition-colors">
            Create a memorial
          </Link>
        </div>
      </aside>

      {/* ─── Background video / image ─── */}
      <div className="absolute inset-0 z-0 min-h-screen">
        <div className={`absolute inset-0 transition-opacity ${showPlaceholder ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/80 to-[#020617]" />
          <img src={LANDING_BACKGROUND_POSTER_URL} alt="" className="absolute inset-0 w-full h-full object-cover grayscale opacity-30" fetchPriority="high" />
        </div>
        {hasVideo && (
          <video className="absolute inset-0 w-full h-full object-cover grayscale-[0.6] opacity-70" autoPlay loop muted playsInline poster={LANDING_BACKGROUND_POSTER_URL} onError={() => setVideoError(true)}>
            <source src={LANDING_BACKGROUND_VIDEO_URL} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#020617]/60 via-transparent to-[#020617] pointer-events-none" />
      </div>

      <div className="relative z-10 pr-0 lg:pr-[220px] pt-[72px]">
        {/* ─── Hero: Bold headline + dual message ─── */}
        <main className="min-h-[85vh] flex flex-col justify-center px-5 md:px-12 py-20 md:py-28">
          <RevealSection className="max-w-4xl">
            <p className="font-[var(--font-display)] font-bold text-[11px] md:text-xs uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-4">Digital memorial · AI tribute film</p>
            <h1 className="font-[var(--font-display)] font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight text-[#F4F1EA] leading-[1.1] mb-6">
              Remember your loved ones
            </h1>
            <p className="font-sans text-base md:text-lg text-[#A0A0A0] max-w-xl mb-10 leading-relaxed">
              Both human and pets—through the lens of others. Create a tribute film from the photos and stories that matter most.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/create" className="inline-flex items-center gap-2 min-h-[56px] px-8 py-4 rounded-2xl bg-[var(--aeterna-gold)] text-[#020617] font-[var(--font-display)] font-semibold md:font-bold text-sm uppercase tracking-wide hover:bg-[var(--aeterna-gold-light)] transition-colors shadow-lg">
                Create a memorial
              </Link>
              <button type="button" onClick={() => scrollTo("pricing")} className="inline-flex items-center gap-2 min-h-[56px] px-8 py-4 rounded-2xl border-2 border-[var(--aeterna-gold)]/60 text-[var(--aeterna-gold)] font-[var(--font-display)] font-semibold md:font-bold text-sm uppercase tracking-wide hover:bg-[var(--aeterna-gold-pale)] transition-colors">
                Pricing
              </button>
            </div>
          </RevealSection>
        </main>

        {/* ─── How it works: 3 steps (first after hero) ─── */}
        <section id="how-it-works" className="px-5 md:px-12 py-20 md:py-28 border-t border-[var(--border-gold-subtle)] scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-14">
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-3">How it works</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] tracking-tight">Three steps to a memorial</h2>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {[
                { step: 1, title: "Create a profile", desc: "Add name, photo, dates, service or memorial fund details." },
                { step: 2, title: "Collect photos and stories via QR", desc: "Once profile is created, share the link or QR via messaging app or social media. Print a QR code on paper for the service." },
                { step: 3, title: "Create a short AI film with collected photos and stories", desc: "Guests can vote on the pictures. Top 20 are used to create an AI tribute film (premium feature)." },
              ].map((item) => (
                <RevealSection key={item.step} className="text-center md:text-left">
                  <div className="inline-flex flex-col items-center justify-start w-20 h-28 md:w-24 md:h-32 rounded-[2rem] bg-[#0b1220] border-4 border-[var(--aeterna-gold)]/30 mb-4 md:mb-5 overflow-hidden shadow-xl">
                    <div className="w-8 h-5 rounded-b-xl bg-[#0b1220] border-b border-x-4 border-[var(--aeterna-gold)]/20 shrink-0" />
                    <div className="flex-1 w-full bg-[var(--aeterna-gold)]/5 flex items-center justify-center p-2">
                      <span className="text-[#A0A0A0]/40 text-[10px] md:text-xs font-sans text-center leading-tight">Memorial</span>
                    </div>
                  </div>
                  <h3 className="font-[var(--font-display)] font-bold text-lg md:text-xl text-[#F4F1EA] mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-[#A0A0A0] leading-relaxed">{item.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Initial archive window (red box: full width on mobile) ─── */}
        <section className="w-full px-5 md:px-12 py-16 md:py-24 border-y border-red-900/40 bg-gradient-to-b from-red-950/30 to-transparent">
          <RevealSection className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
            <div className="flex items-start justify-center md:justify-start w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-red-500/20 border-2 border-red-500/50 shrink-0">
              <IconClock className="w-10 h-10 md:w-12 md:h-12 text-red-400 mt-1 md:mt-2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.3em] text-red-400/90 mb-2">Initial archive window</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-white leading-tight mb-3">
                Preserve their light before<br />
                <span className="text-red-400">the first 7 days close.</span>
              </h2>
              <p className="font-sans text-base text-[#A0A0A0] max-w-xl">
                Upgrade to Plus ($19.99) or Premium ($39.99) for permanent preservation. Premium includes a Luma AI tribute film.
              </p>
            </div>
          </RevealSection>
        </section>

        {/* ─── Luma AI (gold, cinematic; same text size as above) ─── */}
        <section className="px-5 md:px-12 py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--aeterna-gold-pale)]/10 to-transparent pointer-events-none" />
          <RevealSection className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">
              <div className="flex items-start justify-center md:justify-start w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[var(--aeterna-gold)]/20 border-2 border-[var(--aeterna-gold)]/50 shrink-0">
                <IconFilm className="w-12 h-12 md:w-14 md:h-14 text-[var(--aeterna-gold)] mt-1 md:mt-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.3em] text-[var(--aeterna-gold)] mb-2">Luma AI</p>
                <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] leading-tight mb-3">
                  The top 20 most-loved photos<br />
                  <span className="text-[var(--aeterna-gold)]">become a cinematic tribute film.</span>
                </h2>
                <p className="font-sans text-base text-[#A0A0A0] max-w-xl leading-relaxed mb-6">
                  Peaceful, dignified tone—slow motion and soft light. Premium includes one Luma AI film per memorial, preserved forever.
                </p>
                <Link href="/create" className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[var(--aeterna-gold)]/90 text-[#020617] font-[var(--font-display)] font-semibold md:font-bold text-sm uppercase hover:bg-[var(--aeterna-gold)] transition-colors">
                  <IconFilm className="w-5 h-5 shrink-0" />
                  Create with Premium
                </Link>
              </div>
            </div>
          </RevealSection>
        </section>

        {/* ─── Pricing ─── */}
        <section id="pricing" className="px-5 md:px-12 py-20 md:py-28 border-t border-[var(--border-gold-subtle)] scroll-mt-24 bg-[#0b1220]/50">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-14">
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-3">Pricing</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] tracking-tight mb-2">Choose how to preserve</h2>
              <p className="font-sans text-sm text-[#A0A0A0] max-w-xl mx-auto">Aeterna is a premium digital memorial for all forms of life—whether family or pet. You create a digital shrine on our app, collect pics via QR, and create an AI tribute film with the most voted pics.</p>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: "Free Tier", price: "$0", period: "", cta: "Get started", highlight: false, features: ["All collected images and stories are viewable", "First 7 days of remembrance", "Preserve their light before the window closes"], urgent: true },
                { name: "Plus", price: "$19.99", period: " one-time", cta: "Choose Plus", highlight: true, features: ["Includes all the features of free tier", "Permanent preservation of memorial"], urgent: false },
                { name: "Premium", price: "$39.99", period: " one-time", cta: "Choose Premium", highlight: false, features: ["Everything in Plus", "Luma AI tribute film (top 20)"], urgent: false },
              ].map((plan) => (
                <RevealSection key={plan.name}>
                  <div className={`rounded-3xl border-2 bg-[#020617]/90 p-6 md:p-8 flex flex-col h-full ${plan.highlight ? "border-[var(--aeterna-gold)] shadow-[0_0_40px_rgba(197,160,89,0.12)]" : plan.urgent ? "border-amber-900/40" : "border-[var(--border-gold-subtle)]"}`}>
                    {plan.urgent && (
                      <div className="flex items-center gap-2 mb-3 text-amber-400/90">
                        <IconAlert className="w-5 h-5 shrink-0" />
                        <span className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-wider">First 7 days</span>
                      </div>
                    )}
                    {plan.highlight && <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-wider text-[var(--aeterna-gold)] mb-2">Recommended</p>}
                    <p className="font-[var(--font-display)] font-bold text-[11px] uppercase tracking-widest text-[#A0A0A0] mb-1">{plan.name}</p>
                    <p className="font-[var(--font-display)] font-extrabold text-3xl md:text-4xl text-[#F4F1EA] mb-0.5">
                      {plan.price}<span className="text-lg font-bold text-[#A0A0A0]">{plan.period}</span>
                    </p>
                    <ul className="font-sans text-sm text-[#A0A0A0] leading-relaxed space-y-2 mb-8 flex-1 mt-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-[var(--aeterna-gold)]">·</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/create" className={`min-h-[52px] px-6 py-3 rounded-xl font-[var(--font-display)] font-bold text-sm uppercase text-center transition-all ${plan.highlight ? "bg-[var(--aeterna-gold)] text-[#020617] hover:bg-[var(--aeterna-gold-light)]" : plan.urgent ? "border-2 border-amber-500/50 text-amber-300/90 hover:bg-amber-500/10" : "border-2 border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold-pale)]"}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="px-5 md:px-12 py-20 md:py-28 border-t border-[var(--border-gold-subtle)] scroll-mt-24">
          <div className="max-w-3xl mx-auto">
            <RevealSection className="text-center mb-12">
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-3">FAQ</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] tracking-tight">Questions and answers</h2>
            </RevealSection>
            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, i) => (
                <RevealSection key={i}>
                  <div className="rounded-2xl border-2 border-[var(--border-gold-subtle)] bg-[#0b1220]/60 overflow-hidden">
                    <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-5 text-left flex items-center justify-between gap-4">
                      <span className="font-[var(--font-display)] font-bold text-[#F4F1EA] text-sm md:text-base pr-4">{faq.q}</span>
                      <span className="shrink-0 w-9 h-9 rounded-full border-2 border-[var(--aeterna-gold)]/60 flex items-center justify-center text-[var(--aeterna-gold)] text-lg font-bold transition-transform duration-200" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5 pt-0">
                        <p className="font-sans text-sm text-[#A0A0A0] leading-relaxed border-t border-[var(--border-gold-subtle)] pt-4">{faq.a}</p>
                      </div>
                    )}
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="py-12 md:py-16 px-5 text-center border-t border-[var(--border-gold-subtle)]">
          <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.24em] text-[var(--aeterna-gold)]/60">
            For funeral homes and care providers · partnerships@aeterna.com
          </p>
        </footer>
      </div>
    </div>
  )
}
