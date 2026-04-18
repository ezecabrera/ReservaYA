import { AnimatedNumber } from './AnimatedNumber'

type Tone = 'neutral' | 'coral' | 'sage' | 'amber' | 'blue' | 'mauve'

// Tonos del sistema ink — 6 variantes mapeadas a la paleta nueva.
const TONES: Record<Tone, { bar: string; text: string; iconBg: string; iconColor: string }> = {
  neutral: {
    bar:       'from-ink-text-2 via-ink-text-3 to-transparent',
    text:      'text-ink-text',
    iconBg:    'bg-ink-3',
    iconColor: 'text-ink-text-2',
  },
  coral: {  // → terracota
    bar:       'from-terracotta/55 via-terracotta/15 to-transparent',
    text:      'text-terracotta',
    iconBg:    'bg-terracotta/18',
    iconColor: 'text-terracotta',
  },
  sage: {  // → olive
    bar:       'from-olive/60 via-olive/15 to-transparent',
    text:      'text-olive',
    iconBg:    'bg-olive/18',
    iconColor: 'text-olive',
  },
  amber: {  // → gold
    bar:       'from-gold/60 via-gold/15 to-transparent',
    text:      'text-gold',
    iconBg:    'bg-gold/18',
    iconColor: 'text-gold',
  },
  blue: {  // → neutral con tinte frío (sirve para "reservas")
    bar:       'from-[#9AAEE0]/40 via-[#9AAEE0]/10 to-transparent',
    text:      'text-[#9AAEE0]',
    iconBg:    'bg-[#9AAEE0]/12',
    iconColor: 'text-[#9AAEE0]',
  },
  mauve: {  // → wine soft
    bar:       'from-wine-soft/45 via-wine/12 to-transparent',
    text:      'text-wine-soft',
    iconBg:    'bg-wine/18',
    iconColor: 'text-wine-soft',
  },
}

interface PremiumStatCardProps {
  label: string
  value: number | string
  /** Si es número, se anima con count-up. Si es string, se muestra directo. */
  animate?: boolean
  decimals?: number
  suffix?: string
  /** Línea secundaria opcional debajo del valor. */
  hint?: string
  /** Color de acento — da identidad por métrica. */
  tone?: Tone
  /** SVG 20x20 que se muestra arriba-derecha. */
  icon?: React.ReactNode
}

/**
 * Stat card con línea de acento arriba (gradient fade) + número grande en
 * Fraunces + icono en badge tintado.
 *
 * Evita el look de "dashboard startup cualquiera": la combinación de serif
 * display + accent bar + icono premium + animación de entrada le da carácter.
 */
export function PremiumStatCard({
  label,
  value,
  animate = true,
  decimals = 0,
  suffix = '',
  hint,
  tone = 'neutral',
  icon,
}: PremiumStatCardProps) {
  const t = TONES[tone]
  const isNumber = typeof value === 'number'

  return (
    <div className="relative bg-ink-2 border border-ink-line rounded-2xl p-4
                    overflow-hidden transition-colors hover:bg-ink-3">
      {/* Accent bar arriba */}
      <div
        aria-hidden
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${t.bar}`}
      />

      {/* Icono arriba-derecha */}
      {icon && (
        <div className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-lg
                         ${t.iconBg} ${t.iconColor} flex items-center justify-center`}>
          {icon}
        </div>
      )}

      <p className="text-[10.5px] font-bold text-ink-text-3 uppercase tracking-[0.1em] mb-2">
        {label}
      </p>
      <p className={`font-display font-bold text-[30px] leading-none tracking-tight ${t.text}`}>
        {animate && isNumber
          ? <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          : `${value}${suffix}`}
      </p>
      {hint && (
        <p className="text-ink-text-2 text-[11.5px] mt-1.5 leading-snug">{hint}</p>
      )}
    </div>
  )
}
