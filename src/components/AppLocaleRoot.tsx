"use client"

import { useEffect, type ReactNode } from "react"
import { LandingLocaleProvider, useLandingLocale } from "@/components/landing/LandingLocaleContext"

function DocumentLangDirSync() {
  const { locale } = useLandingLocale()
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale])
  return null
}

/** Wraps the app so locale (and `useLandingLocale` / `app` strings) are available on every route. */
export function AppLocaleRoot({ children }: { children: ReactNode }) {
  return (
    <LandingLocaleProvider>
      <DocumentLangDirSync />
      {children}
    </LandingLocaleProvider>
  )
}
