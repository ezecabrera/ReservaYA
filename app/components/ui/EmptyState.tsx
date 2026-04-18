import Link from 'next/link'

type Accent = 'coral' | 'sage' | 'amber' | 'blue' | 'mauve'

const CLS: Record<Accent, string> = {
  coral: 'bg-wine/10 text-wine border-wine/25',
  sage:  'bg-olive/12 text-[#2E6B52] border-olive/25',
  amber: 'bg-gold/14 text-[#8F6618] border-gold/30',
  blue:  'bg-olive/10 text-[#2E6B52] border-olive/20',
  mauve: 'bg-wine/8 text-wine border-wine/18',
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
            className="mt-5 px-5 h-11 rounded-xl bg-wine text-white text-[13.5px]
                       font-bold flex items-center justify-center
                       active:scale-[0.98] transition-transform
                       shadow-[0_8px_20px_-6px_rgba(161,49,67,0.55)] hover:brightness-110 transition-all"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 px-5 h-11 rounded-xl bg-wine text-white text-[13.5px]
                       font-bold active:scale-[0.98] transition-transform
                       shadow-[0_8px_20px_-6px_rgba(161,49,67,0.55)] hover:brightness-110 transition-all"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
