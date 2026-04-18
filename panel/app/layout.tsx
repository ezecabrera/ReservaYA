import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { OfflineBanner } from '@/components/OfflineBanner'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

// Display: Space Grotesk — sans geométrico con carácter, evita el look
// genérico Poppins/Inter. Pares bien con JetBrains Mono.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

// Monospace para numerics — precisión visible, el "reloj suizo" de los datos
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ReservaYa — Panel',
  description: 'Panel de gestión operativa para negocios',
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  applicationName: 'ReservaYa Panel',
  appleWebApp: {
    capable: true,
    title: 'RY Panel',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A1A2E',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetBrainsMono.variable}`}>
      <body className="font-body bg-sf text-tx min-h-screen">
        <OfflineBanner />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
