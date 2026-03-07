"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Event = {
  id: string
  name: string | null
  birth_date: string | null
  death_date: string | null
  location: string | null
  ceremony_time: string | null
}

type Memory = {
  id: string
  name: string | null
  message: string | null
  image: string | null
  created_at: string
}

export default function ArchivePage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const { data: eventData } = await supabase.from("events").select("*")
        if (eventData && eventData.length > 0) {
          setEvent(eventData[0] as Event)
        }

        const { data: memData } = await supabase
          .from("memories")
          .select("*")
          .eq("is_approved", true)
          .order("created_at", { ascending: true })

        setMemories((memData || []) as Memory[])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--aeterna-charcoal)] font-serif text-sm tracking-[0.2em] uppercase text-[var(--aeterna-gold-muted)]">
        Preparing archive…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal-muted)] text-[#222] flex items-center justify-center py-12 px-4 print:bg-white">
      {/* Page wrapper mimicking an A4 sheet */}
      <div className="w-full max-w-5xl bg-[var(--aeterna-cream)] rounded-[32px] shadow-[var(--shadow-deep)] border border-[var(--border-gold-subtle)] px-10 sm:px-14 py-12 print:shadow-none print:border-0 print:rounded-none">
        {/* Header */}
        <header className="border-b border-[var(--border-gold-subtle)] pb-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-[var(--aeterna-gold-muted)] mb-3">
                Celebration of Life – Archive
              </p>
              <h1 className="text-4xl sm:text-5xl tracking-tight font-light">
                {event?.name || "In Loving Memory"}
              </h1>
              {(event?.birth_date || event?.death_date) && (
                <p className="mt-3 text-sm tracking-[0.28em] uppercase text-gray-500 font-sans">
                  {(event?.birth_date || "—") + "  –  " + (event?.death_date || "—")}
                </p>
              )}
            </div>
            <div className="text-right font-sans text-[10px] leading-relaxed text-gray-500">
              <p>{event?.location}</p>
              <p>{event?.ceremony_time}</p>
              <p className="mt-3 uppercase tracking-[0.24em]">
                Archived on {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </header>

        {/* Intro */}
        <section className="mb-10">
          <p className="font-serif text-sm leading-relaxed text-gray-700 max-w-3xl">
            This archive gathers the memories, notes, and photographs shared by friends and family.
            It is designed to be printed or saved as a PDF, so that this moment in time can be
            revisited, kept, and shared with future generations.
          </p>
        </section>

        {/* Gallery-style layout */}
        <main className="space-y-8">
          {memories.length === 0 ? (
            <div className="py-10 text-center font-sans text-sm text-gray-400 border border-dashed border-[#D2C5B7] rounded-2xl bg-white/60">
              There are no approved memories yet. Once tributes are approved, they will appear here
              as a printable archive.
            </div>
          ) : (
            <>
              {/* First memory as a larger hero */}
              {memories[0] && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
                  {memories[0].image && (
                    <div className="sm:col-span-2 rounded-3xl overflow-hidden border border-[#DECBB4] bg-black/5">
                      <img
                        src={memories[0].image as string}
                        alt={memories[0].name ?? "Memory photo"}
                        className="w-full h-full max-h-[360px] object-cover"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-1 space-y-3">
                    <p className="font-sans text-[10px] tracking-[0.26em] uppercase text-gray-500">
                      Opening Tribute
                    </p>
                    <h2 className="text-xl font-light">
                      {memories[0].name || "A cherished memory"}
                    </h2>
                    {memories[0].message && (
                      <p className="text-sm leading-relaxed text-gray-700 italic whitespace-pre-line">
                        “{memories[0].message}”
                      </p>
                    )}
                    <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-gray-500">
                      {memories[0].created_at
                        ? new Date(memories[0].created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Remaining memories in a 2–3 column grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {memories.slice(1).map((mem) => (
                  <article
                    key={mem.id}
                    className="bg-white/80 rounded-2xl border border-[#E0D4C8] overflow-hidden flex flex-col"
                  >
                    {mem.image && (
                      <div className="h-40 bg-black/5">
                        <img
                          src={mem.image as string}
                          alt={mem.name ?? "Memory photo"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="px-4 py-4 flex-1 flex flex-col gap-3">
                      <div>
                        <p className="font-sans text-[10px] tracking-[0.24em] uppercase text-gray-500 mb-1">
                          Memory
                        </p>
                        <h3 className="text-base font-semibold">
                          {mem.name || "Guest"}
                        </h3>
                      </div>
                      {mem.message && (
                        <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line">
                          {mem.message}
                        </p>
                      )}
                      <p className="mt-auto font-sans text-[10px] tracking-[0.2em] uppercase text-gray-400">
                        {mem.created_at
                          ? new Date(mem.created_at).toLocaleDateString()
                          : ""}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Footer – discreet branding */}
        <footer className="mt-10 pt-6 border-t border-[#E0D4C8] flex items-center justify-between text-[9px] font-sans text-gray-400">
          <span>
            This document is intended for personal remembrance and may be printed or saved as PDF.
          </span>
          <span className="tracking-[0.28em] uppercase text-[var(--aeterna-gold)]">
            Aeterna
          </span>
        </footer>
      </div>
    </div>
  )
}

