import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Iniciar sesión',
  description:
    'Ingresá al panel de UnToque para gestionar reservas, mesas, CRM y campañas WhatsApp de tu restaurante.',
  path: '/login',
  noindex: true, // Login no debe indexarse, pero sigue necesitando OG/canonical
  ogImage: '/og/og-default.svg',
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
