import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DemoRequestButton } from './DemoRequestButton'

// Public landing B2B — dueños de restaurant.
// Si hay sesión, el middleware redirige a /dashboard antes de llegar acá.

const NAVY = '#0F3460'
const TERRACOTTA = '#C5602A'

const FEATURES = [
  {
    title: 'Panel en tiempo real',
    desc: 'Ves las mesas, las reservas, los check-ins y los pre-pedidos en vivo. Sin refrescar, sin esperar.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={NAVY} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={NAVY} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={NAVY} strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={NAVY} strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: 'Reservas con seña',
    desc: 'Cobrás una seña al reservar vía Mercado Pago. Se descuenta del consumo. Los no-shows se desploman.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke={NAVY} strokeWidth="2" />
        <path d="M3 10h18M7 15h3" stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp automático',
    desc: 'Confirmaciones, recordatorios 24h antes y 2h antes. Reduce no-shows sin que tu staff levante el teléfono.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Check-in con QR',
    desc: 'El cliente llega con su QR. Tu staff escanea y la mesa se marca ocupada. Sin papeles, sin fricción.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke={NAVY} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke={NAVY} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke={NAVY} strokeWidth="2" />
        <path d="M14 14h3v3h-3zM17 17h4v4h-4z" stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Analytics que importan',
    desc: 'Ocupación por turno, tasa de no-shows, horarios picos, ticket promedio. Decisiones basadas en data real.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Menú y pre-pedidos',
    desc: 'Carta digital que se actualiza al instante. El cliente pre-ordena antes de llegar y la cocina se prepara.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke={NAVY} strokeWidth="2" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke={NAVY} strokeWidth="2" />
      </svg>
    ),
  },
]

const DIFFERENTIATORS = [
  {
    title: 'Rating bidireccional',
    body: 'No solo el cliente te califica — vos también calificás al cliente. Si alguien es problemático, los demás locales de la red lo ven. Justicia para el restaurant.',
  },
  {
    title: 'Transparencia de cancelaciones',
    body: 'El % de cancelaciones unilaterales del local es público. Si cancelás reservas seguido, el cliente lo sabe. Esto nos mantiene honestos a todos.',
  },
  {
    title: 'Widget sin comisión',
    body: 'Embebés Un Toque en tu Instagram o en tu web. Cero comisión por reserva que venga por tu propio canal. No somos intermediarios codiciosos.',
  },
  {
    title: 'CRM con export CSV',
    body: 'Tus datos son tuyos. Exportás el listado completo de clientes con teléfono, historial de consumo y frecuencia cuando quieras.',
  },
]

const FAQ = [
  {
    q: '¿Cuánto tarda en configurarse?',
    a: 'El onboarding lleva 90 segundos: nombre del local, horarios, mesas y seña. Después ya podés recibir reservas.',
  },
  {
    q: '¿Qué pasa si mi staff no es técnico?',
    a: 'El panel está pensado para usarse en tablet durante el servicio. No requiere entrenamiento. Te acompañamos en el primer día.',
  },
  {
    q: '¿Hay comisión por reserva?',
    a: 'No. Pagás una suscripción mensual fija y listo. Las reservas que vienen de tu propio Instagram o web no tienen comisión adicional.',
  },
  {
    q: '¿Y los pagos de los clientes?',
    a: 'Se procesan con Mercado Pago. La seña queda en tu cuenta MP directamente — Un Toque no toca ese dinero.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. La suscripción es mes a mes. Cancelás desde tu cuenta de Mercado Pago sin permisos ni llamadas.',
  },
  {
    q: '¿Funciona en iOS y Android?',
    a: 'Es una app web (PWA) que se instala en cualquier celular o tablet. También funciona en computadora desde el navegador.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const loggedIn = !!user

  return (
    <div className="min-h-screen bg-sf text-tx">
      <Nav loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <SocialProof />
      <ProblemSolution />
      <Features />
      <Differentiators />
      <Pricing />
      <FAQSection />
      <CTABand />
      <Footer />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Nav
// ══════════════════════════════════════════════════════════════════════════════

function Nav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="font-display text-[20px] text-tx tracking-tight leading-none">
          Un <span style={{ color: NAVY }}>Toque</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-[13px] text-tx2 font-semibold">
          <a href="#producto" className="hover:text-tx transition-colors">Producto</a>
          <a href="#diferenciadores" className="hover:text-tx transition-colors">Por qué Un Toque</a>
          <a href="#pricing" className="hover:text-tx transition-colors">Precio</a>
          <a href="#faq" className="hover:text-tx transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md bg-[#0F3460] text-white text-[13px] font-semibold
                         hover:bg-[#0A2548] transition-colors inline-flex items-center gap-1.5"
            >
              Ir al dashboard
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-4 py-2 rounded-md text-tx2 text-[13px] font-semibold
                           hover:text-tx transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/onboarding"
                className="px-4 py-2 rounded-md bg-[#0F3460] text-white text-[13px] font-semibold
                           hover:bg-[#0A2548] transition-colors"
              >
                Registrá tu local
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Hero
// ══════════════════════════════════════════════════════════════════════════════

function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden bg-white border-b border-[rgba(0,0,0,0.07)]">
      <div className="max-w-6xl mx-auto px-5 pt-20 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-6 text-[12px] font-semibold"
            style={{ borderColor: `${TERRACOTTA}33`, background: `${TERRACOTTA}10`, color: TERRACOTTA }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: TERRACOTTA }} />
            Beta cerrado · Pilotos en CABA
          </div>
          <h1 className="font-display text-[56px] sm:text-[64px] leading-[0.95] text-tx tracking-tight mb-6">
            El sistema de reservas que tu restaurante <span style={{ color: NAVY }}>realmente</span> necesita.
          </h1>
          <p className="text-tx2 text-[17px] leading-relaxed mb-8 max-w-[540px]">
            Cobrá seña al reservar, mandá recordatorios por WhatsApp, reducí no-shows
            y vé tu local en vivo desde la tablet. Sin comisión por reserva.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href={loggedIn ? '/dashboard' : '/onboarding'}
              className="px-6 py-3.5 rounded-md bg-[#0F3460] text-white font-semibold text-[15px]
                         hover:bg-[#0A2548] transition-colors inline-flex items-center gap-2"
            >
              {loggedIn ? 'Ir al dashboard' : 'Registrá tu restaurante'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <DemoRequestButton variant="outline" />
          </div>
          <p className="text-tx3 text-[12px]">
            {loggedIn
              ? 'Ya tenés cuenta · Accedé a tu panel en un clic'
              : 'Setup en 90 segundos · 60 días gratis en tu primera suscripción · Cancelás cuando quieras'}
          </p>
        </div>

        {/* Mock preview del panel */}
        <HeroMock />
      </div>

      {/* Glow decorativo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full opacity-40"
        style={{ background: `radial-gradient(circle, ${NAVY}0F 0%, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full opacity-50"
        style={{ background: `radial-gradient(circle, ${TERRACOTTA}15 0%, transparent 70%)` }}
      />
    </section>
  )
}

function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl" style={{ background: `${NAVY}0A`, transform: 'translate(8px, 8px)' }} />
      <div className="relative rounded-xl bg-white border border-[rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
          <p className="text-tx3 text-[10px] font-semibold uppercase tracking-[0.16em] mb-0.5">
            Panel · Un Toque
          </p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-[22px] text-tx leading-none">La Cantina de Martín</h3>
              <p className="text-tx2 text-[12px] mt-1">Sábado 27 de abril</p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border bg-sf px-2.5 py-1 text-[11px] font-semibold text-tx2"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#15A67A' }} />
              Servicio activo
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Reservas', value: 14, dot: NAVY },
              { label: 'Libres', value: 3, dot: '#15A67A' },
              { label: 'Ocupadas', value: 5, dot: '#D63646' },
            ].map(s => (
              <div key={s.label} className="rounded-md border border-[rgba(0,0,0,0.07)] bg-sf px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1 h-1 rounded-full" style={{ background: s.dot }} />
                  <p className="text-tx3 text-[9px] font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
                <p className="font-sans-black text-[26px] text-tx leading-none tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 space-y-2">
          {[
            { label: 'S2', name: 'Martín García', time: '20:30', tone: 'confirmed' },
            { label: 'T1', name: 'Sofía López', time: '20:30', tone: 'confirmed' },
            { label: 'S4', name: 'Lucas Pérez',  time: '21:00', tone: 'checked_in' },
          ].map(r => (
            <div
              key={r.label}
              className="flex items-center gap-3 rounded-md border border-[rgba(0,0,0,0.06)] px-3 py-2"
            >
              <div className="w-8 h-8 rounded bg-sf border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
                <span className="font-display text-[12px] text-tx">{r.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-tx text-[12px] font-semibold truncate">{r.name}</p>
                <p className="text-tx2 text-[11px] font-mono tabular-nums">{r.time} hs</p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  background: r.tone === 'checked_in' ? '#EAFDF6' : `${NAVY}14`,
                  color:      r.tone === 'checked_in' ? '#15A67A' : NAVY,
                  borderColor: r.tone === 'checked_in' ? '#15A67A33' : `${NAVY}33`,
                }}
              >
                {r.tone === 'checked_in' ? 'Check-in' : 'Confirmada'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Social proof (placeholders pensados para cuando haya clientes)
// ══════════════════════════════════════════════════════════════════════════════

function SocialProof() {
  return (
    <section className="bg-sf border-b border-[rgba(0,0,0,0.06)] py-10">
      <div className="max-w-6xl mx-auto px-5">
        <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] text-center mb-5">
          Construido con restaurantes de CABA
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 text-tx3 text-[14px] font-display">
          <span>La Cantina de Martín</span>
          <span>·</span>
          <span>Bodegón El Sur</span>
          <span>·</span>
          <span>Terraza Malabia</span>
          <span>·</span>
          <span>Parrilla 9 de Julio</span>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Problem / Solution
// ══════════════════════════════════════════════════════════════════════════════

function ProblemSolution() {
  return (
    <section className="py-24 bg-white border-b border-[rgba(0,0,0,0.07)]">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            El problema
          </p>
          <h2 className="font-display text-[40px] leading-[1.05] text-tx tracking-tight mb-4">
            Llenás el salón los sábados. Los martes, no aparece nadie.
          </h2>
          <p className="text-tx2 text-[16px] leading-relaxed">
            Reservas por Instagram que nunca se confirman, el 25% de las mesas queda vacía
            porque alguien dijo &quot;voy&quot; y no fue, tu encargada perdió la noche mandando
            WhatsApps uno por uno. No tenés idea de cuál es tu ticket promedio ni quién
            es tu cliente frecuente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Problema */}
          <div className="rounded-lg bg-sf border border-[rgba(0,0,0,0.08)] p-6">
            <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-4">
              Sin Un Toque
            </p>
            <ul className="space-y-3">
              {[
                'No-shows del 20-30% en turnos clave',
                'Staff perdiendo 2 hs por noche mandando WhatsApps',
                'Libretas en papel, datos que se pierden',
                'Sin forma de saber quiénes son tus clientes habituales',
                'Reservas se pelean con llamadas telefónicas',
                'Comisión alta en plataformas que compiten con vos',
              ].map(x => (
                <li key={x} className="flex items-start gap-2.5 text-tx2 text-[14px] leading-relaxed">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D63646' }} />
                  {x}
                </li>
              ))}
            </ul>
          </div>

          {/* Solución */}
          <div className="rounded-lg border-2 p-6" style={{ borderColor: NAVY, background: `${NAVY}06` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: NAVY }}>
              Con Un Toque
            </p>
            <ul className="space-y-3">
              {[
                'Seña al reservar — no-shows caen debajo del 5%',
                'Recordatorios automáticos por WhatsApp',
                'Panel en tablet con todo el servicio en vivo',
                'CRM con historial completo de cada cliente',
                'Widget embebible en tu Instagram, sin comisión',
                'Un solo precio fijo mensual. Sin letra chica.',
              ].map(x => (
                <li key={x} className="flex items-start gap-2.5 text-tx text-[14px] leading-relaxed">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-[5px] flex-shrink-0">
                    <path d="M5 13l4 4L19 7" stroke={NAVY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Features
// ══════════════════════════════════════════════════════════════════════════════

function Features() {
  return (
    <section id="producto" className="py-24 bg-sf border-b border-[rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Producto
          </p>
          <h2 className="font-display text-[40px] leading-[1.05] text-tx tracking-tight mb-4">
            Todo lo que necesita tu local, en una sola plataforma.
          </h2>
          <p className="text-tx2 text-[16px] leading-relaxed">
            Desde la reserva hasta el check-in, pasando por el menú y los analytics.
            Sin integraciones complejas, sin costos escondidos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-lg bg-white border border-[rgba(0,0,0,0.07)] p-6 hover:border-[#0F3460]/25 transition-colors"
            >
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${NAVY}0E` }}
              >
                {f.icon}
              </div>
              <h3 className="font-sans-black text-[16px] text-tx mb-1.5">{f.title}</h3>
              <p className="text-tx2 text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Diferenciadores
// ══════════════════════════════════════════════════════════════════════════════

function Differentiators() {
  return (
    <section id="diferenciadores" className="py-24 bg-white border-b border-[rgba(0,0,0,0.07)]">
      <div className="max-w-6xl mx-auto px-5">
        <div className="max-w-2xl mb-12">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Por qué Un Toque
          </p>
          <h2 className="font-display text-[40px] leading-[1.05] text-tx tracking-tight mb-4">
            Hecho para el restaurante, no contra él.
          </h2>
          <p className="text-tx2 text-[16px] leading-relaxed">
            Las plataformas grandes cobran comisión alta y te usan como commodity. Nosotros
            construimos diferente.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {DIFFERENTIATORS.map((d, i) => (
            <div
              key={d.title}
              className="rounded-lg bg-sf border border-[rgba(0,0,0,0.07)] p-7"
            >
              <div className="flex items-start gap-4">
                <span
                  className="font-display text-[28px] leading-none tabular-nums flex-shrink-0"
                  style={{ color: TERRACOTTA }}
                >
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-sans-black text-[18px] text-tx mb-2">{d.title}</h3>
                  <p className="text-tx2 text-[14px] leading-relaxed">{d.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Pricing
// ══════════════════════════════════════════════════════════════════════════════

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-sf border-b border-[rgba(0,0,0,0.06)]">
      <div className="max-w-4xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Precio simple
          </p>
          <h2 className="font-display text-[40px] leading-[1.05] text-tx tracking-tight mb-4">
            Un precio. Todo incluido. Sin letra chica.
          </h2>
          <p className="text-tx2 text-[16px] leading-relaxed">
            Si crecés, no pagás más. Si tenés un mes flojo, podés cancelar. Punto.
          </p>
        </div>

        <div className="rounded-xl bg-white border-2 p-8 md:p-10" style={{ borderColor: NAVY }}>
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: `${TERRACOTTA}12`, color: TERRACOTTA, border: `1px solid ${TERRACOTTA}30` }}
                >
                  Oferta de lanzamiento
                </span>
              </div>
              <h3 className="font-display text-[32px] text-tx leading-none mb-2">Plan único</h3>
              <p className="text-tx2 text-[14px] mb-6">
                Todo lo que necesita tu local para vender más y operar mejor.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  'Reservas ilimitadas',
                  'Panel en tiempo real',
                  'Check-in con QR',
                  'WhatsApp automático',
                  'Analytics + CRM',
                  'Menú anticipado',
                  'Widget embebible',
                  'Rating bidireccional',
                  'Soporte por email',
                  'Staff ilimitado',
                ].map(x => (
                  <div key={x} className="flex items-center gap-2 text-tx text-[13px]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#15A67A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {x}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:text-right md:border-l md:pl-8 md:border-[rgba(0,0,0,0.06)]">
              <div className="flex items-end gap-1 mb-1 md:justify-end">
                <span className="font-sans-black text-[52px] text-tx leading-none tabular-nums">$30.000</span>
              </div>
              <p className="text-tx2 text-[14px] mb-6">por mes, sin IVA</p>
              <Link
                href="/onboarding"
                className="inline-block w-full md:w-auto px-8 py-3.5 rounded-md bg-[#0F3460] text-white font-semibold text-[15px]
                           hover:bg-[#0A2548] transition-colors text-center"
              >
                Empezar ahora
              </Link>
              <p className="text-tx3 text-[11px] mt-3 md:text-right">
                Primeros 60 días gratis<br />Cancelás desde Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FAQ
// ══════════════════════════════════════════════════════════════════════════════

function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-white border-b border-[rgba(0,0,0,0.07)]">
      <div className="max-w-3xl mx-auto px-5">
        <div className="mb-10">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Preguntas frecuentes
          </p>
          <h2 className="font-display text-[40px] leading-[1.05] text-tx tracking-tight">
            Todo lo que querés saber antes de arrancar.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="group rounded-md bg-sf border border-[rgba(0,0,0,0.07)] p-5 transition-colors hover:border-[#0F3460]/25"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-tx font-semibold text-[15px] pr-4">{f.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 transition-transform group-open:rotate-180">
                  <path d="M6 9l6 6 6-6" stroke={NAVY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="text-tx2 text-[14px] leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-md bg-sf border border-[rgba(0,0,0,0.07)] p-6 text-center">
          <p className="text-tx text-[15px] font-semibold mb-2">¿Tenés otra pregunta?</p>
          <p className="text-tx2 text-[13px] mb-4">Escribinos y te respondemos el mismo día.</p>
          <a
            href="mailto:hola@untoque.app"
            className="inline-block px-5 py-2.5 rounded-md bg-white border border-[rgba(0,0,0,0.12)]
                       text-tx font-semibold text-[13px] hover:border-[#0F3460]/40 hover:text-[#0F3460]
                       transition-colors"
          >
            hola@untoque.app
          </a>
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CTA Band
// ══════════════════════════════════════════════════════════════════════════════

function CTABand() {
  return (
    <section className="py-20" style={{ background: NAVY }}>
      <div className="max-w-4xl mx-auto px-5 text-center">
        <h2 className="font-display text-[40px] sm:text-[48px] leading-[1.05] text-white tracking-tight mb-4">
          Tu próximo sábado podría llenar el salón sin un solo no-show.
        </h2>
        <p className="text-white/70 text-[16px] leading-relaxed mb-8 max-w-xl mx-auto">
          Configurá tu restaurante en 90 segundos. Los primeros 60 días son gratis.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/onboarding"
            className="px-7 py-4 rounded-md bg-white text-[#0F3460] font-semibold text-[15px]
                       hover:bg-white/95 transition-colors"
          >
            Registrá tu restaurante
          </Link>
          <DemoRequestButton variant="solid-white" />
        </div>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Footer
// ══════════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="bg-white border-t border-[rgba(0,0,0,0.07)]">
      <div className="max-w-6xl mx-auto px-5 py-12 grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
        <div>
          <Link href="/" className="font-display text-[24px] text-tx leading-none tracking-tight">
            Un <span style={{ color: NAVY }}>Toque</span>
          </Link>
          <p className="text-tx2 text-[13px] leading-relaxed mt-3 max-w-xs">
            La plataforma de reservas que los restaurantes argentinos esperaban.
            Sin comisión por reserva. Sin letra chica.
          </p>
        </div>
        <div>
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-3">Producto</p>
          <ul className="space-y-2 text-tx2 text-[13px]">
            <li><a href="#producto" className="hover:text-tx transition-colors">Funciones</a></li>
            <li><a href="#pricing" className="hover:text-tx transition-colors">Precio</a></li>
            <li><a href="#faq" className="hover:text-tx transition-colors">FAQ</a></li>
            <li><Link href="/login" className="hover:text-tx transition-colors">Ingresar</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-3">Empresa</p>
          <ul className="space-y-2 text-tx2 text-[13px]">
            <li><a href="mailto:hola@untoque.app" className="hover:text-tx transition-colors">Contacto</a></li>
            <li><a href="mailto:soporte@untoque.app" className="hover:text-tx transition-colors">Soporte</a></li>
          </ul>
        </div>
        <div>
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-3">Legal</p>
          <ul className="space-y-2 text-tx2 text-[13px]">
            <li><Link href="/terms" className="hover:text-tx transition-colors">Términos</Link></li>
            <li><Link href="/privacy" className="hover:text-tx transition-colors">Privacidad</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[rgba(0,0,0,0.07)]">
        <div className="max-w-6xl mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-3 text-tx3 text-[12px]">
          <p>© {new Date().getFullYear()} Un Toque. Todos los derechos reservados.</p>
          <p>Hecho en Buenos Aires · Argentina</p>
        </div>
      </div>
    </footer>
  )
}
