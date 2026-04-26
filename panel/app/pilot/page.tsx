import type { Metadata } from 'next'
import Link from 'next/link'
import PilotForm from './PilotForm'

export const metadata: Metadata = {
  title: 'Programa Piloto UnToque · 50% off durante 3 meses',
  description:
    'Para los primeros 10 restaurantes argentinos que se sumen. ARS 15.000/mes durante 3 meses, migración asistida sin costo y soporte directo del founder.',
  openGraph: {
    title: 'Programa Piloto UnToque',
    description: '50% off los primeros 3 meses + onboarding 1-on-1 con el founder.',
    type: 'website',
    images: [
      {
        url: 'https://panel.deuntoque.com/og/pilot',
        width: 1200,
        height: 630,
        alt: 'Programa Piloto UnToque · 50% off 3 meses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Programa Piloto UnToque',
    description: '50% off los primeros 3 meses · primeros 10 restaurantes.',
    images: ['https://panel.deuntoque.com/og/pilot'],
  },
}

export default function PilotPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #111315)',
        color: 'var(--text, #F4F2EE)',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      {/* ─── Header / Nav ─── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(17, 19, 21, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line, #23252A)',
        }}
      >
      <nav
        aria-label="Navegación principal"
        style={{
          padding: '14px 28px',
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
          href="/demo"
          style={{ fontSize: 13, color: 'var(--text-2, #A9A8A2)', textDecoration: 'none', padding: '8px 12px' }}
        >
          Agendar demo
        </Link>
      </nav>
      </header>

      <main>
      {/* ─── Hero ─── */}
      <section aria-labelledby="pilot-hero" style={{ padding: '64px 28px 56px', maxWidth: 1080, margin: '0 auto' }}>
        <p className="caps" style={{ marginBottom: 14 }}>
          Cupos limitados · 10 restaurantes
        </p>
        <h1
          id="pilot-hero"
          className="fr-900"
          style={{
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 0.97,
            margin: 0,
            letterSpacing: '-0.04em',
          }}
        >
          Programa Piloto{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
            UnToque
          </span>
          .
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 22px)',
            color: 'var(--text-2, #A9A8A2)',
            marginTop: 20,
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          50% off durante 3 meses + onboarding 1-on-1 con el founder. Para los primeros 10
          restaurantes argentinos que se sumen.{' '}
          <strong style={{ color: 'var(--text)' }}>ARS 15.000/mes</strong> durante el período de
          piloto.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <a
            href="#postular"
            className="btn btn-primary"
            style={{ height: 48, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
          >
            Postularme al piloto →
          </a>
          <Link
            href="/demo"
            className="btn"
            style={{ height: 48, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
          >
            Mejor agendá una demo de 15min
          </Link>
        </div>
      </section>

      {/* ─── 3 razones ─── */}
      <section
        style={{
          padding: '40px 28px 80px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Por qué sumarte ahora
        </p>
        <h2 className="fr-900" style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 28px' }}>
          Tres razones{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-mint, #CFDDDB)' }}>
            concretas
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
              title: 'Precio fundador',
              body: 'ARS 15.000/mes durante los primeros 3 meses (50% off del precio público de ARS 30k). Te queda ese precio bloqueado contra cualquier suba durante todo el primer año.',
            },
            {
              pastel: 'p-mint',
              title: 'Migración sin costo',
              body: 'Te traemos los datos desde TheFork, Maxirest, Fudo o Excel. Mesas, clientes, historial de reservas. Vos seguís operando — corremos la migración en paralelo.',
            },
            {
              pastel: 'p-pink',
              title: 'Soporte directo del founder',
              body: 'Mi WhatsApp personal. Si algo no funciona, respondo yo. Sin tickets, sin niveles de soporte, sin esperar a un mail. Mientras seas piloto, pegás un toque y resuelvo.',
            },
          ].map((f) => (
            <article
              key={f.title}
              className="pastel-tile"
              style={{
                background: `var(--${f.pastel}, #E4CDED)`,
                minHeight: 200,
                padding: 22,
                color: '#1A1B1F',
              }}
            >
              <h3 className="fr-900-italic" style={{ fontSize: 22, margin: '0 0 12px' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(26,27,31,0.78)', margin: 0 }}>
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Qué esperamos del piloto ─── */}
      <section
        style={{
          padding: '40px 28px 80px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          La parte tuya
        </p>
        <h2 className="fr-900" style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 12px' }}>
          Lo que esperamos{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-butter, #F1DFA4)' }}>
            de vos
          </span>
          .
        </h2>
        <p style={{ color: 'var(--text-2, #A9A8A2)', maxWidth: 720, marginBottom: 28, lineHeight: 1.55 }}>
          Esto es un trato de doble vía: nosotros te damos un descuento real y soporte de founder, y
          vos nos ayudás a moldear el producto.
        </p>

        <div
          className="card"
          style={{
            padding: 28,
            display: 'grid',
            gap: 14,
          }}
        >
          {[
            'Una call mensual de 15 minutos con feedback estructurado (qué funciona, qué falta, qué te frenó).',
            'Posibilidad de ser caso de éxito en redes/landing — opcional, vos decidís si tu nombre aparece.',
            '1 o 2 testimonios escritos al final del período (sólo si la experiencia te dejó conforme).',
            'Reportar bugs cuando aparezcan — preferimos que nos avises antes de que te frene la operación.',
          ].map((line) => (
            <div key={line} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, lineHeight: 1.5 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 99,
                  background: 'var(--p-mint-2, #A8C2BF)',
                  color: '#1A1B1F',
                  display: 'inline-grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                ✓
              </span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Compromiso ─── */}
      <section
        style={{
          padding: '40px 28px 80px',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Letra chica honesta
        </p>
        <h2 className="fr-900" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '0 0 20px' }}>
          Compromiso de{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-sky, #C9DCEA)' }}>
            6 meses
          </span>
          .
        </h2>
        <div
          className="card"
          style={{ padding: 24, fontSize: 14, lineHeight: 1.6, color: 'var(--text-2, #A9A8A2)' }}
        >
          <p style={{ margin: '0 0 12px' }}>
            <strong style={{ color: 'var(--text)' }}>3 meses piloto + 3 meses standard.</strong>{' '}
            Total 6 meses de relación. Pasados los 3 primeros, pasás a precio público (ARS 30k/mes)
            por los siguientes 3.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            <strong style={{ color: 'var(--text)' }}>¿Y si querés bajarte antes?</strong> Podés. No
            te penalizamos ni te cobramos cargo de cancelación. Lo único que perdés es el descuento
            de los meses que no usaste — el precio fundador queda para los pilotos que completaron
            el período.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--text)' }}>Tus datos son tuyos.</strong> Si te vas, te
            llevás el CSV con clientes, historial y reservas. Sin trabas.
          </p>
        </div>
      </section>

      {/* ─── Form ─── */}
      <section
        id="postular"
        style={{
          padding: '40px 28px 80px',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Postularme
        </p>
        <h2 className="fr-900" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '0 0 12px' }}>
          Mandame tus{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-pink, #F0CFD0)' }}>
            datos
          </span>
          .
        </h2>
        <p style={{ color: 'var(--text-2, #A9A8A2)', marginBottom: 24, lineHeight: 1.55 }}>
          Te respondo personalmente en menos de 24h hábiles. Sin formulario eterno: lo justo para
          conocernos antes de la call.
        </p>
        <PilotForm />
      </section>
      </main>

      {/* ─── Footer ─── */}
      <footer
        style={{
          padding: '32px 28px 56px',
          borderTop: '1px solid var(--line, #23252A)',
          textAlign: 'center',
          color: 'var(--text-3, #6D6C68)',
          fontSize: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 20,
            justifyContent: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/landing" style={{ color: 'inherit', textDecoration: 'none' }}>
            Volver a inicio
          </Link>
          <Link href="/demo" style={{ color: 'inherit', textDecoration: 'none' }}>
            Demo 15min
          </Link>
          <a href="mailto:hola@deuntoque.com" style={{ color: 'inherit', textDecoration: 'none' }}>
            hola@deuntoque.com
          </a>
        </div>
        <p>© 2026 UnToque · Hecho en Argentina</p>
      </footer>
    </div>
  )
}
