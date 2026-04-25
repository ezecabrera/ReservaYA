import Link from 'next/link'
import LegalFooter from './LegalFooter'

export type ComparativeRow = {
  feature: string
  us: string
  them: string
  usWin: boolean
}

export type ComparativeHero = {
  title: string
  italic: string
  intro: string
  bigStat: { value: string; label: string; strike?: boolean; accent: string }
  ourStat: { value: string; label: string; accent: string }
}

/**
 * ComparativeLayout — layout reusable para /vs-thefork, /vs-maxirest, /vs-fudo.
 * Server Component. Inline styles + tokens del design system.
 */
export default function ComparativeLayout({
  brand,
  rows,
  hero,
  migrationCopy,
}: {
  brand: string
  rows: ComparativeRow[]
  hero: ComparativeHero
  migrationCopy: string
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #111315)',
        color: 'var(--text, #F4F2EE)',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      {/* Nav (sólido, sin blur) */}
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
          href="/demo"
          className="btn"
          style={{ height: 36, padding: '0 14px', borderRadius: 999, fontSize: 13 }}
        >
          Agendá demo
        </Link>
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
          padding: 'clamp(48px, 8vw, 88px) 28px clamp(40px, 6vw, 64px)',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 14 }}>
          Comparativa 2026
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
          {hero.title} —{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
            {hero.italic}
          </span>
          .
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 1.5vw, 18px)',
            color: 'var(--text-2, #A9A8A2)',
            marginTop: 24,
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          {hero.intro}
        </p>

        {/* Stat duel */}
        <div
          style={{
            marginTop: 36,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            maxWidth: 720,
          }}
        >
          <div className="card" style={{ padding: 20, display: 'grid', gap: 6 }}>
            <span className="caps" style={{ color: 'var(--text-3)' }}>
              {hero.bigStat.label}
            </span>
            <span
              className="num-big"
              style={{
                fontSize: 48,
                color: hero.bigStat.accent,
                textDecoration: hero.bigStat.strike ? 'line-through' : 'none',
              }}
            >
              {hero.bigStat.value}
            </span>
          </div>
          <div
            className="card"
            style={{
              padding: 20,
              display: 'grid',
              gap: 6,
              background: 'var(--p-mint, #CFDDDB)',
              borderColor: 'var(--p-mint-2, #A8C2BF)',
            }}
          >
            <span className="caps" style={{ color: '#1A1B1F', opacity: 0.65 }}>
              {hero.ourStat.label}
            </span>
            <span className="num-big" style={{ fontSize: 48, color: '#1A1B1F' }}>
              {hero.ourStat.value}
            </span>
          </div>
        </div>
      </section>

      {/* Comparative table */}
      <section
        style={{
          padding: 'clamp(24px, 4vw, 48px) 28px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Feature × feature
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 24px' }}
        >
          La comparación{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-butter, #EEE2B8)' }}>
            sin maquillaje
          </span>
          .
        </h2>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr',
              gap: 12,
              padding: '14px 18px',
              background: 'var(--bg-2, #17191B)',
              borderBottom: '1px solid var(--line, #23252A)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-3, #6D6C68)',
            }}
          >
            <div>Feature</div>
            <div style={{ color: 'var(--p-mint-2, #A8C2BF)' }}>UnToque</div>
            <div>{brand}</div>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.feature}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr',
                gap: 12,
                padding: '14px 18px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line, #23252A)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display, "Fraunces", serif)',
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontSize: 14,
                }}
              >
                {row.feature}
              </div>
              <div
                style={{
                  color: 'var(--text)',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                {row.usWin && (
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 99,
                      background: 'var(--p-mint-2, #A8C2BF)',
                      color: '#1A1B1F',
                      display: 'inline-grid',
                      placeItems: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </span>
                )}
                <span>{row.us}</span>
              </div>
              <div style={{ color: 'var(--text-2, #A9A8A2)' }}>{row.them}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why migrate */}
      <section
        style={{
          padding: 'clamp(48px, 6vw, 80px) 28px',
          maxWidth: 880,
          margin: '0 auto',
        }}
      >
        <p className="caps" style={{ marginBottom: 8 }}>
          Por qué los restaurantes están migrando
        </p>
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 16px' }}
        >
          La data{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-pink, #F1C8D0)' }}>
            es tuya
          </span>
          .
        </h2>
        <p
          style={{
            color: 'var(--text-2, #A9A8A2)',
            fontSize: 'clamp(15px, 1.4vw, 17px)',
            lineHeight: 1.65,
            maxWidth: 720,
          }}
        >
          {migrationCopy}
        </p>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: 'clamp(40px, 6vw, 72px) 28px clamp(64px, 8vw, 96px)',
          maxWidth: 880,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <h2
          className="fr-900"
          style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: '0 0 14px' }}
        >
          ¿Lo probás{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac, #E4CDED)' }}>
            30 días gratis
          </span>
          ?
        </h2>
        <p
          style={{
            color: 'var(--text-2, #A9A8A2)',
            maxWidth: 560,
            margin: '0 auto 28px',
            lineHeight: 1.55,
          }}
        >
          Sin tarjeta. Migramos tu data desde {brand} sin costo. Si no te convence, te llevás
          tu CSV y listo.
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
            Empezar prueba gratis
          </Link>
        </div>
      </section>

      <LegalFooter />
    </div>
  )
}
