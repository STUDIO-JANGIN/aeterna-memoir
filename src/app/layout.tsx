import type { Metadata, Viewport } from 'next'
import {
  Amiri,
  Cormorant_Garamond,
  Inter,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_TC,
  Playfair_Display,
  Syne,
} from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider'
import { AppLocaleRoot } from '@/components/AppLocaleRoot'
import { CursorGlow } from '@/components/CursorGlow'
import { GrainOverlay } from '@/components/GrainOverlay'
import { getAppBaseUrl } from '@/lib/appUrl'

/** Headings & memorial titles — premium serif (latin-ext for fr/es accents on landing) */
const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

/** Korean: Pretendard + Noto Sans KR for body and titles (globals — no legacy serif fallbacks). */
const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ko-sans',
  display: 'swap',
})

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ja-sans',
  display: 'swap',
})

/** Traditional Chinese (HK/TW) — Noto Sans TC for UI (serif display avoided on web) */
const notoSansTc = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-zh-sans',
  display: 'swap',
})

/** Arabic — classical Amiri for titles and body (RTL). */
const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-ar-amiri',
  display: 'swap',
})

/** Optional classical serif variable (unused for FR body — FR uses Inter with Playfair titles). */
const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: 'Aeterna Memoir - Preserving Your Precious Memories',
  description:
    'A digital sanctuary to honor and preserve the stories of your loved ones forever.',
  applicationName: 'Aeterna Memoir',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '1024x1024', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'Aeterna Memoir',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#030303',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', /* safe-area insets for notched devices / PWA */
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-locale="en"
      className={`${playfair.variable} ${inter.variable} ${syne.variable} ${cormorant.variable} ${notoSansKr.variable} ${notoSansJp.variable} ${notoSansTc.variable} ${amiri.variable}`}
    >
      <body className="relative antialiased bg-[color:var(--landing-bg)] text-[color:var(--text-primary)]">
        <AppLocaleRoot>
          <CursorGlow />
          <GrainOverlay />
          <SmoothScrollProvider>
            <div className="relative z-10 min-h-dvh">{children}</div>
          </SmoothScrollProvider>
        </AppLocaleRoot>
      </body>
    </html>
  )
}

