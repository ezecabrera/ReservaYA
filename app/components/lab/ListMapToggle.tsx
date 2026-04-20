'use client'

interface Props {
  value: 'list' | 'map'
  onChange: (v: 'list' | 'map') => void
}

export function ListMapToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex bg-sf rounded-full p-1 border border-[var(--br)]">
      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px]
                    font-semibold transition-all
                    ${value === 'list' ? 'bg-white text-tx shadow-sm' : 'text-tx3'}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Lista
      </button>
      <button
        onClick={() => onChange('map')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px]
                    font-semibold transition-all
                    ${value === 'map' ? 'bg-white text-tx shadow-sm' : 'text-tx3'}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s-7-6.6-7-12a7 7 0 1114 0c0 5.4-7 12-7 12z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        Mapa
      </button>
    </div>
  )
}
