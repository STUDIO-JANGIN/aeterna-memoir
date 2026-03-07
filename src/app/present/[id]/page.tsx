"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Memory = {
  id: string
  name: string | null
  message: string | null
  image: string | null
  created_at: string
}

type Event = {
  id: string
  name: string | null
  birth_date: string | null
  death_date: string | null
  music_url?: string | null
  quotes_text?: string | null
}

type Slide =
  | { type: "memory"; memory: Memory }
  | { type: "quote"; quote: string }

export default function PresentPage() {
  const params = useParams()
  const eventId = params?.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [quotes, setQuotes] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fadeState, setFadeState] = useState<"in" | "out">("in")
  const [volume, setVolume] = useState(0.4)
  const [muted, setMuted] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchMemories = async (id: string) => {
    const { data: memData, error } = await supabase
      .from("memories")
      .select("*")
      .eq("event_id", id)
      .eq("is_approved", true)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Memories fetch error:", error)
      setMemories([])
      return
    }

    const withImages = (memData || []).filter((m: any) => m.image)
    setMemories(withImages as Memory[])
  }

  useEffect(() => {
    const fetchInitial = async () => {
      if (!eventId) return
      try {
        setLoading(true)
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single()

        if (eventError || !eventData) {
          console.error("Event fetch error:", eventError)
          setEvent(null)
          setQuotes([])
          setMemories([])
          return
        }

        const ev = eventData as Event
        setEvent(ev)

        if (ev.quotes_text) {
          const parsed = ev.quotes_text
            .split(/[\n|]/)
            .map((q) => q.trim())
            .filter(Boolean)
          setQuotes(parsed)
        } else {
          setQuotes([])
        }

        await fetchMemories(eventId)
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()
  }, [eventId])

  // Supabase Realtime: keep memories in sync for this event
  useEffect(() => {
    if (!eventId) return

    const channel = supabase
      .channel(`present-memories-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "memories",
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Re-fetch approved memories whenever something changes for this event
          fetchMemories(eventId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId])

  // Presentation share URL: dedicated memorial page
  useEffect(() => {
    if (typeof window !== "undefined" && eventId) {
      setShareUrl(`${window.location.origin}/event/${eventId}`)
    }
  }, [eventId])

  const slides: Slide[] = useMemo(() => {
    const result: Slide[] = []
    if (memories.length === 0 && quotes.length === 0) return result

    const remainingQuotes = [...quotes]
    memories.forEach((memory, index) => {
      result.push({ type: "memory", memory })
      if (remainingQuotes.length > 0 && index % 2 === 1) {
        const quote = remainingQuotes.shift()
        if (quote) {
          result.push({ type: "quote", quote })
        }
      }
    })

    remainingQuotes.forEach((quote) => result.push({ type: "quote", quote }))
    return result
  }, [memories, quotes])

  // Slide rotation – only after user starts
  useEffect(() => {
    if (!started || slides.length === 0) return

    const interval = setInterval(() => {
      setFadeState("out")
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length)
        setFadeState("in")
      }, 600)
    }, 6000)

    return () => clearInterval(interval)
  }, [slides, started])

  // Volume handling for audio element
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const musicUrl = event?.music_url || ""
  const hasMusic = !!musicUrl
  const isYouTube =
    hasMusic &&
    (musicUrl.includes("youtube.com") ||
      musicUrl.includes("youtu.be") ||
      musicUrl.includes("youtube-nocookie.com"))
  const isAudioFile = hasMusic && !isYouTube

  const getYouTubeId = (url: string): string | null => {
    try {
      if (url.includes("youtu.be/")) {
        const parts = url.split("youtu.be/")[1]?.split(/[?&]/)
        return parts?.[0] || null
      }
      const u = new URL(url)
      if (u.hostname.includes("youtube")) {
        if (u.pathname.startsWith("/embed/")) {
          return u.pathname.split("/embed/")[1]?.split(/[?&]/)[0] || null
        }
        const v = u.searchParams.get("v")
        if (v) return v
      }
    } catch {
      return null
    }
    return null
  }

  const youtubeId = isYouTube ? getYouTubeId(musicUrl) : null

  const qrUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        shareUrl,
      )}`
    : ""

  const handleStart = () => {
    setStarted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#050712] text-white font-serif">
        <p className="font-sans text-[11px] tracking-[0.32em] uppercase text-gray-500">
          Preparing memorial presentation…
        </p>
      </div>
    )
  }

  if (!eventId || !event) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#050712] text-white font-serif px-6 text-center">
        <p className="font-sans text-[11px] tracking-[0.32em] uppercase text-gray-500 mb-3">
          Presentation not available
        </p>
        <p className="text-2xl font-light mb-4">Memorial not found</p>
        <p className="font-sans text-sm text-gray-400 max-w-md mb-6">
          This presentation link may be incorrect, or the memorial has been removed.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-full bg-white text-black font-sans text-sm"
        >
          Return home
        </a>
      </div>
    )
  }

  // User gesture gate for autoplay and slides
  if (!started) {
    return (
      <div className="min-h-screen w-screen bg-[#050712] text-white font-serif flex items-center justify-center px-6">
        <div className="max-w-xl w-full text-center">
          <p className="font-sans text-[11px] tracking-[0.32em] uppercase text-gray-500 mb-4">
            Memorial Presentation
          </p>
          <h1 className="text-3xl md:text-4xl font-light mb-3">
            Start the tribute for{" "}
            <span className="underline decoration-white/30 decoration-[4px] underline-offset-4">
              {event.name || "your loved one"}
            </span>
          </h1>
          <p className="font-sans text-sm text-gray-400 mb-8 max-w-md mx-auto">
            When you're ready in the chapel or reception, press the button below. The slideshow and
            background music will begin on this screen.
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="inline-flex items-center justify-center min-h-[52px] px-10 py-4 rounded-full bg-white text-black font-sans text-sm md:text-base tracking-[0.2em] uppercase shadow-[0_20px_80px_rgba(0,0,0,0.6)] hover:bg-gray-100 transition-colors"
          >
            Start Memorial Presentation
          </button>
        </div>
      </div>
    )
  }

  const current = slides[currentIndex]
  const hasContentAfterStart = !!current

  return (
    <div className="min-h-screen w-screen bg-[#050712] text-white font-serif overflow-hidden relative">
      {/* Fullscreen container */}
      <div className="fixed inset-0 flex items-center justify-center">
        {hasContentAfterStart && current ? (
          <>
            {current.type === "memory" && (
              <div className="max-w-6xl w-full px-10 flex flex-col md:flex-row items-center gap-16">
                {/* Image */}
                <div
                  className={`relative w-full md:w-1/2 aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.8)] border border-white/10 bg-black/40 transition-opacity duration-700 ${
                    fadeState === "in" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={current.memory.image as string}
                    alt={current.memory.name ?? "Memory photo"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
                </div>

                {/* Text */}
                <div
                  className={`md:w-1/2 space-y-6 transition-opacity duration-700 ${
                    fadeState === "in" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gray-400">
                    Shared Memory
                  </p>
                  <h1 className="text-4xl md:text-5xl tracking-tight font-light">
                    {current.memory.name || "A Loving Tribute"}
                  </h1>
                  {current.memory.message && (
                    <p className="text-lg leading-relaxed text-gray-200/90 italic whitespace-pre-line">
                      “{current.memory.message}”
                    </p>
                  )}
                  {current.memory.created_at && (
                    <p className="text-xs font-sans text-gray-500 uppercase tracking-[0.2em]">
                      {new Date(current.memory.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {current.type === "quote" && (
              <div
                className={`max-w-4xl w-full px-10 text-center transition-opacity duration-700 ${
                  fadeState === "in" ? "opacity-100" : "opacity-0"
                }`}
              >
                <p className="font-sans text-[11px] tracking-[0.36em] uppercase text-gray-400 mb-6">
                  Favorite Words
                </p>
                <p className="text-4xl md:text-5xl leading-tight font-light">
                  “{current.quote}”
                </p>
                {event?.name && (
                  <p className="mt-6 text-sm font-sans text-gray-400 tracking-[0.22em] uppercase">
                    In memory of {event.name}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center px-8">
            <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gray-500 mb-4">
              Presentation Mode
            </p>
            <p className="text-3xl md:text-4xl font-light text-gray-100 mb-3">
              Waiting for memories or quotes
            </p>
            <p className="text-sm md:text-base text-gray-400 font-sans max-w-md mx-auto">
              Once at least one approved memory with a photo or a quote has been added, it will
              appear here in a gentle cross-fade slideshow.
            </p>
          </div>
        )}
      </div>

      {/* Subtle vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(20,94,125,0.4),_transparent_55%)] mix-blend-screen opacity-40" />

      {/* Background music (audio file) – only after start */}
      {isAudioFile && started && <audio ref={audioRef} src={musicUrl} autoPlay loop />}

      {/* Background music (YouTube - audio-only embed, no controls) – only after start */}
      {isYouTube && youtubeId && started && (
        <iframe
          className="w-0 h-0 opacity-0 pointer-events-none"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0`}
          title="Background music"
          allow="autoplay; encrypted-media"
        />
      )}

      {/* Volume control in corner (only when an audio file is set) */}
      {isAudioFile && started && (
        <div className="fixed bottom-6 left-8 flex items-center gap-2 font-sans text-[10px] text-gray-300 bg-black/50 border border-white/10 rounded-full px-3 py-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center text-[8px]"
          >
            {muted || volume === 0 ? "⭑" : "♪"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 accent-white"
          />
          <span className="uppercase tracking-[0.16em]">Bgm</span>
        </div>
      )}

      {/* URL + QR hint in bottom-right */}
      {shareUrl && (
        <div className="fixed bottom-6 right-8 flex items-center gap-3 font-sans text-[10px] text-gray-200 bg-black/40 border border-white/5 rounded-full px-4 py-3 backdrop-blur-sm">
          <div className="text-right">
            <p className="uppercase tracking-[0.24em] text-gray-400 mb-1">Add your memory</p>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] underline underline-offset-4 decoration-gray-400"
            >
              {shareUrl}
            </a>
          </div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt="QR code to open tribute page"
              className="w-12 h-12 rounded-md bg-white p-1"
            />
          )}
        </div>
      )}
    </div>
  )
}

