"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { RevealSection } from "@/components/RevealSection"
import { QRCodeSVG } from "qrcode.react"

const FAQ_ITEMS = [
  {
    q: "What is Aeterna and how does it work?",
    a: "Aeterna is a digital vault to commemorate the life of a loved one. You create a memorial space, share a link or QR code with family and friends, and they can upload photos, videos, and messages. Everything is gathered in one dignified place—no social feed, no ads—so you can revisit and preserve memories.",
  },
  {
    q: "Can I use Aeterna on an iPhone?",
    a: "Yes, you can. Aeterna works in your phone’s browser on iPhone (and Android). You can create your vault, share the QR code, and let visitors upload memories from their phones without installing an app.",
  },
  {
    q: "How do I create a vault on Aeterna?",
    a: "You can sign in on the web, create your account, set up the basics (your loved one’s name and a few details), and start sharing the QR code or link with visitors. They can then open the page and upload memories to the vault.",
  },
  {
    q: "Can visitors join without downloading the app?",
    a: "Yes. Visitors can simply scan the QR code or open the link you share. They’ll land on the memorial page in their browser and can upload photos and messages there—no app download required.",
  },
  {
    q: "Who can see the photos I upload?",
    a: "You can set content to be private (only you) or shared with anyone who has the QR code or invitation link. Without the invitation, people cannot see or join the vault.",
  },
  {
    q: "How long can I keep the archive after the funeral?",
    a: "If you subscribe to our premium feature, you can store the vault forever. Our free tier includes a limited-time archive; premium gives you permanent storage.",
  },
  {
    q: "Can I download photos and videos after the funeral?",
    a: "Yes, you can. From your family dashboard you can download the photos and videos that were shared to the vault.",
  },
  {
    q: "Why is it called Aeterna?",
    a: "Aeterna is the Latin word for “eternal.” We want to serve as an eternal vault for the memories of your loved ones.",
  },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [createUrl, setCreateUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") setCreateUrl(`${window.location.origin}/create`)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative min-h-screen w-full bg-[var(--aeterna-charcoal)] text-[var(--aeterna-body)]">
      {/* Header: 배경·로고 영역 모두 랜딩과 동일한 #0A0A0A로 통일 */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 bg-[var(--aeterna-charcoal)] border-b border-[var(--border-gold-subtle)]">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-[var(--aeterna-charcoal)] translate-y-0.5">
            <img
              src="/aeterna-logo.png"
              alt="Aeterna"
              className="w-full h-full object-contain block"
              aria-hidden
            />
          </div>
          <span className="font-serif font-bold text-xl md:text-2xl tracking-[0.12em] text-[var(--aeterna-gold)] leading-none">Aeterna</span>
        </div>
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 md:gap-10">
          <button type="button" onClick={() => scrollTo("how-it-works")} className="font-sans font-bold text-xs md:text-sm tracking-[0.14em] uppercase text-[var(--aeterna-headline)]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            How it works
          </button>
          <button type="button" onClick={() => scrollTo("faq")} className="font-sans font-bold text-xs md:text-sm tracking-[0.14em] uppercase text-[var(--aeterna-headline)]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            FAQ
          </button>
          <button type="button" onClick={() => scrollTo("pricing")} className="font-sans font-bold text-xs md:text-sm tracking-[0.14em] uppercase text-[var(--aeterna-headline)]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            Pricing
          </button>
        </nav>
        <div className="w-[120px] md:w-[140px]" aria-hidden />
      </header>

      {/* Sticky QR – right side, does not move on scroll */}
      <aside
        className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center justify-center w-[200px]"
        aria-label="Start using Aeterna"
      >
        <div className="rounded-[32px] bg-[var(--aeterna-charcoal-soft)]/95 border border-[var(--border-gold-subtle)] p-6 shadow-[var(--shadow-deep)] flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-white p-4">
            {createUrl ? (
              <QRCodeSVG value={createUrl} size={140} level="M" className="rounded-lg" />
            ) : (
              <div className="w-[140px] h-[140px] bg-gray-200 rounded-lg animate-pulse" />
            )}
          </div>
          <p className="font-serif text-sm tracking-[0.2em] uppercase text-[var(--aeterna-gold)] text-center">
            Start using Aeterna
          </p>
        </div>
      </aside>

      {/* Background video / image */}
      <div className="absolute inset-0 -z-10">
        <video
          className="w-full h-full object-cover grayscale-[0.7] opacity-90"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/media/aeterna-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--aeterna-charcoal)]/80 via-[var(--aeterna-charcoal)]/50 to-[var(--aeterna-charcoal)]/95" />
      </div>

      {/* Main scrollable content – leave space for sticky QR on large screens; pt for fixed header */}
      <div className="relative pr-0 lg:pr-[240px] pt-[68px] md:pt-[72px]">
        {/* Hero: left = iPhone mockups with wholesome elder imagery, right = headline + CTA */}
        <main className="relative flex min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)] items-center justify-center pl-4 pr-8 md:pl-6 md:pr-16 py-16 lg:pl-8">
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-4 lg:gap-5">
            {/* Left: iPhone mockups – grandma phone larger, tight gap to text */}
            <RevealSection className="hidden lg:flex flex-1 justify-start items-center min-w-0">
              <div className="relative -ml-2 flex items-end gap-0">
                {/* Back phone (man) – partly covered by grandma */}
                <div className="relative z-0 rounded-[3rem] border-[14px] border-[var(--aeterna-charcoal-muted)] bg-[var(--aeterna-charcoal-soft)] p-2 shadow-[var(--shadow-deep)] w-[260px] translate-x-0 translate-y-8">
                  <div className="rounded-[2.5rem] overflow-hidden bg-[var(--aeterna-charcoal)] aspect-[9/19]">
                    <img
                      src="https://images.unsplash.com/photo-1609220136736-443140cffec6?w=560&q=85"
                      alt=""
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                {/* Front phone (grandma) – fills screen; image composed with face centered */}
                <div className="relative z-10 -ml-24 rounded-[3rem] border-[14px] border-[var(--aeterna-charcoal-muted)] bg-[var(--aeterna-charcoal-soft)] p-2 shadow-[var(--shadow-deep)] w-[280px]">
                  <div className="rounded-[2.5rem] overflow-hidden bg-[var(--aeterna-charcoal)] aspect-[9/19]">
                    <img
                      src="/hero-elder-portrait.png"
                      alt=""
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            </RevealSection>
            {/* Right: headline + CTA */}
            <RevealSection className="flex-1 max-w-3xl text-center lg:text-left flex flex-col items-center lg:items-start">
              <p className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold-muted)] mb-6">
                THE LEGACY VAULT
              </p>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.2em] leading-relaxed text-[var(--aeterna-headline)] mb-6 md:mb-8">
                A quiet space<br className="hidden lg:block" />to honor a life well lived.
              </h1>
              <p className="font-sans text-sm md:text-base text-[var(--aeterna-body)] leading-relaxed max-w-xl mb-12">
                For families, friends, and funeral homes who want something more dignified than a social feed. One
                simple link for memories, photos, and support.
              </p>
              <div className="flex w-full max-w-md lg:max-w-none">
                <a
                  href="https://apps.apple.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex w-full items-center justify-center gap-3 min-h-[56px] px-6 sm:px-10 py-4 rounded-[999px] border border-[var(--aeterna-gold)]/70 text-[var(--aeterna-gold)] font-serif text-xs md:text-sm tracking-[0.22em] uppercase bg-transparent hover:bg-[var(--aeterna-gold-pale)] hover:border-[var(--aeterna-gold)] transition-colors"
                >
                  <span className="inline-flex items-center justify-center rounded-full bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] w-7 h-7 text-base">
                    
                  </span>
                  <span className="text-center">
                    Start a Memorial on the App Store
                  </span>
                </a>
              </div>
            </RevealSection>
          </div>
        </main>

        {/* How it works */}
        <section id="how-it-works" className="relative py-24 md:py-32 px-8 md:px-16 border-t border-[var(--border-gold-subtle)] scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-16">
              <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-4">
                How it works
              </p>
              <h2 className="font-serif text-2xl md:text-4xl font-light text-[var(--aeterna-headline)] tracking-tight">
                Three simple steps to your legacy vault
              </h2>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {[
                { step: 1, title: "Create your vault", desc: "Sign in, add your loved one’s name, and set up your memorial in minutes.", image: "/how-it-works/step1.png" },
                { step: 2, title: "Share the link or QR", desc: "Send the memorial link or show the QR code at the service so guests can open it on their phones.", image: "/how-it-works/step2.png" },
                { step: 3, title: "Collect memories", desc: "Guests upload photos, videos, and messages from their browser—no app needed.", image: "/how-it-works/step3.png" },
              ].map((item) => (
                <RevealSection key={item.step} className="flex flex-col items-center text-center">
                  <div className="relative w-full max-w-[260px] mx-auto mb-6">
                    <div className="rounded-[2.5rem] border-[10px] border-[var(--aeterna-charcoal-muted)] bg-[var(--aeterna-charcoal-soft)] p-2 shadow-[var(--shadow-deep)]">
                      <div className="rounded-[2rem] overflow-hidden bg-[var(--aeterna-charcoal)] aspect-[9/19]">
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[var(--aeterna-gold)] flex items-center justify-center font-serif text-lg font-light text-[var(--aeterna-charcoal)]">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="font-serif text-lg font-light text-[var(--aeterna-headline)] mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-[var(--aeterna-gold-muted)] leading-relaxed max-w-[280px]">
                    {item.desc}
                  </p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative py-24 md:py-32 px-8 md:px-16 border-t border-[var(--border-gold-subtle)] scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <RevealSection className="text-center mb-16">
              <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-4">
                FAQ
              </p>
              <h2 className="font-serif text-2xl md:text-4xl font-light text-[var(--aeterna-headline)] tracking-tight">
                Questions and answers
              </h2>
            </RevealSection>
            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, i) => (
                <RevealSection key={i}>
                  <div
                    className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)]/60 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
                    >
                      <span className="font-serif text-[var(--aeterna-headline)] text-sm md:text-base pr-4">{faq.q}</span>
                      <span className="shrink-0 w-8 h-8 rounded-full border border-[var(--aeterna-gold)]/50 flex items-center justify-center text-[var(--aeterna-gold)] text-lg transition-transform duration-200" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>
                        +
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-5 pt-0">
                        <p className="font-sans text-sm text-[var(--aeterna-gold-muted)] leading-relaxed border-t border-[var(--border-gold-subtle)] pt-4">
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

        {/* Pricing – 3 tiers */}
        <section id="pricing" className="relative py-24 md:py-32 px-8 md:px-16 border-t border-[var(--border-gold-subtle)] scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-16">
              <p className="font-serif text-[11px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-4">
                Pricing
              </p>
              <h2 className="font-serif text-2xl md:text-4xl font-light text-[var(--aeterna-headline)] tracking-tight mb-3">
                Simple, transparent plans
              </h2>
              <p className="font-sans text-xs md:text-sm text-[var(--aeterna-body)] max-w-xl mx-auto">
                Memorials are hosted long-term. If we ever discontinue the service, families will receive a full export of all photos, videos, and messages.
              </p>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: "Monthly", price: "$9", period: "/month", cta: "Subscribe", highlight: false },
                { name: "Annual", price: "$99", period: "/year", sub: "Save $9 — was $108", cta: "Subscribe", highlight: true },
                { name: "Lifetime", price: "$199", period: " one-time", cta: "Get lifetime", highlight: false },
              ].map((tier) => (
                <RevealSection key={tier.name}>
                  <div className={`rounded-[28px] border bg-[var(--aeterna-charcoal-soft)]/80 p-6 md:p-8 flex flex-col h-full ${tier.highlight ? "border-[var(--aeterna-gold)]/60" : "border-[var(--border-gold-subtle)]"}`}>
                    {tier.highlight && (
                      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--aeterna-gold)] mb-2">Best value</p>
                    )}
                    <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-[var(--aeterna-gold-muted)] mb-1">{tier.name}</p>
                    <p className="font-serif text-3xl font-light text-[var(--aeterna-headline)] mb-0.5">
                      {tier.price}<span className="text-lg text-[var(--aeterna-body)]">{tier.period}</span>
                    </p>
                    {tier.sub && <p className="font-sans text-xs text-[var(--aeterna-gold)] mb-4">{tier.sub}</p>}
                    <ul className="font-sans text-sm text-[var(--aeterna-gold-muted)] leading-relaxed space-y-2 mb-8 flex-1">
                      <li>• Customizable archive for the deceased</li>
                      <li>• Digital obituary with QR code for visitors to upload photos &amp; videos</li>
                      <li>• Real-time presentation with content from family &amp; friends, optimizable with AI</li>
                      <li>• Forever archive of all content for your loved ones</li>
                    </ul>
                    <Link
                      href="/create"
                      className={`min-h-[48px] px-6 py-3 rounded-[999px] font-serif text-sm tracking-[0.18em] uppercase text-center transition-colors ${tier.highlight ? "bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] hover:bg-[var(--aeterna-gold-light)]" : "border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold-pale)]"}`}
                    >
                      {tier.cta}
                    </Link>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 md:py-20 px-8 text-center border-t border-[var(--border-gold-subtle)]">
          <p className="text-[10px] md:text-xs text-[var(--aeterna-gold)]/50 tracking-[0.24em] uppercase font-sans">
            For Funeral Homes &amp; Care Providers · partnerships@aeterna.com
          </p>
        </footer>
      </div>
    </div>
  )
}
