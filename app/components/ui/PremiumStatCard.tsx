import { AnimatedNumber } from './AnimatedNumber'

type Tone = 'neutral' | 'coral' | 'sage' | 'amber' | 'blue' | 'mauve' | 'wine' | 'olive' | 'gold'

// Accent bar + numeric value + icon badge en paleta ink editorial.
// Los "colors viejos" (coral/sage/amber/blue/mauve) siguen aceptándose como
// tone name pero mapean a wine/olive/gold del sistema ink para mantener
// coherencia con el resto del panel y la app.
const TONES: Record<Tone, { bar: string; value: string; iconBg: string; iconColor: string }> = {
  neutral: { bar: 'from-black/10 via-black/3 to-transparent',                      value: 'text-tx',         iconBg: 'bg-sf',               iconColor: 'text-tx2' },
  coral:   { bar: 'from-wine/70 via-wine/15 to-transparent',                       value: 'text-wine',       iconBg: 'bg-wine/10 border border-wine/20',       iconColor: 'text-wine' },
  wine:    { bar: 'from-wine/70 via-wine/15 to-transparent',                       value: 'text-wine',       iconBg: 'bg-wine/10 border border-wine/20',       iconColor: 'text-wine' },
  sage:    { bar: 'from-olive/70 via-olive/15 to-transparent',                     value: 'text-[#2E6B52]',  iconBg: 'bg-olive/12 border border-olive/25',     iconColor: 'text-[#2E6B52]' },
  olive:   { bar: 'from-olive/70 via-olive/15 to-transparent',                     value: 'text-[#2E6B52]',  iconBg: 'bg-olive/12 border border-olive/25',     iconColor: 'text-[#2E6B52]' },
  amber:   { bar: 'from-gold/70 via-gold/15 to-transparent',                       value: 'text-[#8F6618]',  iconBg: 'bg-gold/14 border border-gold/30',       iconColor: 'text-[#8F6618]' },
  gold:    { bar: 'from-gold/70 via-gold/15 to-transparent',                       value: 'text-[#8F6618]',  iconBg: 'bg-gold/14 border border-gold/30',       iconColor: 'text-[#8F6618]' },
  blue:    { bar: 'from-olive/60 via-olive/15 to-transparent',                     value: 'text-[#2E6B52]',  iconBg: 'bg-olive/10 border border-olive/22',     iconColor: 'text-[#2E6B52]' },
  mauve:   { bar: 'from-wine/60 via-wine/12 to-transparent',                       value: 'text-wine',       iconBg: 'bg-wine/8 border border-wine/20',        iconColor: 'text-wine' },
}

interface Props {
  label: string
  value: number | string
  animate?: boolean
  decimals?: number
  suffix?: string
  hint?: string
  tone?: Tone
  icon?: React.ReactNode
}

export function PremiumStatCard({
  label,
  value,
  animate = true,
  decimals = 0,
  suffix = '',
  hint,
  tone = 'neutral',
  icon,
}: Props) {
  const t = TONES[tone]
  const isNumber = typeof value === 'number'

  return (
    <div className="relative bg-white border border-[var(--br)] rounded-2xl p-4
                    overflow-hidden shadow-[var(--sh-sm)]
                    transition-shadow hover:shadow-[var(--sh-md)]">
      <div
        aria-hidden
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${t.bar}`}
      />
      {icon && (
        <div className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-lg
                         ${t.iconBg} ${t.iconColor} flex items-center justify-center`}>
          {icon}
        </div>
      )}
      <p className="text-[10.5px] font-bold text-tx3 uppercase tracking-[0.1em] mb-2">
        {label}
      </p>
      <p className={`font-display font-bold text-[30px] leading-none tracking-tight ${t.value}`}>
        {animate && isNumber
          ? <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          : `${value}${suffix}`}
      </p>
      {hint && (
        <p className="text-tx2 text-[11.5px] mt-1.5 leading-snug">{hint}</p>
      )}
    </div>
  )
}
