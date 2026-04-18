/**
 * PageHero para la PWA cliente (light theme).
 *
 * Diseño: kicker en uppercase tracked + título serif grande + subtítulo tenue.
 * Gradient radial sutil del accent color en esquina superior derecha.
 * Coherente con el del panel (dark) — misma estructura, distinto color base.
 */

type Accent = 'coral' | 'sage' | 'amber' | 'blue' | 'mauve' | 'wine' | 'olive' | 'gold' | 'terracotta'

// Aliases legacy (coral/sage/amber) mapean al sistema ink — wine/olive/gold.
// Los nuevos pasan directo. Tonos discretos para light theme (0.12-0.16 alpha).
const ACCENTS: Record<Accent, string> = {
  coral:      'rgba(161, 49, 67, 0.12)',   // wine
  wine:       'rgba(161, 49, 67, 0.12)',
  sage:       'rgba(79, 138, 95, 0.14)',   // olive
  olive:      'rgba(79, 138, 95, 0.14)',
  amber:      'rgba(201, 145, 48, 0.16)',  // gold (un poco más fuerte)
  gold:       'rgba(201, 145, 48, 0.16)',
  terracotta: 'rgba(214, 106, 63, 0.14)',
  blue:       'rgba(79, 138, 95, 0.12)',   // fallback olive light
  mauve:      'rgba(161, 49, 67, 0.10)',   // fallback wine light
}

interface Props {
  kicker?: string
  title: string
  subtitle?: string
  accent?: Accent
  actions?: React.ReactNode
  children?: React.ReactNode
  /** "tight" = sin mucho padding (ideal cuando hay un hero-image encima) */
  density?: 'tight' | 'regular'
}

export function PageHero({
  kicker,
  title,
  subtitle,
  accent = 'coral',
  actions,
  children,
  density = 'regular',
}: Props) {
  const pad = density === 'tight' ? 'pt-8 pb-4' : 'pt-14 pb-5'
  const rgba = ACCENTS[accent]

  return (
    <header
      className={`relative overflow-hidden px-5 ${pad}`}
      style={{
        background: `radial-gradient(120% 140% at 100% 0%, ${rgba} 0%, transparent 55%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.07) 50%, transparent 100%)',
        }}
      />

      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1 min-w-0">
          {kicker && (
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-tx3 mb-1.5">
              {kicker}
            </p>
          )}
          <h1 className="font-display text-[28px] leading-[1.05] font-bold text-tx tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-tx2 text-[13.5px] mt-1.5 leading-snug">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}
