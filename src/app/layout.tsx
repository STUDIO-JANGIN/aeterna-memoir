import type { Metadata, Viewport } from 'next'
import { Nanum_Myeongjo, Inter, Syne } from 'next/font/google'
import './globals.css'
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider'
import { getAppBaseUrl } from '@/lib/appUrl'

const nanum = Nanum_Myeongjo({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
  preload: false, // avoids Turbopack font resolution errors (module not found)
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
  themeColor: '#0f0e0d',
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
    <html lang="en" className={`${nanum.variable} ${inter.variable} ${syne.variable}`}>
      <body className="antialiased bg-[color:var(--landing-bg)]">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  )
}

