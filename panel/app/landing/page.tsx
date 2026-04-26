import type { Metadata } from 'next'
import Link from 'next/link'
import LegalFooter from '@/components/landing/LegalFooter'

export const metadata: Metadata = {
  title: 'UnToque · Panel para restaurantes que ponen el toque',
  description:
    'Reservas, mesas, cobros y campañas WhatsApp para restaurantes argentinos. Sin comisión por cubierto. ARS 30.000/mes flat. 30 días gratis sin tarjeta.',
  metadataBase: new URL('https://deuntoque.com'),
  alternates: { canonical: 'https://deuntoque.com/landing' },
  openGraph: {
    title: 'UnToque · Panel para restaurantes argentinos',
    description:
      'Sin comisión por cubierto. Tus datos son tuyos. CRM nativo, WhatsApp segmentado, modo grupo. ARS 30.000/mes flat.',
    type: 'website',
    url: 'https://deuntoque.com/landing',
    siteName: 'UnToque',
    locale: 'es_AR',
    images: [
      {
        url: 'https://panel.deuntoque.com/og/landing',
        width: 1200,
        height: 630,
        alt: 'UnToque · Sin comisión por cubierto',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnToque · Panel para restaurantes',
    description: '$0 comisión por cubierto. ARS 30.000/mes flat. 30 días gratis sin tarjeta.',
    images: ['https://panel.deuntoque.com/og/landing'],
  },
}

const SCHEMA_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://deuntoque.com/#software',
      name: 'UnToque',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      url: 'https://deuntoque.com',
      description:
        'Panel SaaS para restaurantes argentinos: reservas, mesas, CRM, WhatsApp segmentado y cobros. Sin comisión por cubierto.',
      offers: {
        '@type': 'Offer',
        price: '30000',
        priceCurrency: 'ARS',
        priceValidUntil: '2026-12-31',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '12',
      },
      featureList: [
        'Reservas ilimitadas + cola de espera',
        'CRM nativo con segmentación VIP/Fieles/Dormidos',
        'WhatsApp Business API integrado',
        'Migración desde TheFork, Maxirest y Fudo',
        'Realtime + push notifications',
        'Rating bidireccional',
        'Modo grupo y multi-staff',
      ],
    },
    {
      '@type': 'LocalBusiness',
      '@id': 'https://deuntoque.com/#org',
      name: 'UnToque',
      url: 'https://deuntoque.com',
      email: 'hola@deuntoque.com',
      areaServed: { '@type': 'Country', name: 'Argentina' },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'AR',
      },
    },
  ],
}

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: '¿Y si quiero salirme?',
    a: 'Cancelás cuando quieras desde el panel. Contrato mes a mes, sin penalizaciones ni letra chica. Te exportamos toda tu base de clientes en CSV antes de cerrar la cuenta.',
  },
  {
    q: '¿Mis datos son míos?',
    a: 'Sí, 100%. Cualquier momento podés exportar reservas, clientes, comentarios y reviews en CSV/JSON. No vendemos data y nunca te bloqueamos el export — esa es la diferencia con TheFork.',
  },
  {
    q: '¿Cómo migro desde TheFork (o Maxirest, Fudo)?',
    a: 'Tenemos un Migration Toolkit con wizard de 5 pasos. Subís tu export, mapeamos campos y migramos mesas + clientes + reservas. Es idempotente: podés re-cargar el CSV sin generar duplicados. Tarda unos 10 minutos.',
  },
  {
    q: '¿Tengo soporte humano?',
    a: 'Sí, soporte por WhatsApp en horario comercial argentino (lun-sáb 10-22 hs). Respuesta promedio menos de 2 hs. No bots, no tickets en inglés, no esperas de 48 hs.',
  },
  {
    q: '¿Funciona offline?',
    a: 'El panel es PWA: si se cae el WiFi seguís cargando reservas y check-ins. Cuando vuelve la conexión sincroniza solo. Probado en bares de subsuelo y rooftops sin señal.',
  },
  {
    q: '¿Sirve para bar, café o cervecería?',
    a: 'Sí. Tenemos modo grupo (cervecerías, peñas), modo barra (cafés y wine bars sin reserva pero con waitlist) y modo restaurante full. Configurable en onboarding.',
  },
  {
    q: '¿Hay descuento si firmo año completo?',
    a: 'Sí: 20% off pagando anual (ARS 288.000 vs ARS 360.000). Si sos un grupo de 3+ locales, escribinos a hola@deuntoque.com para pricing custom.',
  },
  {
    q: '¿Tienen factura A?',
    a: 'Factura A, B o C según corresponda. Emitida por UnToque SAS, monotributo o responsable inscripto del lado tuyo, ambos funcionan.',
  },
]

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #111315)',
        color: 'var(--text, #F4F2EE)',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_JSONLD) }}
      />

      {/* ─── Header / Nav (sólido, sin blur) ─── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--bg, #111315)',
          borderBottom: '1px solid var(--line, #23252A)',
        }}
      >
      <nav
        aria-label="Navegación principal"
        style={{
          padding: 'clamp(10px, 2vw, 14px) clamp(14px, 3vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
        className="landing-nav"
      >
        <Link
          href="/landing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'inherit',
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--p-lilac, #E4CDED)',
              color: '#1A1B1F',
              display: 'inline-grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display, "Fraunces", serif)',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 16,
              flexShrink: 0,
            }}
            aria-hidden
          >
            u
          </span>
          <span className="fr-900" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
            UnToque
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link
          href="/demo"
          className="nav-link-hide-sm"
          style={{
            fontSize: 13,
            color: 'var(--text-2, #A9A8A2)',
            textDecoration: 'none',
            padding: '8px 12px',
          }}
        >
          Demo
        </Link>
        <Link
          href="/login"
          className="nav-link-hide-sm"
          style={{
            fontSize: 13,
            color: 'var(--text-2, #A9A8A2)',
            textDecoration: 'none',
            padding: '8px 12px',
          }}
        >
          Ingresar
        </Link>
        <Link
          href="/onboarding"
          className="btn btn-primary"
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 999,
            fontSize: 13,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Probá gratis
        </Link>
      </nav>
      <style>{`
        @media (max-width: 480px) {
          .nav-link-hide-sm { display: none !important; }
        }
      `}</style>
      </header>

      <main>
      {/* ─── Hero ─── */}
      <section
        aria-labelledby="hero-heading"
        style={{
          padding: 'clamp(48px, 8vw, 96px) 28px clamp(56px, 8vw, 96px)',
          maxWidth: 1180,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 48,
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Hero copy */}
          <div>
            <p className="caps" style={{ marginBottom: 14 }}>
              Para restaurantes argentinos · 2026
            </p>
            <h1
              id="hero-heading"
              className="fr-900"
              style={{
                fontSize: 'clamp(40px, 7vw, 88px)',
                lineHeight: 0.95,
                margin: 0,
                letterSpacing: '-0.04em',
              }}
            >
              El panel que pone{' '}
              <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
                el toque
              </span>
              .
            </h1>
            <p
              style={{
                fontSize: 'clamp(16px, 2vw, 20px)',
                color: 'var(--text-2, #A9A8A2)',
                marginTop: 24,
                maxWidth: 640,
                lineHeight: 1.55,
              }}
            >
              Reservas, mesas, cobros y campañas WhatsApp. Tus clientes son tuyos.{' '}
              <strong style={{ color: 'var(--text)' }}>ARS 30.000/mes flat.</strong>
            </p>

            {/* Inline competitive line */}
            <div
              style={{
                marginTop: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px',
                borderRadius: 999,
                background: 'var(--surface-2, #23252A)',
                border: '1px solid var(--line-2, #2E3036)',
                fontSize: 13,
                color: 'var(--text)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontWeight: 600,
                  color: 'var(--p-mint-2, #A8C2BF)',
                }}
              >
                $0
              </span>
              <span style={{ color: 'var(--text-2)' }}>comisión por cubierto · ARS 30.000 fijos al mes</span>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <Link
                href="/demo"
                className="btn btn-primary"
                style={{ height: 52, padding: '0 28px', borderRadius: 999, fontSize: 15 }}
              >
                Agendá demo de 15min →
              </Link>
              <Link
                href="/onboarding"
                className="btn"
                style={{ height: 52, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
              >
                Probá gratis 30 días sin tarjeta
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3, #6D6C68)' }}>
              Sin tarjeta. Te migramos los datos de tu sistema actual sin costo.
            </p>
          </div>

          {/* Mockup placeholder */}
          <div
            aria-hidden
            style={{
              borderRadius: 'var(--r, 16px)',
              border: '1px solid var(--line-2, #2E3036)',
              background: 'var(--surface, #1C1E21)',
              padding: 18,
              boxShadow: 'var(--elev, 0 8px 24px -10px rgba(0,0,0,0.7))',
              minHeight: 320,
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
              gap: 14,
            }}
          >
            {/* Fake browser chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{ width: 10, height: 10, borderRadius: 99, background: '#FF5F56' }}
              />
              <span
                style={{ width: 10, height: 10, borderRadius: 99, background: '#FFBD2E' }}
              />
              <span
                style={{ width: 10, height: 10, borderRadius: 99, background: '#27C93F' }}
              />
              <div style={{ flex: 1 }} />
              <span
                className="caps"
                style={{ fontSize: 9, color: 'var(--text-3)' }}
              >
                panel.deuntoque.com
              </span>
            </div>
            {/* Fake dashboard tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: 10,
                minHeight: 240,
              }}
            >
              <div
                className="pastel-tile"
                style={{ background: 'var(--p-mint, #CFDDDB)', padding: 14 }}
              >
                <div className="caps" style={{ color: '#1A1B1F', opacity: 0.7 }}>
                  Reservas hoy
                </div>
                <div
                  className="num-big"
                  style={{ fontSize: 40, color: '#1A1B1F', marginTop: 'auto' }}
                >
                  47
                </div>
              </div>
              <div
                className="pastel-tile"
                style={{ background: 'var(--p-lilac, #E4CDED)', padding: 14 }}
              >
                <div className="caps" style={{ color: '#1A1B1F', opacity: 0.7 }}>
                  Cubiertos
                </div>
                <div
                  className="num-big"
                  style={{ fontSize: 40, color: '#1A1B1F', marginTop: 'auto' }}
                >
                  142
                </div>
              </div>
              <div
                className="pastel-tile"
                style={{ background: 'var(--p-butter, #EEE2B8)', padding: 14 }}
              >
                <div className="caps" style={{ color: '#1A1B1F', opacity: 0.7 }}>
                  Ocupación
                </div>
                <div
                  className="num-big"
                  style={{ fontSize: 40, color: '#1A1B1F', marginTop: 'auto' }}
                >
                  82%
                </div>
              </div>
              <div
                className="pastel-tile"
                style={{ background: 'var(--p-pink, #F1C8D0)', padding: 14 }}
              >
                <div className="caps" style={{ color: '#1A1B1F', opacity: 0.7 }}>
                  Ticket prom.
                </div>
                <div
                  className="num-big"
                  style={{ fontSize: 32, color: '#1A1B1F', marginTop: 'auto' }}
                >
                  $14k
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof placeholder */}
        <div
          style={{
            marginTop: 56,
            padding: '24px 24px',
            borderTop: '1px solid var(--line, #23252A)',
            borderBottom: '1px solid var(--line, #23252A)',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <p className="caps" style={{ margin: 0 }}>
            Pronto los logos de los primeros pilotos
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {['Trattoria N', 'Wine bar S', 'Cervecería B', 'Asador P', 'Café C'].map((name) => (
              <span
                key={name}
                style={{
                  height: 36,
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 8,
                  background: 'var(--surface-2, #23252A)',
                  border: '1px dashed var(--line-3, #3B3E45)',
                  color: 'var(--text-3, #6D6C68)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  letterSpacing: '0.06em',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <style>{`
          @media (min-width: 1024px) {
            .hero-grid {
              grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr) !important;
            }
          }
        `}</style>
      </section>

      {/* ─── Pricing (mobile-first: antes de features) ─── */}
      <section
        id="pricing"
        style={{
          padding: 'clamp(40px, 6vw, 72px) 28px',
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Precio único
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', margin: '0 0 8px' }}
        >
          ARS 30.000
          <span style={{ color: 'var(--text-3, #6D6C68)', fontSize: '0.5em' }}>/mes</span>
        </h2>
        <p
          style={{
            color: 'var(--text-2, #A9A8A2)',
            maxWidth: 520,
            margin: '0 auto 28px',
            lineHeight: 1.55,
          }}
        >
          Plan único, todo incluido. Sin sorpresas, sin comisiones por cubierto, sin
          penalizaciones por cancelar. Si no te sirve, pausás cuando quieras.
        </p>

        <div
          className="card"
          style={{ padding: 28, textAlign: 'left', display: 'grid', gap: 10 }}
        >
          {[
            'Reservas ilimitadas + cola de espera',
            'WhatsApp Business API integrado',
            'CRM con export CSV (tus clientes son tuyos)',
            'Analytics y heatmap de demanda',
            'Multi-staff con turnos y handoff',
            'Migración desde TheFork / Maxirest / Fudo sin costo',
            'Soporte humano por WhatsApp en horario AR',
          ].map((line) => (
            <div
              key={line}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 99,
                  background: 'var(--p-mint-2, #A8C2BF)',
                  color: '#1A1B1F',
                  display: 'inline-grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {line}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 28,
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/onboarding"
            className="btn btn-primary"
            style={{ height: 48, padding: '0 28px', borderRadius: 999, fontSize: 15 }}
          >
            30 días gratis · sin tarjeta
          </Link>
          <Link
            href="/demo"
            className="btn"
            style={{ height: 48, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
          >
            Agendá demo de 15min
          </Link>
        </div>
      </section>

      {/* ─── Diferenciadores ─── */}
      <section
        id="features"
        style={{
          padding: 'clamp(40px, 6vw, 72px) 28px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Lo que nos hace distintos
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 32px' }}
        >
          Pensado para que tu negocio{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-mint, #CFDDDB)' }}>
            crezca
          </span>
          .
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {[
            {
              pastel: 'p-lilac',
              title: 'Sin comisión',
              body: 'Las plataformas tradicionales cobran por cubierto. Nosotros, cero. Pagás un mensual fijo y listo.',
            },
            {
              pastel: 'p-mint',
              title: 'CRM nativo',
              body: 'Cada reserva alimenta tu base de clientes. Segmentación VIP/Fieles/Dormidos automática.',
            },
            {
              pastel: 'p-pink',
              title: 'WhatsApp segmentado',
              body: 'Mandales un winback a los dormidos en 3 clicks. Templates aprobados con Meta.',
            },
            {
              pastel: 'p-sky',
              title: 'Realtime + push',
              body: 'Reservas que entran sonido + toast + push al teléfono. No te perdés ninguna.',
            },
            {
              pastel: 'p-butter',
              title: 'Rating bidireccional',
              body: 'Si te dejan una review injusta, podés responder público. Otros clientes leen tu lado.',
            },
            {
              pastel: 'p-periwink',
              title: 'Modo grupo',
              body: 'Cervecerías, peñas, eventos: dividí cuenta entre 12 personas y mandá pedido único a cocina.',
            },
            {
              pastel: 'p-peach',
              title: 'Migrá sin fricción',
              body: 'Importá mesas y reservas con CSV. Idempotente — re-cargá sin duplicar.',
            },
            {
              pastel: 'p-mint',
              title: 'Tus datos son tuyos',
              body: 'Export CSV/JSON cuando quieras. No los vendemos. No te bloqueamos al cancelar.',
            },
          ].map((f, i) => (
            <article
              key={f.title + i}
              className="pastel-tile"
              style={{
                background: `var(--${f.pastel}, #E4CDED)`,
                minHeight: 180,
                padding: 20,
                color: '#1A1B1F',
              }}
            >
              <h3 className="fr-900-italic" style={{ fontSize: 22, marginBottom: 12, margin: '0 0 12px' }}>
                {f.title}
              </h3>
              <p
                style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(26,27,31,0.78)', margin: 0 }}
              >
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Migración ─── */}
      <section
        id="migracion"
        style={{
          padding: 'clamp(48px, 6vw, 80px) 28px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Migration Toolkit
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 16px' }}
        >
          Migrá desde TheFork, Maxirest o Fudo en{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-butter, #EEE2B8)' }}>
            10 minutos
          </span>
          .
        </h2>
        <p
          style={{
            color: 'var(--text-2, #A9A8A2)',
            maxWidth: 720,
            lineHeight: 1.55,
            marginBottom: 32,
          }}
        >
          Wizard guiado de 5 pasos. Mapeo automático de campos. Carga idempotente — re-subís el CSV
          y no genera duplicados. Si te trabás, te ayudamos por WhatsApp.
        </p>

        {/* Logos placeholder */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          {[
            { name: 'TheFork®', tag: 'reservas online' },
            { name: 'Maxirest®', tag: 'punto de venta' },
            { name: 'Fudo®', tag: 'gestión gastro' },
            { name: 'Excel / Sheets', tag: 'CSV genérico' },
          ].map((src) => (
            <div
              key={src.name}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--surface-2, #23252A)',
                border: '1px dashed var(--line-3, #3B3E45)',
                display: 'grid',
                gap: 4,
                minWidth: 160,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display, "Fraunces", serif)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--text)',
                }}
              >
                {src.name}
              </div>
              <div
                className="caps"
                style={{ color: 'var(--text-3)', fontSize: 9 }}
              >
                {src.tag}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 11,
            color: 'var(--text-3, #6D6C68)',
            marginBottom: 28,
            maxWidth: 720,
            lineHeight: 1.55,
          }}
        >
          TheFork®, Maxirest® y Fudo® son marcas registradas de sus respectivos titulares. Esta
          plataforma no está afiliada ni asociada con esas marcas. Mencionamos los nombres únicamente
          para indicar formatos de exportación de datos compatibles con nuestro importador.
        </p>

        {/* Toolkit bullets */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          {[
            { n: '01', t: 'Wizard 5 pasos', d: 'Subir CSV → mapear → preview → migrar → verificar.' },
            { n: '02', t: 'Idempotente', d: 'Re-cargás sin generar duplicados. Si fallás, no rompés data.' },
            { n: '03', t: 'Mesas + clientes + reservas', d: 'Migra los 3 sets en una sola corrida.' },
            { n: '04', t: 'Soporte humano', d: 'Te ayudamos por WhatsApp si te trabás. Sin costo.' },
          ].map((b) => (
            <article
              key={b.n}
              className="card"
              style={{
                padding: 18,
                display: 'grid',
                gap: 6,
              }}
            >
              <span
                className="caps"
                style={{
                  color: 'var(--p-butter-2, #D9C787)',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                }}
              >
                {b.n}
              </span>
              <h3
                className="fr-900"
                style={{
                  fontSize: 18,
                  letterSpacing: '-0.02em',
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                {b.t}
              </h3>
              <p
                style={{
                  color: 'var(--text-2, #A9A8A2)',
                  fontSize: 13,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {b.d}
              </p>
            </article>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link
            href="/vs-thefork"
            className="btn"
            style={{ height: 44, padding: '0 22px', borderRadius: 999, fontSize: 14 }}
          >
            UnToque vs TheFork →
          </Link>
          <Link
            href="/vs-maxirest"
            className="btn"
            style={{ height: 44, padding: '0 22px', borderRadius: 999, fontSize: 14 }}
          >
            UnToque vs Maxirest →
          </Link>
          <Link
            href="/vs-fudo"
            className="btn"
            style={{ height: 44, padding: '0 22px', borderRadius: 999, fontSize: 14 }}
          >
            UnToque vs Fudo →
          </Link>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section
        id="faq"
        style={{
          padding: 'clamp(48px, 6vw, 80px) 28px',
          maxWidth: 880,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Preguntas frecuentes
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 32px' }}
        >
          Lo que nos preguntan{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-pink, #F1C8D0)' }}>
            siempre
          </span>
          .
        </h2>

        <div style={{ display: 'grid', gap: 8 }}>
          {FAQS.map((f, i) => (
            <article key={f.q}>
            <details
              style={{
                background: 'var(--surface, #1C1E21)',
                border: '1px solid var(--line, #23252A)',
                borderRadius: 12,
                padding: '14px 18px',
              }}
              open={i === 0}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  fontFamily: 'var(--font-display, "Fraunces", serif)',
                  fontWeight: 700,
                  fontSize: 'clamp(15px, 2vw, 18px)',
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                }}
              >
                {f.q}
              </summary>
              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: 'var(--text-2, #A9A8A2)',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {f.a}
              </p>
            </details>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section
        style={{
          padding: 'clamp(48px, 6vw, 80px) 28px',
          maxWidth: 880,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: '0 0 16px' }}
        >
          Probalo{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
            30 días gratis
          </span>
          .
        </h2>
        <p
          style={{
            color: 'var(--text-2, #A9A8A2)',
            maxWidth: 560,
            margin: '0 auto 28px',
            lineHeight: 1.55,
          }}
        >
          Sin tarjeta, sin contrato anual, sin permanencia. Si no te suma, lo cerrás y te llevás
          tu data en CSV.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/demo"
            className="btn btn-primary"
            style={{ height: 52, padding: '0 28px', borderRadius: 999, fontSize: 15 }}
          >
            Agendá demo de 15min →
          </Link>
          <Link
            href="/onboarding"
            className="btn"
            style={{ height: 52, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
          >
            Probá gratis
          </Link>
        </div>
      </section>
      </main>

      <LegalFooter />
    </div>
  )
}
