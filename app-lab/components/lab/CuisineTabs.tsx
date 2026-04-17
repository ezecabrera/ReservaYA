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
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] pb-1">
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
                          ? 'bg-tx text-white border-tx shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                          : 'bg-white text-tx2 border-[var(--br)]'}`}
          >
            <span className="text-[14px]">{t.emoji}</span>
            <span>{t.label}</span>
            {count !== undefined && (
              <span className={`text-[10px] font-bold ${active ? 'text-white/70' : 'text-tx3'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
