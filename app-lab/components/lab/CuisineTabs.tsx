'use client'

interface Tab {
  key: string
  label: string
  emoji: string
  count?: number
}

const TABS: Tab[] = [
  { key: 'all',    label: 'Todos',  emoji: '🍽️' },
  { key: 'pastas', label: 'Pastas', emoji: '🍝' },
  { key: 'carnes', label: 'Carnes', emoji: '🥩' },
  { key: 'pizza',  label: 'Pizza',  emoji: '🍕' },
  { key: 'vegano', label: 'Vegano', emoji: '🥗' },
  { key: 'sushi',  label: 'Sushi',  emoji: '🍣' },
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
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
                        border text-[13px] font-semibold transition-all duration-[180ms]
                        ${active
                          ? 'bg-c1 text-white border-c1 shadow-[0_4px_12px_rgba(255,71,87,0.25)]'
                          : 'bg-white text-tx2 border-[var(--br)] active:scale-95'}`}
          >
            <span className="text-[14px]">{t.emoji}</span>
            <span>{t.label}</span>
            {count !== undefined && (
              <span className={`text-[10px] font-bold ${active ? 'text-white/80' : 'text-tx3'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
