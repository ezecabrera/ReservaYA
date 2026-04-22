// Header estándar de todas las páginas del panel — kicker + título + subtítulo
// Opcional: venue name como chip a la derecha para contextualizar la sesión

interface Props {
  title: string
  subtitle?: string
  venueName?: string
  kicker?: string
  right?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  venueName,
  kicker = 'Panel · Un Toque',
  right,
}: Props) {
  return (
    <header className="bg-white border-b border-[rgba(0,0,0,0.07)]">
      <div className="max-w-3xl mx-auto px-5 pt-10 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-1">
              {kicker}
            </p>
            <h1 className="font-display text-[28px] text-tx leading-none">{title}</h1>
            {subtitle && (
              <p className="text-tx2 text-[13px] mt-1.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {venueName && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sf border border-[rgba(0,0,0,0.08)] px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15A67A]" />
                <span className="text-tx2 text-[11px] font-semibold truncate max-w-[160px]">
                  {venueName}
                </span>
              </span>
            )}
            {right}
          </div>
        </div>
      </div>
    </header>
  )
}
