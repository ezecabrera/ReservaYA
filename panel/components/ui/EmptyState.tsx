interface EmptyStateProps {
  /** Icono grande centrado (SVG 28x28). */
  icon?: React.ReactNode
  /** Título principal — corto, editorial. */
  title: string
  /** Descripción con tono humano (opcional). */
  description?: string
  /** CTA opcional — botón que dispara una acción. */
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  /** Color de acento del icon badge (default coral). */
  accent?: 'coral' | 'sage' | 'amber' | 'blue' | 'mauve'
}

const ACCENT_CLS: Record<NonNullable<EmptyStateProps['accent']>, string> = {
  coral: 'bg-[#E5545E]/12 text-[#FF8A91] border-[#E5545E]/20',
  sage:  'bg-[#5BAF94]/12 text-[#7BD3B2] border-[#5BAF94]/20',
  amber: 'bg-[#E5A332]/12 text-[#F3C773] border-[#E5A332]/20',
  blue:  'bg-[#6A85C7]/12 text-[#9AAEE0] border-[#6A85C7]/20',
  mauve: 'bg-[#8567C6]/12 text-[#AE93E0] border-[#8567C6]/20',
}

/**
 * Empty state premium — icon badge con tint + copy editorial + CTA opcional.
 * Reemplaza el clásico "No hay nada para mostrar" genérico que rompe el flow.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  accent = 'coral',
}: EmptyStateProps) {
  const cls = ACCENT_CLS[accent]

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${cls}`}>
          {icon}
        </div>
      )}
      <p className="font-display font-bold text-[17px] text-ink-text tracking-tight leading-snug">
        {title}
      </p>
      {description && (
        <p className="text-ink-text-2 text-[12.5px] mt-1.5 max-w-[280px] leading-snug">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="mt-5 px-5 h-11 rounded-xl bg-wine text-white text-[13.5px]
                       font-bold flex items-center justify-center
                       active:scale-[0.98] transition-transform
                       shadow-[0_8px_22px_-6px_rgba(161,49,67,0.55)]"
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-5 px-5 h-11 rounded-xl bg-wine text-white text-[13.5px]
                       font-bold active:scale-[0.98] transition-transform
                       shadow-[0_8px_22px_-6px_rgba(161,49,67,0.55)]"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
