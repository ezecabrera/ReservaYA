import type { Metadata } from 'next'
import Link from 'next/link'
import LegalFooter from '@/components/landing/LegalFooter'

export const metadata: Metadata = {
  title: 'Agendá una demo · UnToque · 15 minutos en vivo',
  description:
    'Agendá una demo de 15 minutos con el equipo de UnToque. Te mostramos migración real, respondemos preguntas y armamos pricing custom para grupos.',
  metadataBase: new URL('https://deuntoque.com'),
  alternates: { canonical: 'https://deuntoque.com/demo' },
  openGraph: {
    title: 'Agendá una demo · UnToque',
    description: 'Demo de 15min en vivo. Migración, preguntas y pricing custom.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://deuntoque.com/demo',
  },
}

const REASONS = [
  {
    pastel: 'p-mint',
    title: 'Ver migración real',
    body: 'Te corremos el wizard con un CSV de TheFork/Maxirest/Fudo en vivo. Vas a ver cómo en 10 min tenés mesas, clientes y reservas migrados — sin duplicados.',
  },
  {
    pastel: 'p-lilac',
    title: 'Hacer preguntas',
    body: 'Lo que sea: contrato, datos, integración con tu POS, soporte, factura A. Te respondemos en castellano, sin scripts ni tickets en inglés.',
  },
  {
    pastel: 'p-butter',
    title: 'Pricing custom para grupos',
    body: 'Si tenés 3+ locales o querés el plan anual con descuento, lo armamos en la llamada. Sin promesas vacías, número cerrado al final.',
  },
]

export default function DemoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #111315)',
        color: 'var(--text, #F4F2EE)',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      {/* Nav (sólido) */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 28px',
          background: 'var(--bg, #111315)',
          borderBottom: '1px solid var(--line, #23252A)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Link
          href="/landing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: 'inherit',
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
          href="/onboarding"
          className="btn btn-primary"
          style={{ height: 36, padding: '0 16px', borderRadius: 999, fontSize: 13 }}
        >
          Probá gratis
        </Link>
      </nav>

      {/* Hero */}
      <section
        style={{
          padding: 'clamp(56px, 8vw, 96px) 28px clamp(40px, 6vw, 64px)',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 14 }}>
          15 minutos · en vivo
        </p>
        <h1
          className="fr-900"
          style={{
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: '-0.04em',
          }}
        >
          Agendá una demo de{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
            15min
          </span>
          ,
          <br />
          te mostramos UnToque{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-mint, #CFDDDB)' }}>
            en vivo
          </span>
          .
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            color: 'var(--text-2, #A9A8A2)',
            marginTop: 24,
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          Sin venta de humo. Te abrimos un local de prueba, corremos una migración con tu CSV
          real y respondés todas las dudas. Si después no te sirve, no pasa nada.
        </p>
      </section>

      {/* Cal.com embed + fallback */}
      <section
        style={{
          padding: '0 28px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'grid',
            minHeight: 580,
          }}
        >
          {/* Embed iframe (Cal.com placeholder) */}
          <iframe
            src="https://cal.com/untoque/15min"
            title="Agendar demo UnToque"
            loading="lazy"
            style={{
              width: '100%',
              minHeight: 580,
              border: 0,
              background: 'var(--surface, #1C1E21)',
            }}
          />
        </div>

        {/* Fallback */}
        <div
          style={{
            marginTop: 16,
            padding: '14px 18px',
            borderRadius: 12,
            background: 'var(--surface-2, #23252A)',
            border: '1px dashed var(--line-3, #3B3E45)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-2, #A9A8A2)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text)' }}>¿No carga el calendario?</strong>{' '}
            Pronto · escribinos a{' '}
            <a
              href="mailto:hola@deuntoque.com"
              style={{ color: 'var(--p-lilac, #E4CDED)', textDecoration: 'underline' }}
            >
              hola@deuntoque.com
            </a>{' '}
            y coordinamos por WhatsApp.
          </p>
          <a
            href="mailto:hola@deuntoque.com?subject=Quiero%20agendar%20demo%20UnToque"
            className="btn"
            style={{ height: 36, padding: '0 14px', borderRadius: 999, fontSize: 13 }}
          >
            Escribirnos →
          </a>
        </div>
      </section>

      {/* 3 reasons */}
      <section
        style={{
          padding: 'clamp(48px, 6vw, 80px) 28px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Por qué tomarte 15min
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 24px' }}
        >
          Tres razones{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-pink, #F1C8D0)' }}>
            concretas
          </span>
          .
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {REASONS.map((r, i) => (
            <div
              key={r.title}
              className="pastel-tile"
              style={{
                background: `var(--${r.pastel}, #E4CDED)`,
                minHeight: 200,
                padding: 22,
                color: '#1A1B1F',
                display: 'grid',
                gap: 10,
                alignContent: 'start',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'rgba(26,27,31,0.55)',
                }}
              >
                0{i + 1}
              </span>
              <div className="fr-900-italic" style={{ fontSize: 24 }}>
                {r.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(26,27,31,0.78)' }}>
                {r.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Secondary CTA */}
      <section
        style={{
          padding: 'clamp(40px, 6vw, 72px) 28px clamp(64px, 8vw, 96px)',
          maxWidth: 880,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          ¿Preferís probar solo?
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 16px' }}
        >
          Activá la prueba en{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
            2 minutos
          </span>
          .
        </h2>
        <p
          style={{
            color: 'var(--text-2, #A9A8A2)',
            maxWidth: 520,
            margin: '0 auto 24px',
            lineHeight: 1.55,
          }}
        >
          30 días gratis sin tarjeta. Onboarding guiado. Si te trabás, igual te ayudamos por
          WhatsApp.
        </p>
        <Link
          href="/onboarding"
          className="btn btn-primary"
          style={{ height: 52, padding: '0 28px', borderRadius: 999, fontSize: 15 }}
        >
          Probá gratis 30 días →
        </Link>
      </section>

      <LegalFooter />
    </div>
  )
}
