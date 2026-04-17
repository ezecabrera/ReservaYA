'use client'

import { useState, useEffect } from 'react'

export interface FilterState {
  sort: 'relevance' | 'nearby' | 'reputation' | 'available'
  price: string[]
  ambience: string[]
  features: string[]
  neighborhoods: string[]
}

const SORT_OPTS: Array<{ key: FilterState['sort']; label: string }> = [
  { key: 'relevance', label: 'Recomendados' },
  { key: 'available', label: 'Disponibles ahora' },
  { key: 'reputation', label: 'Mejor reputación' },
  { key: 'nearby', label: 'Cerca mío' },
]
const PRICES = ['$', '$$', '$$$', '$$$$']
const AMBIENCE = ['Cita', 'Grupo grande', 'Con niños', 'Tranquilo', 'Animado', 'Al aire libre', 'Después del trabajo']
const FEATURES = ['Terraza', 'Patio', 'Barra', 'Privado', 'Pet-friendly', 'Celíaco', 'Vegano', 'Sin música fuerte']
const NEIGHBORHOODS = ['Palermo', 'Villa Crespo', 'Recoleta', 'San Telmo', 'Caballito', 'Belgrano', 'Núñez', 'Almagro', 'Boedo', 'Chacarita', 'Colegiales', 'Puerto Madero']

interface Props {
  open: boolean
  onClose: () => void
  value: FilterState
  onChange: (next: FilterState) => void
}

export function FiltersSheet({ open, onClose, value, onChange }: Props) {
  const [local, setLocal] = useState<FilterState>(value)
  useEffect(() => { if (open) setLocal(value) }, [open, value])

  if (!open) return null

  function toggle(key: 'price' | 'ambience' | 'features' | 'neighborhoods', val: string) {
    const cur = local[key]
    setLocal({
      ...local,
      [key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val],
    })
  }

  function countActive(f: FilterState) {
    return f.price.length + f.ambience.length + f.features.length + f.neighborhoods.length
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        aria-label="Cerrar filtros"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      {/* Sheet */}
      <div className="relative bg-bg rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-down"
           style={{ animationDirection: 'reverse' }}>
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-tx3/40" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--br)]">
          <button
            onClick={() => setLocal({ sort: 'relevance', price: [], ambience: [], features: [], neighborhoods: [] })}
            className="text-tx2 text-[13px] font-semibold underline underline-offset-2"
          >
            Limpiar
          </button>
          <h2 className="font-display text-[17px] font-bold text-tx">Filtros</h2>
          <button onClick={onClose} className="text-tx2 p-1" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <Section title="Ordenar por">
            <div className="flex flex-wrap gap-2">
              {SORT_OPTS.map((s) => (
                <Chip
                  key={s.key}
                  active={local.sort === s.key}
                  onClick={() => setLocal({ ...local, sort: s.key })}
                  label={s.label}
                />
              ))}
            </div>
          </Section>

          <Section title="Precio">
            <div className="flex gap-2">
              {PRICES.map((p) => (
                <Chip key={p} active={local.price.includes(p)}
                      onClick={() => toggle('price', p)} label={p} wide />
              ))}
            </div>
          </Section>

          <Section title="Ambiente">
            <div className="flex flex-wrap gap-2">
              {AMBIENCE.map((a) => (
                <Chip key={a} active={local.ambience.includes(a)}
                      onClick={() => toggle('ambience', a)} label={a} />
              ))}
            </div>
          </Section>

          <Section title="Características">
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <Chip key={f} active={local.features.includes(f)}
                      onClick={() => toggle('features', f)} label={f} />
              ))}
            </div>
          </Section>

          <Section title="Barrio">
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOODS.map((n) => (
                <Chip key={n} active={local.neighborhoods.includes(n)}
                      onClick={() => toggle('neighborhoods', n)} label={n} />
              ))}
            </div>
          </Section>
        </div>
        {/* Footer */}
        <div className="border-t border-[var(--br)] px-5 py-3 safe-bottom bg-bg">
          <button
            onClick={() => { onChange(local); onClose() }}
            className="btn-primary"
          >
            Ver resultados {countActive(local) > 0 && `(${countActive(local)})`}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  )
}

function Chip({ active, onClick, label, wide }: { active: boolean; onClick: () => void; label: string; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-[13px] font-semibold transition-all
        ${wide ? 'min-w-[60px]' : ''}
        ${active
          ? 'bg-tx text-white border-tx'
          : 'bg-white text-tx2 border-[var(--br)] active:scale-95'}`}
    >
      {label}
    </button>
  )
}
