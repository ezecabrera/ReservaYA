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

      {/* Booking card (placeholder hasta tener Cal.com activo) */}
      <section
        style={{
          padding: '0 clamp(20px, 4vw, 28px)',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <div
          className="card"
          style={{
            padding: 'clamp(28px, 5vw, 40px)',
            display: 'grid',
            gap: 24,
            background: 'var(--surface-2, #23252A)',
          }}
        >
          <div style={{ display: 'grid', gap: 8 }}>
            <p className="caps" style={{ color: 'var(--p-mint-2, #A8C2BF)' }}>
              Reservá tu turno
            </p>
            <h2
              className="fr-900"
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              Te respondemos{' '}
              <span className="fr-900-italic" style={{ color: 'var(--p-mint, #CFDDDB)' }}>
                en menos de 2 horas
              </span>
              .
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-2, #A9A8A2)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Mandanos un mensaje con tu nombre, restaurante y mejor horario. Coordinamos por
              WhatsApp y te mandamos el link de Google Meet.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <a
              href="https://wa.me/5491155550000?text=Hola%2C%20quiero%20agendar%20una%20demo%20de%20UnToque"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                height: 52,
                padding: '0 24px',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.5-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.4.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z" />
                <path d="M20.5 3.5C18.3 1.2 15.3 0 12.1 0 5.5 0 .1 5.4.1 12c0 2.1.5 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.6 1.4 5.5 1.4h.1c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.4-8.4zM12.1 21.7c-1.7 0-3.4-.5-4.9-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.5-1.5-3.2-1.5-5 0-5.4 4.4-9.8 9.8-9.8 2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9-.1 5.4-4.5 9.6-9.9 9.6z" />
              </svg>
              Escribir por WhatsApp
            </a>
            <a
              href="mailto:hola@deuntoque.com?subject=Quiero%20agendar%20demo%20UnToque&body=Hola%2C%0A%0AMe%20gustar%C3%ADa%20agendar%20una%20demo%20de%20UnToque.%0A%0ARestaurante%3A%20%0AUbicaci%C3%B3n%3A%20%0AMesas%3A%20%0AMejor%20horario%20para%20llamar%3A%20%0A%0AGracias."
              className="btn"
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 14,
                fontSize: 14,
                background: 'var(--surface-3, #2C2D34)',
                color: 'var(--text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Mandar email a hola@deuntoque.com
            </a>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--bg, #111315)',
              border: '1px solid var(--line-2, #2E3036)',
              fontSize: 12,
              color: 'var(--text-3, #6D6C68)',
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: 'var(--text-2)' }}>Próximamente:</strong> reserva
            self-service con Cal.com y Google Calendar integrado. Mientras tanto te coordinamos
            uno por uno — más personal, igual de rápido.
          </div>
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
