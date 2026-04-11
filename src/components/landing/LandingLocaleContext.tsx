"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  type LandingLocale,
  LANDING_LOCALE_STORAGE_KEY,
  getLandingStrings,
  isLandingLocale,
} from "@/lib/landingTranslations"
import { getAppStrings } from "@/lib/appTranslations"

type LandingLocaleContextValue = {
  locale: LandingLocale
  setLocale: (locale: LandingLocale) => void
  strings: ReturnType<typeof getLandingStrings>
  /** App routes: create, memorial, admin, sign-in, etc. */
  app: ReturnType<typeof getAppStrings>
}

const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(null)

const DEFAULT_LOCALE: LandingLocale = "en"

const listeners = new Set<() => void>()

function emitLocaleChange() {
  listeners.forEach((l) => l())
}

function subscribeLocale(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANDING_LOCALE_STORAGE_KEY || e.key === null) cb()
  }
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage)
  }
  return () => {
    listeners.delete(cb)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage)
    }
  }
}

function getLocaleSnapshot(): LandingLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  try {
    const raw = localStorage.getItem(LANDING_LOCALE_STORAGE_KEY)
    if (raw && isLandingLocale(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

function getServerLocaleSnapshot(): LandingLocale {
  return DEFAULT_LOCALE
}

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot)

  const setLocale = useCallback((next: LandingLocale) => {
    try {
      localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    emitLocaleChange()
  }, [])

  const strings = useMemo(() => getLandingStrings(locale), [locale])
  const app = useMemo(() => getAppStrings(locale), [locale])

  const value = useMemo(
    (): LandingLocaleContextValue => ({ locale, setLocale, strings, app }),
    [locale, setLocale, strings, app],
  )

  return <LandingLocaleContext.Provider value={value}>{children}</LandingLocaleContext.Provider>
}

export function useLandingLocale() {
  const ctx = useContext(LandingLocaleContext)
  if (!ctx) {
    throw new Error("useLandingLocale must be used within LandingLocaleProvider (app root)")
  }
  return ctx
}
