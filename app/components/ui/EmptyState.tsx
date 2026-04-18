import Link from 'next/link'

type Accent = 'coral' | 'sage' | 'amber' | 'blue' | 'mauve'

const CLS: Record<Accent, string> = {
  coral: 'bg-[#FFE5E8] text-[#D0334A] border-[#FF4757]/20',
  sage:  'bg-[#E4FAF3] text-[#0A9966] border-[#2ED8A8]/25',
  amber: 'bg-[#FFF3D1] text-[#A67300] border-[#FFB800]/25',
  blue:  'bg-[#E6EFFF] text-[#2B5FCC] border-[#4E8EFF]/25',
  mauve: 'bg-[#F0E6FF] text-[#6B3BBA] border-[#9B59FF]/25',
}

interface Props {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
  accent?: Accent
}

/**
 * Empty state light-theme para el app cliente.
 * Icon badge tintado + título serif + copy humano.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  accent = 'coral',
}: Props) {
  const cls = CLS[accent]
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && (
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 ${cls}`}>
          {icon}
        </div>
      )}
      <p className="font-display font-bold text-[18px] text-tx tracking-tight leading-snug">
        {title}
      </p>
      {description && (
        <p className="text-tx2 text-[13px] mt-1.5 max-w-[280px] leading-snug">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-5 px-5 h-11 rounded-xl bg-c1 text-white text-[13.5px]
                       font-bold flex items-center justify-center
                       active:scale-[0.98] transition-transform
                       shadow-[0_8px_20px_-6px_rgba(255,71,87,0.5)]"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 px-5 h-11 rounded-xl bg-c1 text-white text-[13.5px]
                       font-bold active:scale-[0.98] transition-transform
                       shadow-[0_8px_20px_-6px_rgba(255,71,87,0.5)]"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
