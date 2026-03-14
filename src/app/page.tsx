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
  { q: "Aeterna는 어떻게 사용하나요?", a: "추모 공간을 만든 뒤 링크나 QR 코드를 지인에게 공유하세요. 지인은 사진 1장과 에피소드를 올리고, 좋아요로 투표합니다. 수집 기간 후 Top 20이 공개되고, Premium은 Luma AI 헌정 영상으로 영원히 남습니다." },
  { q: "무료 플랜은 어떻게 되나요?", a: "Free 플랜은 7일이 지나면 모든 데이터가 영구 삭제됩니다. 업그레이드하지 않으면 복구할 수 없습니다. Plus($19.99) 또는 Premium($39.99)으로 영구 보존할 수 있습니다." },
  { q: "Luma AI 영상이란?", a: "좋아요 순 Top 20 사진을 바탕으로 Luma AI가 제작하는 영화 같은 헌정 영상입니다. Premium 플랜에서 한 번에 1편 생성 가능하며, 평온하고 영화적인 톤으로 추억을 담습니다." },
  { q: "지인은 앱 설치 없이 참여할 수 있나요?", a: "네. QR 코드나 링크만 있으면 브라우저에서 바로 사진과 메시지를 올릴 수 있습니다. '당신의 사진이 AI 영상에 채택될 수 있습니다'로 참여를 유도합니다." },
  { q: "기부금(조의금)은 어떻게 되나요?", a: "기부 버튼으로 카드·Apple Pay·Google Pay 결제가 가능합니다. '가족을 위해 1% 수수료를 함께 부담해 주세요' 문구와 함께 Aeterna 운영 수수료 1%를 안내합니다." },
  { q: "왜 Aeterna인가요?", a: "Aeterna는 라틴어로 '영원한'이란 뜻입니다. 7일이라는 긴박함과, 업그레이드 시 Luma AI 영상으로 남는 아름다움이 대비되도록 설계했습니다." },
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
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 md:px-10 py-4 bg-[#020617]/95 backdrop-blur-md border-b border-[var(--border-gold-subtle)]">
        <div className="flex items-center gap-2">
          <img src="/aeterna-logo.png" alt="Aeterna" className="w-8 h-8 md:w-9 md:h-9 object-contain" />
          <span className="font-[var(--font-display)] font-bold text-xl md:text-2xl tracking-tight text-[var(--aeterna-gold)]">AETERNA</span>
        </div>
        <nav className="flex items-center gap-6 md:gap-10">
          <button type="button" onClick={() => scrollTo("how-it-works")} className="font-[var(--font-display)] font-bold text-xs md:text-sm tracking-wide uppercase text-[#F4F1EA]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            이용 방법
          </button>
          <button type="button" onClick={() => scrollTo("pricing")} className="font-[var(--font-display)] font-bold text-xs md:text-sm tracking-wide uppercase text-[#F4F1EA]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            요금제
          </button>
          <button type="button" onClick={() => scrollTo("faq")} className="font-[var(--font-display)] font-bold text-xs md:text-sm tracking-wide uppercase text-[#F4F1EA]/90 hover:text-[var(--aeterna-gold)] transition-colors">
            FAQ
          </button>
        </nav>
      </header>

      {/* ─── Sticky CTA + QR (right) ─── */}
      <aside className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center w-[180px]" aria-label="시작하기">
        <div className="rounded-3xl bg-[#0b1220] border border-[var(--border-gold-subtle)] p-5 shadow-2xl flex flex-col items-center gap-3">
          {createUrl ? <QRCodeSVG value={createUrl} size={120} level="M" className="rounded-xl" /> : <div className="w-[120px] h-[120px] bg-white/10 rounded-xl animate-pulse" />}
          <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-widest text-[var(--aeterna-gold)]">QR로 시작</p>
          <Link href="/create" className="w-full min-h-[40px] px-4 py-2 rounded-full bg-[var(--aeterna-gold)] text-[#020617] font-[var(--font-display)] font-bold text-xs uppercase text-center hover:bg-[var(--aeterna-gold-light)] transition-colors">
            추모 공간 만들기
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
            <p className="font-[var(--font-display)] font-bold text-[11px] md:text-xs uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-4">디지털 추모 · AI 헌정 영상</p>
            <h1 className="font-[var(--font-display)] font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight text-[#F4F1EA] leading-[1.1] mb-6">
              7일 후,<br />
              <span className="text-[var(--aeterna-gold)]">추억이 사라진다.</span>
            </h1>
            <p className="font-sans text-base md:text-lg text-[#A0A0A0] max-w-xl mb-10 leading-relaxed">
              무료 플랜은 7일이 지나면 모든 데이터가 <strong className="text-white/90">영구 삭제</strong>됩니다. 업그레이드하면 Luma AI가 만든 헌정 영상으로 영원히 남깁니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/create" className="inline-flex items-center gap-2 min-h-[56px] px-8 py-4 rounded-2xl bg-[var(--aeterna-gold)] text-[#020617] font-[var(--font-display)] font-bold text-sm uppercase tracking-wide hover:bg-[var(--aeterna-gold-light)] transition-colors shadow-lg">
                추모 공간 만들기
              </Link>
              <button type="button" onClick={() => scrollTo("pricing")} className="inline-flex items-center gap-2 min-h-[56px] px-8 py-4 rounded-2xl border-2 border-[var(--aeterna-gold)]/60 text-[var(--aeterna-gold)] font-[var(--font-display)] font-bold text-sm uppercase tracking-wide hover:bg-[var(--aeterna-gold-pale)] transition-colors">
                요금제 보기
              </button>
            </div>
          </RevealSection>
        </main>

        {/* ─── Urgency block: 7일 삭제 (dark, red accent, bold) ─── */}
        <section className="px-5 md:px-12 py-16 md:py-24 border-y border-red-900/40 bg-gradient-to-b from-red-950/30 to-transparent">
          <RevealSection className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
            <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-red-500/20 border-2 border-red-500/50 shrink-0">
              <IconClock className="w-10 h-10 md:w-12 md:h-12 text-red-400" />
            </div>
            <div>
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.3em] text-red-400/90 mb-2">Free 플랜 한계</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-white leading-tight mb-3">
                7일 이내 업그레이드하지 않으면<br />
                <span className="text-red-400">모든 데이터가 영구 삭제됩니다.</span>
              </h2>
              <p className="font-sans text-sm md:text-base text-[#A0A0A0] max-w-xl">
                복구 불가. Plus($19.99) 또는 Premium($39.99)으로 업그레이드해 추억을 영구 보존하고, Premium은 Luma AI 헌정 영상까지 받을 수 있습니다.
              </p>
            </div>
          </RevealSection>
        </section>

        {/* ─── Beauty block: Luma AI 영상 (gold, cinematic) ─── */}
        <section className="px-5 md:px-12 py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--aeterna-gold-pale)]/10 to-transparent pointer-events-none" />
          <RevealSection className="max-w-5xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
              <div className="flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-[var(--aeterna-gold)]/20 border-2 border-[var(--aeterna-gold)]/50 shrink-0">
                <IconFilm className="w-12 h-12 md:w-14 md:h-14 text-[var(--aeterna-gold)]" />
              </div>
              <div className="flex-1">
                <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.3em] text-[var(--aeterna-gold)] mb-2">Luma AI</p>
                <h2 className="font-[var(--font-display)] font-extrabold text-3xl md:text-5xl text-[#F4F1EA] leading-tight mb-4">
                  좋아요 Top 20 사진으로<br />
                  <span className="text-[var(--aeterna-gold)]">영화 같은 헌정 영상</span>을 만듭니다.
                </h2>
                <p className="font-sans text-base text-[#A0A0A0] max-w-xl leading-relaxed mb-6">
                  평온하고 영화적인 톤, 슬로우 모션과 부드러운 빛. Premium 플랜에서 한 번에 한 편의 AI 추모 영상을 제작해 영원히 보관할 수 있습니다.
                </p>
                <Link href="/create" className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[var(--aeterna-gold)]/90 text-[#020617] font-[var(--font-display)] font-bold text-sm uppercase hover:bg-[var(--aeterna-gold)] transition-colors">
                  <IconFilm className="w-5 h-5" />
                  Premium으로 영상 만들기
                </Link>
              </div>
            </div>
          </RevealSection>
        </section>

        {/* ─── How it works: 3 steps, bold icons ─── */}
        <section id="how-it-works" className="px-5 md:px-12 py-20 md:py-28 border-t border-[var(--border-gold-subtle)] scroll-mt-24">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-14">
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-3">이용 방법</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] tracking-tight">3단계로 추모 공간 완성</h2>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {[
                { step: 1, icon: "🙏", title: "인간 / 동물 선택 후 프로필 입력", desc: "이름, 사진, 생몰일, 장례 정보·기부금(선택). 날짜·시간은 드롭다운으로 간편 입력." },
                { step: 2, icon: "📤", title: "QR·SNS 공유", desc: "생성 후 카카오톡, 인스타, WhatsApp 공유와 PDF 출력 가능한 QR 코드로 지인 초대." },
                { step: 3, icon: "♥", title: "사진 수집 & 좋아요 투표", desc: "지인은 사진 1장과 에피소드 업로드. '당신의 사진이 AI 영상에 채택될 수 있습니다'로 참여 유도. 마감 후 Top 20만 공개, 나머지 블러." },
              ].map((item) => (
                <RevealSection key={item.step} className="text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--aeterna-gold)]/15 border-2 border-[var(--aeterna-gold)]/40 text-2xl mb-4 md:mb-5 font-bold">
                    {item.icon}
                  </div>
                  <h3 className="font-[var(--font-display)] font-bold text-lg md:text-xl text-[#F4F1EA] mb-2">{item.title}</h3>
                  <p className="font-sans text-sm text-[#A0A0A0] leading-relaxed">{item.desc}</p>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing: Free 7일 삭제 강조, Plus/Premium ─── */}
        <section id="pricing" className="px-5 md:px-12 py-20 md:py-28 border-t border-[var(--border-gold-subtle)] scroll-mt-24 bg-[#0b1220]/50">
          <div className="max-w-5xl mx-auto">
            <RevealSection className="text-center mb-14">
              <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-[0.35em] text-[var(--aeterna-gold)] mb-3">요금제</p>
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] tracking-tight mb-2">명확한 플랜</h2>
              <p className="font-sans text-sm text-[#A0A0A0] max-w-xl mx-auto">7일 삭제의 긴박함과, 영구 보존·AI 영상의 가치를 선택하세요.</p>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: "Free", price: "$0", period: "", cta: "시작하기", highlight: false, features: ["7일 후 삭제", "영상 불가", "QR·링크 공유"], urgent: true },
                { name: "Plus", price: "$19.99", period: " one-time", cta: "Plus 선택", highlight: true, features: ["영구 보존 (Cold Storage)", "모든 사진 접근", "QR·링크 공유"], urgent: false },
                { name: "Premium", price: "$39.99", period: " one-time", cta: "Premium 선택", highlight: false, features: ["Plus 전체", "Luma AI 헌정 영상 (Top 20)", "QR·링크 공유"], urgent: false },
              ].map((plan) => (
                <RevealSection key={plan.name}>
                  <div className={`rounded-3xl border-2 bg-[#020617]/90 p-6 md:p-8 flex flex-col h-full ${plan.highlight ? "border-[var(--aeterna-gold)] shadow-[0_0_40px_rgba(197,160,89,0.12)]" : plan.urgent ? "border-red-900/50" : "border-[var(--border-gold-subtle)]"}`}>
                    {plan.urgent && (
                      <div className="flex items-center gap-2 mb-3 text-red-400">
                        <IconAlert className="w-5 h-5 shrink-0" />
                        <span className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-wider">7일 후 영구 삭제</span>
                      </div>
                    )}
                    {plan.highlight && <p className="font-[var(--font-display)] font-bold text-[10px] uppercase tracking-wider text-[var(--aeterna-gold)] mb-2">추천</p>}
                    <p className="font-[var(--font-display)] font-bold text-[11px] uppercase tracking-widest text-[#A0A0A0] mb-1">{plan.name}</p>
                    <p className="font-[var(--font-display)] font-extrabold text-3xl md:text-4xl text-[#F4F1EA] mb-0.5">
                      {plan.price}<span className="text-lg font-bold text-[#A0A0A0]">{plan.period}</span>
                    </p>
                    <ul className="font-sans text-sm text-[#A0A0A0] leading-relaxed space-y-2 mb-8 flex-1 mt-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {plan.urgent && i === 0 ? <span className="text-red-400 font-bold">⚠</span> : <span className="text-[var(--aeterna-gold)]">·</span>}
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/create" className={`min-h-[52px] px-6 py-3 rounded-xl font-[var(--font-display)] font-bold text-sm uppercase text-center transition-all ${plan.highlight ? "bg-[var(--aeterna-gold)] text-[#020617] hover:bg-[var(--aeterna-gold-light)]" : plan.urgent ? "border-2 border-red-500/60 text-red-400 hover:bg-red-500/10" : "border-2 border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold-pale)]"}`}>
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
              <h2 className="font-[var(--font-display)] font-extrabold text-2xl md:text-4xl text-[#F4F1EA] tracking-tight">자주 묻는 질문</h2>
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
            장례·케어 업체 문의 · partnerships@aeterna.com
          </p>
        </footer>
      </div>
    </div>
  )
}
