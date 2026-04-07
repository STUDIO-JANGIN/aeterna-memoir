"use client"

import type { ReactNode } from "react"

/** Bezel + screen shell; screen uses 9:19.5 aspect (modern iPhone). */
export function IPhoneShell({
  children,
  className = "",
  island = true,
}: {
  children: ReactNode
  className?: string
  island?: boolean
}) {
  return (
    <div
      className={`relative rounded-[2.35rem] border border-white/[0.14] bg-[#0a0a0a] p-[10px] shadow-[0_36px_100px_rgba(0,0,0,0.55),0_12px_32px_rgba(0,0,0,0.35)] ${className}`}
    >
      {island && (
        <div
          className="pointer-events-none absolute left-1/2 top-[14px] z-20 h-[28px] w-[92px] -translate-x-1/2 rounded-full bg-black/90 ring-1 ring-white/[0.06]"
          aria-hidden
        />
      )}
      <div className="relative z-10 aspect-[9/19.5] w-full overflow-hidden rounded-[1.85rem] bg-[#0f0f0f] ring-1 ring-white/[0.06]">
        {children}
      </div>
    </div>
  )
}

function QrGrid() {
  const pattern: number[][] = [
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1],
  ]
  return (
    <div className="grid h-full w-full grid-cols-12 gap-[1px] bg-neutral-800 p-0.5">
      {pattern.map((row, ri) =>
        row.map((cell, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={cell ? "aspect-square bg-neutral-900" : "aspect-square bg-white"}
          />
        )),
      )}
    </div>
  )
}

/** Step 1 — mirrors /create: progress header, “Who are we honoring?”, two choice cards, Continue. */
export function StepScreenCreate() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a0a0a] text-[#f4f1ea]">
      <header className="flex shrink-0 items-center gap-1.5 px-2 pt-2.5 pb-1">
        <span className="flex h-6 w-6 items-center justify-center text-[11px] text-white/45" aria-hidden>
          ←
        </span>
        <div className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full w-[22%] rounded-full bg-[var(--aeterna-gold)]" />
        </div>
        <span className="text-[6px] uppercase tracking-[0.2em] text-white/30">Sign out</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col px-2.5 pt-3 text-center">
        <h2 className="font-[var(--font-serif)] text-[11px] font-normal leading-snug tracking-tight text-[#f4f1ea]">
          Who are we honoring?
        </h2>
        <p className="mt-1 text-[7px] leading-relaxed text-white/40">A quiet space for someone you love.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-3xl border border-white/[0.06] bg-white/[0.03] py-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--aeterna-gold)]" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
              <path d="M5 19l1-3M19 19l-1-3" strokeLinecap="round" />
            </svg>
            <span className="text-[7px] text-white/75">Someone dear</span>
          </div>
          <div className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-3xl border border-white/[0.06] bg-white/[0.03] py-2">
            <span className="text-base leading-none" aria-hidden>
              🐾
            </span>
            <span className="text-[7px] text-white/75">A companion</span>
          </div>
        </div>
        <p className="mt-2.5 px-1 text-[6px] leading-relaxed text-white/35">
          For those who left footprints on our hearts (People & Pets)
        </p>
      </div>
      <div className="shrink-0 px-2.5 pb-3 pt-1">
        <div className="flex h-8 items-center justify-center rounded-2xl bg-[var(--aeterna-gold)] text-[7px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
          Continue
        </div>
      </div>
    </div>
  )
}

/** Step 2 — memorial share: profile header + large scannable QR (landing). */
export function StepScreenMemorialShare() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#050712] text-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-2 py-2">
        <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 ring-1 ring-white/10" />
        <div className="min-w-0 text-left">
          <p className="truncate font-[var(--font-serif)] text-[8px] text-[var(--once-text-primary)]">In loving memory</p>
          <p className="text-[6px] text-[var(--once-text-secondary)]">Share photos & stories</p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-3 pb-3 pt-1">
        <p className="text-center text-[6px] uppercase tracking-[0.24em] text-white/45">Scan to contribute</p>
        <div className="relative w-[45%] max-w-[110px] overflow-hidden rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-black/20">
          <div className="origin-center">
            <QrGrid />
          </div>
          <div
            className="pointer-events-none absolute inset-1.5 rounded-[0.2rem] border border-[var(--aeterna-gold)]/50"
            aria-hidden
          />
        </div>
        <p className="max-w-[14rem] text-center text-[7px] leading-[1.55] tracking-[0.02em] text-white/50">
          Scan or share link · no app
        </p>
        <div
          className="flex min-h-[30px] w-full max-w-[min(100%,11rem)] cursor-default items-center justify-center rounded-xl bg-[var(--aeterna-gold)] px-4 py-2 text-center text-[7px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a] shadow-[0_10px_28px_-6px_rgba(197,160,89,0.55)] ring-1 ring-black/15"
          role="presentation"
        >
          Copy link
        </div>
      </div>
    </div>
  )
}

/** Guest flow — “Share a memory” step 1 (matches memorial guest modal). */
export function StepScreenShareMemory() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a0a0a] text-[#f4f1ea]">
      <div className="shrink-0 px-2 pt-2.5 pb-1">
        <p className="text-center text-[6px] font-medium uppercase tracking-[0.28em] text-white/40">Share a memory</p>
        <p className="mt-1 text-center text-[6px] tabular-nums text-white/35">1 / 3</p>
        <div className="mx-auto mt-1.5 h-0.5 w-full max-w-[85%] overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full w-1/3 rounded-full bg-[var(--aeterna-gold)]" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-2.5 pt-3 text-center">
        <h2 className="font-[var(--font-serif)] text-[10px] font-normal leading-snug tracking-tight text-[#ece8e0]">
          What is your name?
        </h2>
        <div className="mt-3 h-8 w-full rounded-xl border border-white/[0.08] bg-white/[0.04]" />
        <p className="mt-2 text-[6px] leading-relaxed text-white/30">Guests contribute from any phone — no app.</p>
      </div>
      <div className="shrink-0 px-2.5 pb-3 pt-1">
        <div className="flex h-8 items-center justify-center rounded-xl bg-[var(--aeterna-gold)] text-[7px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a]">
          Continue
        </div>
      </div>
    </div>
  )
}

/**
 * Grandma Legacy Series — six facets of one life (Connect & Vote landing mockup).
 * Alt text carries the narrative; assets are existing art (filters differentiate tone where needed).
 */
const CONNECT_MOMENTS: {
  id: string
  src: string
  position: string
  hearts: number
  alt: string
  caption: string
  imgClassName?: string
}[] = [
  {
    id: "dignified-elder",
    src: "/landing-connect-grandma-01.png",
    position: "center 28%",
    hearts: 42,
    alt: "Warm studio portrait of a dignified elder grandmother with a gentle smile — the anchor photo for her memorial.",
    caption: "The Main · Dignified Elder",
  },
  {
    id: "avid-gardener",
    src: "/landing-connect-grandma-02.png",
    position: "center 30%",
    hearts: 18,
    alt: "Grandma in a straw hat, laughing with a bright sunflower — a vibrant hobby moment.",
    caption: "The Hobby · The Avid Gardener",
  },
  {
    id: "best-friends",
    src: "/landing-connect-grandma-03.png",
    position: "center 28%",
    hearts: 31,
    alt: "Best friends — a candid hug with her golden retriever, showing how Aeterna honors people and pets together.",
    caption: "The Companion · Best Friends",
  },
  {
    id: "younger-days",
    src: "/landing-connect-grandma-04.png",
    position: "center 32%",
    hearts: 9,
    alt: "Restored sepia-toned photo from her twenties — a life remembered across decades on Aeterna.",
    caption: "The Memory · Younger Days",
    imgClassName: "grayscale contrast-[1.08] sepia-[0.42] brightness-[0.98]",
  },
  {
    id: "peace-sign",
    src: "/landing-hero-grandmother.png",
    position: "center 35%",
    hearts: 56,
    alt: "Playful birthday snapshot — grandma flashing a peace sign, slightly soft like a phone photo.",
    caption: "The Silly Moment · Grandma's Peace Sign",
    imgClassName: "scale-105 brightness-[1.06] saturate-[1.12] blur-[0.5px]",
  },
  {
    id: "teachers-desk",
    src: "/hero-elder-portrait.png",
    position: "center 30%",
    hearts: 24,
    alt: "Grandma seated thoughtfully with a book in her library — calm, intellectual, full of wisdom.",
    caption: "The Wisdom · The Teacher's Desk",
  },
]

/** Memorial grid with hearts — Grandma Legacy Series (vote counts vary per card). */
export function StepScreenConnectVote() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#050712] text-white">
      <div className="shrink-0 border-b border-white/[0.06] px-2 py-2">
        <p className="text-center font-[var(--font-serif)] text-[8px] text-[#e8e4dc]">Memories</p>
        <p className="text-center text-[6px] text-white/40">Heart the moments that matter</p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-px overflow-y-auto bg-black/50 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CONNECT_MOMENTS.map((moment, i) => (
          <div
            key={moment.id}
            title={`${moment.caption} · ${moment.hearts} hearts`}
            className={`relative aspect-square overflow-hidden rounded-md ring-1 ring-white/[0.06] ${
              i === 0 ? "ring-[var(--aeterna-gold)]/50" : ""
            }`}
          >
            <img
              src={moment.src}
              alt={moment.alt}
              className={`absolute inset-0 h-full w-full object-cover ${moment.imgClassName ?? ""}`}
              style={{ objectPosition: moment.position }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
            <span
              className={`absolute bottom-0.5 right-0.5 rounded-full px-1 py-0.5 text-[5.5px] font-medium tabular-nums ${
                i === 0 ? "bg-black/75 text-red-300" : "bg-black/60 text-white/75"
              }`}
            >
              ♥ {moment.hearts}
            </span>
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-white/[0.06] px-2 py-1.5 text-center">
        <p className="text-[6px] text-white/45">Community favorites rise to the top</p>
      </div>
    </div>
  )
}

const FILM_PET_IMAGE = "/landing-hero-pets.png"

/** Step 3 — AI tribute film preview (heartwarming pet imagery). */
export function StepScreenFilmTribute() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#0a0a0a]">
      <div className="flex shrink-0 items-center justify-between px-2.5 pt-2.5">
        <span className="text-[6px] uppercase tracking-[0.28em] text-white/35">Memorial</span>
        <span className="rounded-full bg-[var(--aeterna-gold)]/15 px-2 py-0.5 text-[6px] font-medium uppercase tracking-wide text-[var(--aeterna-gold)]">
          AI film
        </span>
      </div>
      <div className="mx-2 mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg ring-1 ring-white/10">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <img
            src={FILM_PET_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg ring-4 ring-black/45">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 text-black" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex gap-0.5 bg-black/55 p-1">
            {[12, 28, 48, 68].map((pct, i) => (
              <div key={i} className="relative h-7 flex-1 overflow-hidden rounded-sm ring-1 ring-white/10">
                <img
                  src={FILM_PET_IMAGE}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${pct}% center` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-white/[0.06] bg-black/50 px-2 py-1.5 text-center">
          <p className="text-[7px] text-white/50">Cinematic tribute · Luma AI</p>
        </div>
      </div>
      <p className="shrink-0 pb-2 pt-1.5 text-center text-[6px] text-[var(--aeterna-gold)]/80">Premium</p>
    </div>
  )
}

export const stepScreenByIndex = [StepScreenCreate, StepScreenMemorialShare, StepScreenFilmTribute] as const
