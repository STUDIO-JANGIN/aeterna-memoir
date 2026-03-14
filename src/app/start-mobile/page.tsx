 "use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

const APP_STORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL || "https://apps.apple.com/"
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAYSTORE_URL || "https://play.google.com/store"
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

export default function StartMobilePage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const origin = BASE_URL || window.location.origin
    setQrUrl(`${origin}/start-mobile`)

    const ua = window.navigator.userAgent || ""
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    const isAndroid = /Android/i.test(ua)

    const target = isIOS ? APP_STORE_URL : isAndroid ? PLAY_STORE_URL : null
    if (target) {
      window.location.href = target
    }
  }, [])

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] text-[var(--aeterna-body)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center font-serif">
        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-[var(--aeterna-gold-muted)] mb-4">
          START ON YOUR PHONE
        </p>
        <h1 className="text-2xl mb-6 text-[var(--aeterna-headline)]">
          Scan this on your phone
        </h1>
        <div className="inline-flex items-center justify-center rounded-[32px] bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] p-6 shadow-[var(--shadow-deep)]">
          <div className="rounded-2xl bg-white p-4">
            {qrUrl ? (
              <QRCodeSVG value={qrUrl} size={160} level="M" className="rounded-lg" />
            ) : (
              <div className="w-[160px] h-[160px] bg-gray-200 rounded-lg animate-pulse" />
            )}
          </div>
        </div>
        <p className="mt-6 text-sm text-[var(--aeterna-gold-muted)] max-w-sm mx-auto">
          Download Aeterna to create a quiet sanctuary for your loved one&apos;s memories. On iPhone we&apos;ll open the Apple App Store, and on Android we&apos;ll open Google Play.
        </p>
      </div>
    </div>
  )
}

