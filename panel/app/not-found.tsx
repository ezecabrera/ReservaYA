import type { Metadata } from 'next'
import Link from 'next/link'
import LegalFooter from '@/components/landing/LegalFooter'

export const metadata: Metadata = {
  title: 'Página no encontrada · UnToque',
  description:
    'La página que buscás no existe o cambió de lugar. Volvé al inicio para encontrar lo que necesitás.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #111315)',
        color: 'var(--text, #F4F2EE)',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--line, #23252A)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Link
          href="/landing"
          aria-label="Inicio UnToque"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--p-lilac, #E4CDED)',
              color: '#1A1B1F',
              display: 'inline-grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display, "Fraunces", serif)',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 18,
            }}
          >
            u
          </span>
          <span className="fr-900" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
            UnToque
          </span>
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: '40px 24px',
        }}
      >
        <article
          style={{
            maxWidth: 560,
            textAlign: 'center',
            display: 'grid',
            gap: 20,
          }}
        >
          <p
            className="caps"
            style={{ color: 'var(--p-butter-2, #D9C787)' }}
          >
            Error 404 · Página no encontrada
          </p>
          <h1
            className="fr-900"
            style={{
              fontSize: 'clamp(48px, 8vw, 88px)',
              lineHeight: 1,
              margin: 0,
              letterSpacing: '-0.04em',
            }}
          >
            Esta mesa{' '}
            <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
              no existe
            </span>
            .
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--text-2, #A9A8A2)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Capaz cambiamos el menú o el link tiene un typo. Volvé al inicio o agendá una demo
            con nosotros.
          </p>

          <nav
            aria-label="Sugerencias"
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 12,
            }}
          >
            <Link
              href="/landing"
              className="btn btn-primary"
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Ir al inicio
            </Link>
            <Link
              href="/demo"
              className="btn"
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 999,
                fontSize: 14,
              }}
            >
              Agendá una demo
            </Link>
            <Link
              href="/login"
              className="btn"
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 999,
                fontSize: 14,
                background: 'transparent',
                color: 'var(--text-2, #A9A8A2)',
              }}
            >
              Iniciar sesión
            </Link>
          </nav>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '24px 0 0',
              display: 'grid',
              gap: 4,
              fontSize: 13,
              color: 'var(--text-3, #6D6C68)',
              textAlign: 'left',
            }}
            aria-label="Páginas más visitadas"
          >
            <li style={{ marginBottom: 4 }}>
              <strong style={{ color: 'var(--text-2)' }}>Páginas más visitadas:</strong>
            </li>
            <li>
              <Link href="/pilot" style={{ color: 'var(--text-2)' }}>Programa Piloto · 50% off 3 meses</Link>
            </li>
            <li>
              <Link href="/vs-thefork" style={{ color: 'var(--text-2)' }}>Comparativa UnToque vs TheFork</Link>
            </li>
            <li>
              <Link href="/vs-maxirest" style={{ color: 'var(--text-2)' }}>UnToque vs Maxirest</Link>
            </li>
            <li>
              <Link href="/vs-fudo" style={{ color: 'var(--text-2)' }}>UnToque vs Fudo</Link>
            </li>
            <li>
              <Link href="/onboarding" style={{ color: 'var(--text-2)' }}>Crear cuenta gratis · 30 días</Link>
            </li>
          </ul>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text-3, #6D6C68)',
              marginTop: 16,
            }}
          >
            ¿No encontrás lo que buscabas? Escribinos a{' '}
            <a
              href="mailto:hola@deuntoque.com"
              style={{ color: 'var(--p-lilac, #E4CDED)', textDecoration: 'underline' }}
            >
              hola@deuntoque.com
            </a>
            .
          </p>
        </article>
      </main>

      <LegalFooter />
    </div>
  )
}
