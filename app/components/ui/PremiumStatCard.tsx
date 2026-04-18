import { AnimatedNumber } from './AnimatedNumber'

type Tone = 'neutral' | 'coral' | 'sage' | 'amber' | 'blue' | 'mauve'

const TONES: Record<Tone, { bar: string; value: string; iconBg: string; iconColor: string }> = {
  neutral: { bar: 'from-black/10 via-black/3 to-transparent', value: 'text-tx',       iconBg: 'bg-sf',       iconColor: 'text-tx2' },
  coral:   { bar: 'from-[#FF4757]/70 via-[#FF4757]/15 to-transparent', value: 'text-[#D0334A]', iconBg: 'bg-[#FFE5E8]', iconColor: 'text-[#D0334A]' },
  sage:    { bar: 'from-[#2ED8A8]/70 via-[#2ED8A8]/15 to-transparent', value: 'text-[#0A9966]', iconBg: 'bg-[#E4FAF3]', iconColor: 'text-[#0A9966]' },
  amber:   { bar: 'from-[#FFB800]/70 via-[#FFB800]/15 to-transparent', value: 'text-[#A67300]', iconBg: 'bg-[#FFF3D1]', iconColor: 'text-[#A67300]' },
  blue:    { bar: 'from-[#4E8EFF]/70 via-[#4E8EFF]/15 to-transparent', value: 'text-[#2B5FCC]', iconBg: 'bg-[#E6EFFF]', iconColor: 'text-[#2B5FCC]' },
  mauve:   { bar: 'from-[#9B59FF]/70 via-[#9B59FF]/15 to-transparent', value: 'text-[#6B3BBA]', iconBg: 'bg-[#F0E6FF]', iconColor: 'text-[#6B3BBA]' },
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
