import Link from 'next/link'
import { IconWineGlass, IconPlateCutlery, IconChair, IconOpenBook, IconHourglass } from '@/components/ui/Icons'

/**
 * Landing pública del panel — página que ven los dueños de restaurante
 * antes de registrarse. Editorial, no-ruido, foco en los 3 pilares:
 *   1. Reservas sin comisión (tus clientes, tu data)
 *   2. Panel diseñado para el salón, no un Excel
 *   3. WhatsApp nativo + rating bidireccional con descargo
 *
 * Estructura:
 *   - Nav minimalista (logo + CTAs login/registro)
 *   - Hero con título serif + subtítulo + CTA principal wine
 *   - Diferenciadores en 3 cards
 *   - Pricing simple (plan mensual único)
 *   - Footer tenue
 */

export const metadata = {
  title: 'ReservaYA · Reservas para restaurantes sin comisión',
  description:
    'Panel de reservas, WhatsApp nativo y widget embebible para tu restaurante. '
    + 'Sin comisión por reserva — tus clientes, tu data.',
}

const FEATURES = [
  {
    icon: <IconWineGlass size={28} />,
    title: 'Reservas tuyas, no del marketplace',
    desc: 'Los clientes reservan en tu Instagram, tu web o nuestra app. Sin comisión por reserva, sin intermediario entre vos y tu comensal.',
    accent: 'wine' as const,
  },
  {
    icon: <IconChair size={28} />,
    title: 'Panel diseñado para el salón',
    desc: 'Tablet-first. Drag-drop de reservas entre mesas. Check-in por QR. Todo en una pantalla sin submenús eternos.',
    accent: 'olive' as const,
  },
  {
    icon: <IconOpenBook size={28} />,
    title: 'CRM + rating bidireccional',
    desc: 'Tag automático de habitués y no-shows. Rating con derecho a descargo si un cliente califica injustamente. Tu reputación defendida.',
    accent: 'gold' as const,
  },
]

const PLAN_FEATURES = [
  'Reservas ilimitadas',
  'Panel en tiempo real para staff',
  'Widget embebible para Instagram',
  'Recordatorios WhatsApp automáticos',
  'CRM de comensales con export CSV',
  'Analytics de ocupación y no-shows',
  'QR de check-in con seguridad JWT',
  'Modo grupo para reservas compartidas',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-ink-text relative overflow-hidden">
      {/* Radiales decorativos — wine top-right, olive bottom-left, sutiles */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(60% 45% at 100% 0%, rgba(161,49,67,0.22) 0%, transparent 55%),'
            + 'radial-gradient(55% 50% at 0% 100%, rgba(79,138,95,0.16) 0%, transparent 60%)',
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-5 lg:px-10 py-5">
        <Link href="/landing" className="font-display text-[22px] font-bold tracking-tight">
          Reserva<span className="text-wine-soft">YA</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="h-9 px-4 rounded-lg text-[13px] font-semibold text-ink-text-2
                       hover:text-ink-text transition-colors inline-flex items-center"
          >
            Ingresar
          </Link>
          <Link
            href="/onboarding"
            className="h-9 px-4 rounded-lg bg-wine text-white text-[13px] font-bold
                       shadow-[0_8px_22px_-6px_rgba(161,49,67,0.55)]
                       hover:brightness-110 active:scale-[0.97]
                       transition-all duration-150 inline-flex items-center"
          >
            Registrá tu local
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-5 lg:px-10 pt-12 lg:pt-24 pb-16 max-w-4xl mx-auto text-center view-enter">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-text-3 mb-4">
          Reservas profesionales para restaurantes AR
        </p>
        <h1 className="font-display text-[40px] lg:text-[64px] font-bold leading-[1.02] tracking-tight">
          Tus reservas son <span className="text-wine-soft">tuyas</span>.
          <br />
          Tu data también.
        </h1>
        <p className="mt-5 lg:mt-7 text-[15px] lg:text-[17px] text-ink-text-2 max-w-2xl mx-auto leading-relaxed">
          Panel de reservas, WhatsApp nativo y widget para tu Instagram. Sin comisión por
          reserva, sin marketplace que se queda con tus clientes.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/onboarding"
            className="h-12 px-6 rounded-xl bg-wine text-white font-bold text-[15px]
                       shadow-[0_14px_36px_-8px_rgba(161,49,67,0.6)]
                       hover:brightness-110 active:scale-[0.97]
                       transition-all duration-150 inline-flex items-center gap-2"
          >
            Registrá tu local gratis →
          </Link>
          <Link
            href="/login"
            className="h-12 px-6 rounded-xl bg-ink-2 border border-ink-line-2 text-ink-text-2
                       font-semibold text-[14px]
                       hover:text-ink-text hover:border-ink-line-2/80
                       active:scale-[0.97] transition-all inline-flex items-center"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="mt-5 text-[12px] text-ink-text-3">
          30 días de prueba sin tarjeta · Cancelás cuando quieras
        </p>
      </section>

      {/* Diferenciadores */}
      <section className="relative z-10 px-5 lg:px-10 pb-16 max-w-5xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-text-3 mb-6 text-center">
          Por qué ReservaYa y no otra cosa
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {FEATURES.map((f, i) => {
            const accentBadge =
              f.accent === 'wine'  ? 'bg-wine/15 border-wine/30 text-wine-soft'
              : f.accent === 'olive' ? 'bg-olive/18 border-olive/35 text-olive'
              : 'bg-gold/15 border-gold/35 text-gold'
            return (
              <div
                key={f.title}
                className="bg-ink-2 border border-ink-line rounded-2xl p-5
                           hover:border-ink-line-2 transition-colors
                           reveal-stagger"
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className={`w-12 h-12 rounded-xl border ${accentBadge}
                                 flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-display text-[18px] font-bold leading-tight tracking-tight">
                  {f.title}
                </h3>
                <p className="text-[13.5px] text-ink-text-2 mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 px-5 lg:px-10 py-16 max-w-3xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-text-3 mb-4 text-center">
          Precio
        </p>
        <div className="bg-ink-2 border border-ink-line rounded-2xl p-7 lg:p-10
                        shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)]
                        relative overflow-hidden">
          {/* Accent stripe wine */}
          <div
            aria-hidden
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--wine) 50%, transparent 100%)',
            }}
          />

          <div className="flex items-baseline gap-2 justify-center">
            <span className="font-display text-[56px] lg:text-[72px] font-bold leading-none
                             tracking-tight tabular-nums">
              $30.000
            </span>
            <span className="text-ink-text-3 text-[16px]">/ mes</span>
          </div>
          <p className="text-center text-[12.5px] text-ink-text-3 mt-2">
            Un plan, todo incluido. Pagás por Mercado Pago.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {PLAN_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2 text-[13.5px] text-ink-text-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     className="text-olive flex-shrink-0 mt-0.5" aria-hidden>
                  <path d="M5 13l4 4L19 7"
                        stroke="currentColor" strokeWidth="2.4"
                        strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/onboarding"
              className="h-12 px-7 rounded-xl bg-wine text-white font-bold text-[15px]
                         shadow-[0_12px_30px_-8px_rgba(161,49,67,0.55)]
                         hover:brightness-110 active:scale-[0.97]
                         transition-all duration-150 inline-flex items-center gap-2"
            >
              Empezar 30 días gratis →
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 max-w-lg mx-auto">
          <div className="flex items-start gap-2 text-[12px] text-ink-text-3">
            <IconHourglass size={16} />
            <span>Sin compromiso, cancelás cuando quieras</span>
          </div>
          <div className="flex items-start gap-2 text-[12px] text-ink-text-3">
            <IconPlateCutlery size={16} />
            <span>Setup en menos de 15 minutos</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-ink-line mt-8 px-5 lg:px-10 py-6
                         flex flex-col sm:flex-row items-center justify-between gap-3
                         max-w-5xl mx-auto">
        <p className="text-[11.5px] text-ink-text-3">
          Reserva<span className="text-wine-soft font-semibold">YA</span> · Buenos Aires, Argentina
        </p>
        <div className="flex items-center gap-4 text-[11.5px] text-ink-text-3">
          <Link href="/login" className="hover:text-ink-text-2 transition-colors">Ingresar</Link>
          <Link href="/onboarding" className="hover:text-ink-text-2 transition-colors">Registrarse</Link>
        </div>
      </footer>
    </div>
  )
}
