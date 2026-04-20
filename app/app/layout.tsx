import type { Metadata, Viewport } from 'next'
import { Poppins, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SplashScreen } from '@/components/ui/SplashScreen'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Un Toque',
  description: 'Reservá tu mesa en segundos — restaurantes de Buenos Aires',
  manifest: '/manifest.json',
  applicationName: 'Un Toque',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Un Toque',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    shortcut: '/icons/apple-touch-icon.png',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF4757',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${poppins.variable} ${plusJakarta.variable}`}>
      <body className="font-body bg-bg text-tx min-h-screen">
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <SplashScreen />
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
