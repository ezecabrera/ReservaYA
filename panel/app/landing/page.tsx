import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'UnToque · Panel para restaurantes que ponen el toque',
  description:
    'Reservas, mesas, cobros y campañas WhatsApp. Sin comisión por cubierto. $30.000/mes flat. Pensado para restaurantes argentinos.',
  openGraph: {
    title: 'UnToque · Panel para restaurantes',
    description: 'Sin comisión por cubierto. $30k/mes flat. Datos del cliente son tuyos.',
    type: 'website',
  },
}

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
      {/* ─── Nav ─── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 28px',
          background: 'rgba(17, 19, 21, 0.85)',
          backdropFilter: 'blur(12px)',
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
          <span
            className="fr-900"
            style={{ fontSize: 22, letterSpacing: '-0.02em' }}
          >
            UnToque
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <Link
          href="/login"
          style={{ fontSize: 13, color: 'var(--text-2, #A9A8A2)', textDecoration: 'none', padding: '8px 12px' }}
        >
          Ingresar
        </Link>
        <Link
          href="/onboarding"
          className="btn btn-primary"
          style={{ height: 36, padding: '0 16px', borderRadius: 999, fontSize: 13 }}
        >
          Probá gratis
        </Link>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ padding: '64px 28px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <p className="caps" style={{ marginBottom: 14 }}>
          Para restaurantes argentinos
        </p>
        <h1
          className="fr-900"
          style={{
            fontSize: 'clamp(48px, 7vw, 96px)',
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
          Reservas, mesas, cobros y campañas WhatsApp. Sin comisión por cubierto.
          Tus clientes son tuyos. <strong style={{ color: 'var(--text)' }}>$30.000/mes flat.</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link
            href="/onboarding"
            className="btn btn-primary"
            style={{ height: 48, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
          >
            Probá 14 días gratis →
          </Link>
          <a
            href="#features"
            className="btn"
            style={{ height: 48, padding: '0 24px', borderRadius: 999, fontSize: 15 }}
          >
            Ver features
          </a>
        </div>
        <p
          style={{
            marginTop: 18,
            fontSize: 12,
            color: 'var(--text-3, #6D6C68)',
          }}
        >
          Sin tarjeta. Migramos tus datos desde TheFork, Maxirest o Excel sin costo.
        </p>
      </section>

      {/* ─── Diferenciadores ─── */}
      <section
        id="features"
        style={{
          padding: '40px 28px 80px',
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
              body: 'TheFork te cobra €2.50 por cubierto. Nosotros cero. Pagás un mensual fijo y listo.',
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
              title: 'Migrá sin fricción',
              body: 'Importá mesas y reservas desde tu sistema actual con un CSV. Idempotente — re-cargá sin duplicar.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="pastel-tile"
              style={{
                background: `var(--${f.pastel}, #E4CDED)`,
                minHeight: 180,
                padding: 20,
                color: '#1A1B1F',
              }}
            >
              <div
                className="fr-900-italic"
                style={{ fontSize: 22, marginBottom: 12 }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(26,27,31,0.78)' }}>
                {f.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section
        style={{
          padding: '40px 28px 80px',
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Precio único
        </p>
        <h2 className="fr-900" style={{ fontSize: 'clamp(32px, 4vw, 48px)', margin: '0 0 8px' }}>
          $30.000<span style={{ color: 'var(--text-3, #6D6C68)', fontSize: '0.5em' }}>/mes</span>
        </h2>
        <p style={{ color: 'var(--text-2, #A9A8A2)', maxWidth: 480, margin: '0 auto 28px' }}>
          Plan único, todo incluido. Sin sorpresas, sin comisiones por cubierto, sin penalizaciones por
          cancelar. Si no te sirve, pausás cuando quieras.
        </p>

        <div
          className="card"
          style={{
            padding: 28,
            textAlign: 'left',
            display: 'grid',
            gap: 10,
          }}
        >
          {[
            'Reservas ilimitadas + cola de espera',
            'WhatsApp Business API integrado',
            'CRM con export CSV (tus clientes son tuyos)',
            'Analytics y heatmap de demanda',
            'Multi-staff con turnos y handoff',
            'Migración desde TheFork/Maxirest sin costo',
            'Soporte por WhatsApp en horario comercial',
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

        <Link
          href="/onboarding"
          className="btn btn-primary"
          style={{ height: 48, padding: '0 28px', marginTop: 28, borderRadius: 999, fontSize: 15 }}
        >
          Empezar prueba de 14 días
        </Link>
      </section>

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
          <a
            href="/terms"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Términos
          </a>
          <a
            href="/privacy"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Privacidad
          </a>
          <a
            href="/cookies"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Cookies
          </a>
          <a
            href="mailto:hola@deuntoque.com"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            hola@deuntoque.com
          </a>
        </div>
        <p>© 2026 UnToque · Hecho en Argentina · Sin comisión por cubierto</p>
      </footer>
    </div>
  )
}
