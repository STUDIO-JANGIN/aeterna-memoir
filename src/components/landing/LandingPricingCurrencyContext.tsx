"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useLandingLocale } from "@/components/landing/LandingLocaleContext"
import {
  countryCodeToPricingCurrency,
  getPricingCurrencyId,
  type PricingCurrencyId,
  readPersistedLandingPricingCurrency,
  writePersistedLandingPricingCurrency,
} from "@/lib/landingPricing"
import type { LandingLocale } from "@/lib/landingTranslations"

type LandingPricingCurrencyContextValue = {
  pricingCurrency: PricingCurrencyId
  setPricingCurrencyManual: (currency: PricingCurrencyId) => void
}

const LandingPricingCurrencyContext = createContext<LandingPricingCurrencyContextValue | null>(null)

export function LandingPricingCurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useLandingLocale()
  const [pricingCurrency, setPricingCurrency] = useState<PricingCurrencyId>("usd")

  useEffect(() => {
    try {
      const stored = readPersistedLandingPricingCurrency()
      if (stored) {
        setPricingCurrency(stored)
        return
      }
    } catch {
      /* ignore */
    }

    const optimistic = getPricingCurrencyId(locale)
    setPricingCurrency(optimistic)

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/landing-geo")
        const data = (await res.json()) as { country?: string | null }
        if (cancelled) return
        const existing = readPersistedLandingPricingCurrency()
        if (existing) {
          setPricingCurrency(existing)
          return
        }
        const geo = countryCodeToPricingCurrency(data.country ?? null)
        setPricingCurrency(geo)
        writePersistedLandingPricingCurrency(geo, { manual: false })
      } catch {
        if (cancelled) return
        const fb = getPricingCurrencyId(locale)
        setPricingCurrency(fb)
        if (!readPersistedLandingPricingCurrency()) {
          writePersistedLandingPricingCurrency(fb, { manual: false })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- geo once on mount

  const prevLocaleRef = useRef<LandingLocale | null>(null)
  useEffect(() => {
    if (prevLocaleRef.current === null) {
      prevLocaleRef.current = locale
      return
    }
    if (prevLocaleRef.current === locale) return
    prevLocaleRef.current = locale
    const next = getPricingCurrencyId(locale)
    setPricingCurrency(next)
    writePersistedLandingPricingCurrency(next, { manual: false })
  }, [locale])

  const setPricingCurrencyManual = useCallback((currency: PricingCurrencyId) => {
    setPricingCurrency(currency)
    writePersistedLandingPricingCurrency(currency, { manual: true })
  }, [])

  const value = useMemo(
    (): LandingPricingCurrencyContextValue => ({
      pricingCurrency,
      setPricingCurrencyManual,
    }),
    [pricingCurrency, setPricingCurrencyManual],
  )

  return (
    <LandingPricingCurrencyContext.Provider value={value}>{children}</LandingPricingCurrencyContext.Provider>
  )
}

export function useLandingPricingCurrency() {
  const ctx = useContext(LandingPricingCurrencyContext)
  if (!ctx) {
    throw new Error("useLandingPricingCurrency must be used within LandingPricingCurrencyProvider")
  }
  return ctx
}
