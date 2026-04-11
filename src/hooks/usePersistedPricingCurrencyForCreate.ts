"use client"

import { useEffect, useState } from "react"
import type { LandingLocale } from "@/lib/landingTranslations"
import {
  getPricingCurrencyId,
  type PricingCurrencyId,
  isPricingCurrencyId,
  readPersistedLandingPricingCurrency,
} from "@/lib/landingPricing"

/**
 * Resolves Stripe pricing profile for /create: URL `currency=` wins, then landing localStorage, then locale default.
 */
export function usePersistedPricingCurrencyForCreate(
  landingLocale: LandingLocale,
  currencyParam: string | null,
): PricingCurrencyId {
  const [c, setC] = useState<PricingCurrencyId>(() => resolveSync(landingLocale, currencyParam))

  useEffect(() => {
    setC(resolveSync(landingLocale, currencyParam))
  }, [landingLocale, currencyParam])

  useEffect(() => {
    const sync = () => {
      setC(resolveSync(landingLocale, currencyParam))
    }
    window.addEventListener("storage", sync)
    window.addEventListener("aeterna-pricing-currency", sync as EventListener)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("aeterna-pricing-currency", sync as EventListener)
    }
  }, [landingLocale, currencyParam])

  return c
}

function resolveSync(landingLocale: LandingLocale, currencyParam: string | null): PricingCurrencyId {
  const fromUrl = currencyParam?.trim().toLowerCase()
  if (fromUrl && isPricingCurrencyId(fromUrl)) return fromUrl
  if (typeof window === "undefined") return getPricingCurrencyId(landingLocale)
  const stored = readPersistedLandingPricingCurrency()
  return stored ?? getPricingCurrencyId(landingLocale)
}
