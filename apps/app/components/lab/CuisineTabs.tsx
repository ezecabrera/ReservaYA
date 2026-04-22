'use client'

interface Tab {
  key: string
  label: string
  count?: number
}

const TABS: Tab[] = [
  { key: 'all',    label: 'Todos' },
  { key: 'pastas', label: 'Pastas' },
  { key: 'carnes', label: 'Parrilla' },
  { key: 'pizza',  label: 'Pizza' },
  { key: 'sushi',  label: 'Sushi' },
  { key: 'vegano', label: 'Vegano' },
]

interface Props {
  value: string
  onChange: (key: string) => void
  counts?: Record<string, number>
}

export function CuisineTabs({ value, onChange, counts }: Props) {
  return (
    // Sin -mx negativo para que el primer chip no sobresalga del viewport
    // cuando está activo (el shadow bleedeaba al borde de la pantalla).
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-[18px] pb-2 pt-0.5">
      {TABS.map((t) => {
        const active = value === t.key
        const count = counts?.[t.key]
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex-shrink-0 px-5 py-2 rounded-full
                        border text-[14px] font-bold transition-all duration-[180ms]
                        ${active
                          ? 'bg-c1 text-white border-c1 shadow-[0_4px_12px_rgba(255,71,87,0.25)]'
                          : 'bg-white text-tx border-[var(--br)] active:scale-95'}`}
          >
            {t.label}
            {count !== undefined && (
              <span className={`ml-1 text-[11px] font-medium ${active ? 'text-white/70' : 'text-tx3'}`}>
                ·{count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
