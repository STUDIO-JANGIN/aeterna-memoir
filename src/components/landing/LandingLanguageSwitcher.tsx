"use client"

import { ChevronDown } from "lucide-react"
import { isLandingLocale, LANDING_LOCALES } from "@/lib/landingTranslations"
import { useLandingLocale } from "./LandingLocaleContext"

export function LandingLanguageSwitcher() {
  const { locale, setLocale } = useLandingLocale()

  return (
    <div className="relative inline-flex items-center" dir="ltr">
      <label htmlFor="landing-locale" className="sr-only">
        Language
      </label>
      <select
        id="landing-locale"
        value={locale}
        onChange={(e) => {
          const v = e.target.value
          if (isLandingLocale(v)) setLocale(v)
        }}
        className="appearance-none cursor-pointer rounded-lg border border-white/[0.12] bg-[#0a0a0a]/90 py-1.5 pl-2.5 pr-8 text-[10px] font-medium uppercase tracking-[0.12em] text-[#e8e4dc] shadow-sm hover:border-white/[0.2] hover:bg-white/[0.06] focus:border-[var(--aeterna-gold)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--aeterna-gold)]/30 md:py-2 md:pl-3 md:pr-9 md:text-[11px] md:tracking-[0.14em]"
      >
        {LANDING_LOCALES.map(({ code, native }) => (
          <option key={code} value={code}>
            {native}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#737373] md:right-2.5 md:h-4 md:w-4"
        aria-hidden
        strokeWidth={1.75}
      />
    </div>
  )
}
