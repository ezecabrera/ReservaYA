'use client'

/**
 * DesktopExplorar — pantalla de exploración en ≥1024px.
 * Sidebar izquierdo con facetas + grid 3-col derecho.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Venue } from '@/lib/shared'
import { getVenueHero } from '@/lib/venue-images'

const CORAL = '#FF4757'

interface Props { venues: Venue[] }

const CUISINES = [
  { k: 'pastas',  l: 'Pastas' },
  { k: 'carnes',  l: 'Parrilla' },
  { k: 'pizza',   l: 'Pizzería' },
  { k: 'sushi',   l: 'Japonesa' },
  { k: 'vegano',  l: 'Vegana' },
  { k: 'other',   l: 'Otros' },
]

const PRICE = ['$', '$$', '$$$', '$$$$']

function venueCuisine(v: Venue): string {
  return (v.config_json as { cuisine?: string } | null)?.cuisine ?? 'other'
}
function venueHood(v: Venue): string {
  return v.address.match(/,\s*([^,]+),\s*CABA/i)?.[1] ?? ''
}
function venuePrice(v: Venue): string {
  return (v.config_json as { price_range?: string } | null)?.price_range ?? '$$'
}
function rating(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return 4.0 + (Math.abs(h) % 10) / 10
}

export function DesktopExplorar({ venues }: Props) {
  const [query, setQuery] = useState('')
  const [cuisines, setCuisines] = useState<Set<string>>(new Set())
  const [prices, setPrices] = useState<Set<string>>(new Set())
  const [neighborhoods, setNeighborhoods] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<'relevance' | 'rating' | 'price'>('relevance')

  const allNeighborhoods = useMemo(() => {
    const s = new Set<string>()
    for (const v of venues) {
      const n = venueHood(v)
      if (n) s.add(n)
    }
    return Array.from(s).sort()
  }, [venues])

  const filtered = useMemo(() => {
    let list = venues
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q),
      )
    }
    if (cuisines.size) list = list.filter(v => cuisines.has(venueCuisine(v)))
    if (prices.size) list = list.filter(v => prices.has(venuePrice(v)))
    if (neighborhoods.size) list = list.filter(v => neighborhoods.has(venueHood(v)))
    if (sort === 'rating') {
      list = [...list].sort((a, b) => rating(b.id) - rating(a.id))
    } else if (sort === 'price') {
      list = [...list].sort((a, b) => venuePrice(a).length - venuePrice(b).length)
    }
    return list
  }, [venues, query, cuisines, prices, neighborhoods, sort])

  function toggleIn(set: Set<string>, setter: (s: Set<string>) => void, key: string) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key); else next.add(key)
    setter(next)
  }

  function clearAll() {
    setQuery('')
    setCuisines(new Set())
    setPrices(new Set())
    setNeighborhoods(new Set())
  }

  const activeCount = cuisines.size + prices.size + neighborhoods.size

  return (
    <div className="dk-content-centered py-8">
      <header className="mb-6">
        <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">
          Descubrir
        </p>
        <h1 className="font-display text-[36px] text-tx leading-none tracking-tight">
          Explorar restaurantes
        </h1>
      </header>

      <div className="grid gap-8" style={{ gridTemplateColumns: '280px 1fr' }}>
        {/* Sidebar filtros */}
        <aside className="min-w-0">
          <div
            className="sticky space-y-4"
            style={{ top: 'calc(var(--dk-topbar-h, 68px) + 12px)' }}
          >
            <div className="relative">
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tx3"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="w-full pl-9 pr-3 py-2.5 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-[13px] text-tx placeholder:text-tx3 outline-none focus:border-[#FF4757]/50 focus:ring-2 focus:ring-[#FF4757]/15 transition-colors"
              />
            </div>

            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="w-full py-2 rounded-md bg-bg border border-[rgba(0,0,0,0.08)] text-tx2 text-[12px] font-semibold hover:text-[#C42434] hover:border-[#C42434]/30 transition-colors"
              >
                Limpiar filtros ({activeCount})
              </button>
            )}

            <FilterGroup title="Cocina">
              {CUISINES.map(c => (
                <FilterCheck
                  key={c.k}
                  label={c.l}
                  checked={cuisines.has(c.k)}
                  onChange={() => toggleIn(cuisines, setCuisines, c.k)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Precio">
              <div className="flex gap-1">
                {PRICE.map(p => {
                  const active = prices.has(p)
                  return (
                    <button
                      key={p}
                      onClick={() => toggleIn(prices, setPrices, p)}
                      className={`flex-1 py-2 rounded-md text-[12px] font-bold border transition-colors font-mono
                                  ${active
                                    ? 'text-white'
                                    : 'bg-bg text-tx2 border-[rgba(0,0,0,0.08)] hover:border-[#FF4757]/40 hover:text-tx'
                                  }`}
                      style={active ? { background: CORAL, borderColor: CORAL } : undefined}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </FilterGroup>

            {allNeighborhoods.length > 0 && (
              <FilterGroup title="Barrio">
                {allNeighborhoods.slice(0, 10).map(n => (
                  <FilterCheck
                    key={n}
                    label={n}
                    checked={neighborhoods.has(n)}
                    onChange={() => toggleIn(neighborhoods, setNeighborhoods, n)}
                  />
                ))}
              </FilterGroup>
            )}
          </div>
        </aside>

        {/* Resultados */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-tx2 text-[14px]">
              <span className="font-bold text-tx">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'restaurante' : 'restaurantes'}
            </p>
            <label className="flex items-center gap-2 text-[13px] text-tx2">
              Ordenar por
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="font-semibold text-tx bg-sf border border-[rgba(0,0,0,0.08)] rounded-md px-3 py-1.5 text-[13px] outline-none focus:border-[#FF4757]/50"
              >
                <option value="relevance">Relevancia</option>
                <option value="rating">Mejor puntuados</option>
                <option value="price">Menor precio</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-14 text-center">
              <p className="font-display text-[22px] text-tx">Sin resultados</p>
              <p className="text-tx2 text-[13px] mt-1">Probá con otros filtros.</p>
              <button onClick={clearAll} className="mt-5 text-[#FF4757] font-bold text-[14px] hover:underline">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {filtered.map(v => <ExploreCard key={v.id} venue={v} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-bg border border-[rgba(0,0,0,0.07)] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tx3 mb-3">
        {title}
      </p>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  )
}

function FilterCheck({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                    ${checked ? 'border-[#FF4757]' : 'border-[rgba(0,0,0,0.2)] group-hover:border-[#FF4757]/40'}`}
        style={checked ? { background: CORAL } : undefined}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-[13px] text-tx group-hover:text-tx">{label}</span>
    </label>
  )
}

function ExploreCard({ venue }: { venue: Venue }) {
  const explicit = (venue.config_json as { image_url?: string } | null)?.image_url
  const src = explicit || getVenueHero(venue, 600, 400)
  const hood = venueHood(venue) || 'CABA'
  const price = venuePrice(venue)
  const r = rating(venue.id)

  return (
    <Link
      href={`/${venue.id}`}
      className="block rounded-2xl border border-[rgba(0,0,0,0.07)] bg-bg overflow-hidden no-underline dk-card-hover"
    >
      <div className="h-[160px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={venue.name} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-display text-[17px] text-tx leading-tight tracking-tight line-clamp-1">
          {venue.name}
        </h3>
        <p className="text-tx3 text-[12px] mt-1 line-clamp-1">
          {hood} · <span className="font-mono">{price}</span>
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-[12.5px] font-bold text-tx">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
            </svg>
            {r.toFixed(1)}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--c2l)', color: '#0E8F6A' }}
          >
            Disponible
          </span>
        </div>
      </div>
    </Link>
  )
}
