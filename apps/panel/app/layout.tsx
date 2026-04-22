import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
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
  title: 'Un Toque — Panel',
  description: 'Panel de gestión operativa para negocios',
  robots: 'noindex, nofollow', // El panel no se indexa
}

export const viewport: Viewport = {
  themeColor: '#0F3460',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${dmSerifDisplay.variable} ${plusJakarta.variable}`}>
      <body className="font-body bg-sf text-tx min-h-screen">
        {children}
      </body>
    </html>
  )
}
