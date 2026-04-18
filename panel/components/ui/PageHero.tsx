/**
 * PageHero — hero header con identidad de marca sobre fondo ink.
 *
 * Diseño: kicker small caps + título Space Grotesk + subtítulo tenue.
 * Accent radial muy sutil en esquina superior derecha por cada página
 * (wine, olive, gold, etc.) — le da carácter sin romper coherencia.
 */

type Accent = 'coral' | 'sage' | 'amber' | 'blue' | 'mauve' | 'wine' | 'olive' | 'gold' | 'terracotta'

// Mapa extendido: los accents viejos (coral/sage/etc) ahora apuntan a los
// equivalentes del sistema ink — migración transparente.
const ACCENTS: Record<Accent, string> = {
  coral:      'rgba(161, 49, 67, 0.22)',   // wine
  wine:       'rgba(161, 49, 67, 0.22)',
  sage:       'rgba(79, 138, 95, 0.22)',   // olive
  olive:      'rgba(79, 138, 95, 0.22)',
  amber:      'rgba(201, 145, 48, 0.22)',  // gold
  gold:       'rgba(201, 145, 48, 0.22)',
  terracotta: 'rgba(214, 106, 63, 0.22)',
  blue:       'rgba(79, 138, 95, 0.18)',   // fallback olive
  mauve:      'rgba(161, 49, 67, 0.20)',   // fallback wine
}

interface PageHeroProps {
  kicker?: string
  title: string
  subtitle?: string
  accent?: Accent
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHero({
  kicker,
  title,
  subtitle,
  accent = 'wine',
  actions,
  children,
}: PageHeroProps) {
  const rgba = ACCENTS[accent]

  return (
    <header
      className="relative overflow-hidden px-5 pt-12 pb-5 bg-ink"
      style={{
        backgroundImage: `radial-gradient(100% 120% at 100% 0%, ${rgba} 0%, transparent 55%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--ink-line-2) 50%, transparent 100%)',
        }}
      />

      <div className="flex items-start justify-between gap-4 relative">
        <div className="flex-1 min-w-0">
          {kicker && (
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-text-3 mb-1.5">
              {kicker}
            </p>
          )}
          <h1 className="font-display text-[28px] leading-[1.05] font-bold text-ink-text tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-ink-text-2 text-[13.5px] mt-1.5 leading-snug">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>

        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
