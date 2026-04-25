import Link from 'next/link'
import type { ReactNode } from 'react'

interface LegalShellProps {
  title: string
  /** Fecha última actualización: YYYY-MM-DD */
  updated: string
  children: ReactNode
}

/**
 * Shell común para /terms, /privacy, /cookies. Tipografía editorial
 * + nav lateral + footer con contacto. Responsive: sidebar desktop / stack mobile.
 */
export function LegalShell({ title, updated, children }: LegalShellProps) {
  const updatedLabel = new Date(`${updated}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div
      className="legal-shell"
      style={{
        minHeight: '100vh',
        background: '#F6F4EE',
        color: '#17191B',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: '40px 24px 80px',
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 48,
        }}
        className="legal-grid"
      >
        {/* Nav lateral */}
        <aside>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
              fontFamily: 'var(--font-display, "Fraunces", serif)',
              fontWeight: 900,
              fontSize: 22,
              color: '#17191B',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#E4CDED',
                color: '#1A1B1F',
                display: 'inline-grid',
                placeItems: 'center',
                fontStyle: 'italic',
                fontSize: 14,
              }}
              aria-hidden
            >
              u
            </span>
            UnToque
          </Link>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { href: '/terms', label: 'Términos' },
              { href: '/privacy', label: 'Privacidad' },
              { href: '/cookies', label: 'Cookies' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 13,
                  color: '#5A5852',
                  textDecoration: 'none',
                  padding: '6px 10px',
                  borderRadius: 8,
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <article className="legal-article">
          <p
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#8B897F',
              marginBottom: 8,
            }}
          >
            Documento legal · Actualizado {updatedLabel}
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display, "Fraunces", serif)',
              fontWeight: 900,
              fontSize: 'clamp(40px, 5vw, 64px)',
              letterSpacing: '-0.035em',
              lineHeight: 0.95,
              margin: '0 0 40px',
            }}
          >
            {title}<span style={{ color: '#C6A9D3' }}>.</span>
          </h1>
          {children}
        </article>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .legal-shell { --lgl-text: #17191B; --lgl-text-2: #5A5852; --lgl-text-3: #8B897F; --lgl-lilac: #C6A9D3; --lgl-surface: #F0EDE5; }
          .legal-article h2 {
            font-family: var(--font-display, 'Fraunces', serif);
            font-weight: 800;
            font-size: 22px;
            letter-spacing: -0.02em;
            margin: 36px 0 12px;
            color: var(--lgl-text);
          }
          .legal-article h3 {
            font-family: var(--font-display, 'Fraunces', serif);
            font-weight: 700;
            font-size: 16px;
            margin: 20px 0 8px;
            color: var(--lgl-text);
          }
          .legal-article p, .legal-article li {
            font-size: 15px;
            line-height: 1.65;
            color: var(--lgl-text-2);
          }
          .legal-article ul { padding-left: 20px; margin: 8px 0 16px; }
          .legal-article li { margin-bottom: 6px; }
          .legal-article a {
            color: var(--lgl-text);
            font-weight: 600;
            text-decoration: underline;
            text-decoration-color: var(--lgl-lilac);
            text-underline-offset: 3px;
          }
          .legal-article code {
            font-family: var(--font-mono, 'JetBrains Mono', monospace);
            font-size: 12px;
            background: var(--lgl-surface);
            padding: 2px 6px;
            border-radius: 4px;
          }
          @media (max-width: 720px) {
            .legal-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          }
        `,
        }}
      />
    </div>
  )
}
