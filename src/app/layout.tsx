import type { Metadata, Viewport } from 'next'
import { Inter, Syne, Playfair_Display } from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider'
import { AppLocaleRoot } from '@/components/AppLocaleRoot'
import { CursorGlow } from '@/components/CursorGlow'
import { GrainOverlay } from '@/components/GrainOverlay'
import { getAppBaseUrl } from '@/lib/appUrl'

/** Headings & memorial titles — premium serif */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: 'Aeterna Memoir - Preserving Your Precious Memories',
  description:
    'A digital sanctuary to honor and preserve the stories of your loved ones forever.',
  applicationName: 'Aeterna Memoir',
  manifest: '/site.webmanifest',
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
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${syne.variable}`}>
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

