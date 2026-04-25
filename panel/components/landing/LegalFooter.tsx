import Link from 'next/link'

/**
 * LegalFooter — footer reusable para landing, /demo y páginas comparativas (/vs-*).
 * Colores 100% opacos. Tipografías Fraunces / Plus Jakarta Sans.
 */
export default function LegalFooter() {
  return (
    <footer
      style={{
        padding: '40px 28px 56px',
        borderTop: '1px solid var(--line, #23252A)',
        background: 'var(--bg, #111315)',
        color: 'var(--text-3, #6D6C68)',
        fontSize: 12,
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'grid',
          gap: 24,
        }}
      >
        {/* Top row: brand + nav links */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              style={{ fontSize: 18, color: 'var(--text, #F4F2EE)', letterSpacing: '-0.02em' }}
            >
              UnToque
            </span>
          </div>

          <nav
            aria-label="Footer"
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Link href="/landing" style={{ color: 'inherit', textDecoration: 'none' }}>
              Inicio
            </Link>
            <Link href="/vs-thefork" style={{ color: 'inherit', textDecoration: 'none' }}>
              vs TheFork
            </Link>
            <Link href="/vs-maxirest" style={{ color: 'inherit', textDecoration: 'none' }}>
              vs Maxirest
            </Link>
            <Link href="/vs-fudo" style={{ color: 'inherit', textDecoration: 'none' }}>
              vs Fudo
            </Link>
            <Link href="/demo" style={{ color: 'inherit', textDecoration: 'none' }}>
              Agendar demo
            </Link>
          </nav>
        </div>

        {/* Legal row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            paddingTop: 18,
            borderTop: '1px solid var(--line, #23252A)',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <a
              href="https://deuntoque.com/terms"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              Términos
            </a>
            <a
              href="https://deuntoque.com/privacy"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              Privacidad
            </a>
            <a
              href="https://deuntoque.com/cookies"
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
          <p style={{ margin: 0 }}>
            © 2026 UnToque · Sin comisión por cubierto · Hecho en Argentina
          </p>
        </div>
      </div>
    </footer>
  )
}
