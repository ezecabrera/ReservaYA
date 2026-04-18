'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { VenueCard } from '@/components/home/VenueCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconOpenBook, IconWineGlass } from '@/components/ui/Icons'
import type { Venue } from '@/lib/shared'

interface Props {
  venues: Venue[]
}

/**
 * Cliente que filtra la lista de venues según el query.
 *
 * Decisiones:
 * - Filtro case-insensitive sobre name + address + description
 * - Auto-focus al input cuando la página carga
 * - Chips "Pastas / Carnes / Sushi / …" todavía no son funcionales — se
 *   quedan como visual hint para un future tag system por venue
 * - Resultado vacío usa IconOpenBook (continúa el lenguaje del panel)
 */
export function SearchClient({ venues }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Auto-focus tras el mount. Si el navegador suprime focus automático
    // (algunos iOS), al menos el caret se posiciona cuando tocan el input.
    inputRef.current?.focus()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return venues
    return venues.filter((v) => {
      const haystack = [v.name, v.address, v.description ?? '']
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [venues, query])

  return (
    <div className="screen-x pt-5 space-y-5">
      {/* Search input funcional */}
      <div className="relative">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-tx3 flex-shrink-0 pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar restaurante, barrio o tipo de cocina…"
          className="w-full pl-11 pr-11 py-3 rounded-full bg-white border border-[var(--br)]
                     text-[14px] text-tx placeholder-tx3 outline-none
                     focus:border-wine/50 focus:ring-2 focus:ring-wine/15
                     transition-all shadow-[var(--sh-sm)]"
          autoComplete="off"
          enterKeyHint="search"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2
                       w-7 h-7 rounded-full bg-sf text-tx3
                       flex items-center justify-center
                       hover:bg-sf2 hover:text-tx2 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Chips de categoría (visual — future) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {['Todos', 'Pastas', 'Carnes', 'Pizza', 'Vegano', 'Sushi'].map((cat, i) => (
          <span
            key={cat}
            className={`chip flex-shrink-0 pointer-events-none ${i === 0 ? 'chip-active' : ''}`}
            aria-hidden
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        query ? (
          <EmptyState
            accent="coral"
            icon={<IconOpenBook size={28} />}
            title="Nada coincide con esa búsqueda"
            description={`No encontramos "${query}". Probá con otro nombre o limpiá el filtro.`}
          />
        ) : (
          <EmptyState
            accent="coral"
            icon={<IconWineGlass size={28} />}
            title="Sin restaurantes todavía"
            description="Los primeros venues del piloto se suman pronto."
          />
        )
      ) : (
        <>
          <p className="text-[10.5px] font-bold text-tx3 uppercase tracking-[0.12em]">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {filtered.map((venue, i) => (
              <div
                key={venue.id}
                className="reveal-stagger"
                style={{ '--i': i } as React.CSSProperties}
              >
                <VenueCard venue={venue} variant="compact" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
