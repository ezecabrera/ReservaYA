import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Crear tu cuenta gratis · 30 días',
  description:
    'Configurá UnToque para tu restaurante en 5 pasos: cuenta, datos, horarios, mesas y seña. 30 días gratis sin tarjeta. Migración asistida desde TheFork, Maxirest o Fudo.',
  path: '/onboarding',
  ogImage: '/og/og-default.svg',
})

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
