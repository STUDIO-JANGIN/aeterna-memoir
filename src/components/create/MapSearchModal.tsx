"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ARTISAN_SPRING, artisanPresence } from "@/lib/artisanMotion"
import { MapPin, X } from "lucide-react"
import { usePlaceAutocomplete } from "@/hooks/usePlaceAutocomplete"

type MapSearchModalProps = {
  open: boolean
  onClose: () => void
  initialQuery: string
  onApply: (address: string) => void
  placesEnabled: boolean | null
}

export function MapSearchModal({ open, onClose, initialQuery, onApply, placesEnabled }: MapSearchModalProps) {
  const [q, setQ] = useState(initialQuery)
  const { predictions, loading } = usePlaceAutocomplete(q, open)

  useEffect(() => {
    if (open) setQ(initialQuery)
  }, [open, initialQuery])

  const openExternalMaps = () => {
    const query = q.trim() || "celebration of life venue"
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-search-title"
          initial={artisanPresence.initial}
          animate={artisanPresence.animate}
          exit={artisanPresence.exit}
          transition={ARTISAN_SPRING}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-[#030303]/65 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={artisanPresence.initial}
            animate={artisanPresence.animate}
            exit={artisanPresence.exit}
            transition={ARTISAN_SPRING}
            className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[color:var(--landing-bg)] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] max-h-[min(90dvh,560px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-5 w-5 shrink-0 text-[var(--aeterna-gold)]/90" strokeWidth={1.5} aria-hidden />
                <h2 id="map-search-title" className="text-base font-[var(--font-serif)] text-[#f4f1ea] truncate">
                  Search on map
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <p className="text-sm text-white/45 leading-relaxed">
                Type a venue or address. {placesEnabled === false ? "Suggestions need Google Places in production — you can still open Maps below." : "Pick a suggestion or open Google Maps."}
              </p>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Chapel name, street, city…"
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-4 py-3.5 text-base text-[#f4f1ea] placeholder:text-white/32 outline-none focus:ring-1 focus:ring-[var(--aeterna-gold)]/35"
                autoFocus
              />
              {loading && <p className="text-[11px] text-white/35">Searching…</p>}
              {predictions.length > 0 && (
                <ul className="rounded-xl border border-white/[0.08] bg-[#030303]/30 max-h-44 overflow-auto divide-y divide-white/[0.06]">
                  {predictions.map((p) => (
                    <li key={p.place_id}>
                      <button
                        type="button"
                        onClick={() => {
                          onApply(p.description)
                          onClose()
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm text-[#e8e4dc] hover:bg-white/[0.05] transition-colors"
                      >
                        {p.description}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={openExternalMaps}
                  className="w-full min-h-[48px] rounded-xl border border-white/[0.14] bg-white/[0.04] text-sm font-medium text-[#f4f1ea] hover:bg-white/[0.07] transition-colors"
                >
                  Open in Google Maps
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = q.trim()
                    if (t) onApply(t)
                    onClose()
                  }}
                  className="w-full min-h-[48px] rounded-xl bg-[var(--aeterna-gold)] text-[color:var(--landing-bg)] text-sm font-semibold hover:opacity-95 transition-opacity"
                >
                  Use this text as address
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
