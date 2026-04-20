'use client'

import { useMemo, useState, useEffect } from 'react'
import type { Venue } from '@/lib/shared'
import { useGeolocation, distanceKm } from '@/lib/geolocation'
import { SearchPill } from './SearchPill'
import { FiltersSheet, type FilterState, EMPTY_FILTERS } from './FiltersSheet'
import { CuisineTabs } from './CuisineTabs'
import { VenueCardLab } from './VenueCardLab'
import { LiveReviewsStrip } from './LiveReviewsStrip'
import { EditorialBand } from './EditorialBand'
import { NotificationsSheet, useUnreadCount } from './NotificationsSheet'

interface Props {
  venues: Venue[]
  userFirstName: string | null
}

// Slots demo por venue (determinístico por id). Se reemplazará con /api/availability.
function mockSlots(id: string): string[] {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const allSlots = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30']
  const startIdx = Math.abs(h) % 3
  const take = 2 + (Math.abs(h >> 3) % 3)
  return allSlots.slice(startIdx, startIdx + take)
}

function venueCuisine(v: Venue): string {
  return (v.config_json as { cuisine?: string } | null)?.cuisine ?? 'other'
}

function venueNeighborhood(v: Venue): string {
  const m = v.address.match(/,\s*([^,]+),\s*CABA/i)
  return m ? m[1].trim() : ''
}

function venueCoords(v: Venue): { lat: number; lng: number } | null {
  const c = (v.config_json as { coords?: { lat: number; lng: number } } | null)?.coords
  return c && typeof c.lat === 'number' && typeof c.lng === 'number' ? c : null
}

/** Contador de actividad "X personas reservaron hoy" — mock determinístico
 * por día (misma cantidad durante las 24hs del día, varía cada jornada). */
function reservedTodayCount(): number {
  const now = new Date()
  const key = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  // Hash simple del día → 40-180 reservas
  return 40 + (key % 141)
}

/** "Mariana acaba de reservar en Trattoria" — rota cada 30s */
const ACTIVITY_FEED = [
  { name: 'Mariana', venue: 'Trattoria Sentori', when: 8 },
  { name: 'Joaquín', venue: 'Cortes del 9', when: 14 },
  { name: 'Sofía',   venue: 'Niko Sushi Bar', when: 23 },
  { name: 'Agustín', venue: 'La Pizzería de Almagro', when: 37 },
  { name: 'Camila',  venue: 'Verde de Mercado', when: 52 },
  { name: 'Lucas',   venue: 'Asador Don Ramiro', when: 66 },
]

export function HomeClient({ venues, userFirstName }: Props) {
  const [cuisine, setCuisine] = useState('all')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [query, setQuery] = useState('')

  const geo = useGeolocation()
  const [notifsOpen, setNotifsOpen] = useState(false)
  const unreadCount = useUnreadCount()
  const [searchState, setSearchState] = useState<{ date: string; time: string; party: number } | null>(null)
  const [activityIdx, setActivityIdx] = useState(0)

  // Rotar feed de actividad cada 5s
  useEffect(() => {
    const id = setInterval(() => setActivityIdx((i) => (i + 1) % ACTIVITY_FEED.length), 5000)
    return () => clearInterval(id)
  }, [])

  const reservedToday = useMemo(() => reservedTodayCount(), [])
  const currentActivity = ACTIVITY_FEED[activityIdx]

  // Query string a propagar al venue detail (prefill wizard)
  const qs = searchState
    ? `?date=${searchState.date}&time=${searchState.time}&party=${searchState.party}`
    : ''

  // Counts por cocina
  const counts = useMemo(() => {
    const base: Record<string, number> = { all: venues.length }
    for (const v of venues) {
      const c = venueCuisine(v)
      base[c] = (base[c] ?? 0) + 1
    }
    return base
  }, [venues])

  // Filter + sort pipeline
  const filtered = useMemo(() => {
    let list = venues.slice()
    if (cuisine !== 'all') list = list.filter((v) => venueCuisine(v) === cuisine)

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q)
      )
    }
    if (filters.cuisines.length > 0) {
      list = list.filter((v) => filters.cuisines.includes(venueCuisine(v)))
    }
    if (filters.neighborhoods.length > 0) {
      list = list.filter((v) => filters.neighborhoods.includes(venueNeighborhood(v)))
    }
    if (filters.dietary.length > 0) {
      list = list.filter((v) => {
        const d = (v.config_json as { dietary?: string[] } | null)?.dietary ?? []
        return filters.dietary.every((x) => d.includes(x))
      })
    }
    // Ordenamiento
    if (filters.sort === 'nearby' && geo.location) {
      list.sort((a, b) => {
        const ca = venueCoords(a), cb = venueCoords(b)
        if (!ca && !cb) return 0
        if (!ca) return 1
        if (!cb) return -1
        return distanceKm(geo.location!, ca) - distanceKm(geo.location!, cb)
      })
    } else if (filters.sort === 'reputation') {
      list.sort((a, b) => (a.name < b.name ? 1 : -1))
    } else if (filters.sort === 'available') {
      list.sort((a, b) => mockSlots(b.id).length - mockSlots(a.id).length)
    }
    return list
  }, [venues, cuisine, filters, query, geo.location])

  // Helper: distancia de un venue al usuario (o undefined)
  const distTo = (v: Venue): number | undefined => {
    if (!geo.location) return undefined
    const c = venueCoords(v)
    return c ? distanceKm(geo.location, c) : undefined
  }

  const activeFiltersCount =
    filters.meal.length + filters.cuisines.length + filters.dietary.length +
    filters.price.length + filters.ambience.length + filters.features.length +
    filters.neighborhoods.length + filters.promos.length

  const hero = filtered[0]
  const rest = filtered.slice(1)
  const availableNow = filtered.filter((v) => mockSlots(v.id).length > 0).length

  return (
    <>
      {/* Header — título dinámico + tagline + campana */}
      <header className="screen-x pt-8 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[30px] font-bold text-tx tracking-tight leading-none">
              {userFirstName ? `Hola ${userFirstName}` : 'Un toque'}
            </h1>
            <p className="text-tx2 text-[14px] mt-1.5">
              Reservá en Un toque
            </p>
          </div>
          <button
            onClick={() => setNotifsOpen(true)}
            aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            className="relative w-10 h-10 rounded-full bg-sf flex items-center justify-center
                       border border-[var(--br)] active:scale-95 transition-transform duration-[180ms]
                       flex-shrink-0"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.16V11a6 6 0 00-5-5.92V4a1 1 0 10-2 0v1.08A6 6 0 006 11v3.16c0 .54-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                stroke="var(--tx2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1
                               rounded-full bg-c1 text-white text-[9px] font-bold
                               flex items-center justify-center border-2 border-bg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Buscador + filtro inline */}
      <div className="screen-x mb-4">
        <div className="flex items-center gap-2 bg-sf border border-[var(--br)] rounded-full
                        pl-4 pr-1.5 py-1.5">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-tx3 flex-shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="¿a dónde salís hoy?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[15px] text-tx placeholder:text-tx3 py-1"
            aria-label="Buscar restaurante"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-tx3 p-1.5"
              aria-label="Limpiar búsqueda"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M8 8l8 8M8 16l8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label={`Abrir filtros${activeFiltersCount > 0 ? ` (${activeFiltersCount} activos)` : ''}`}
            className="relative w-9 h-9 rounded-full flex items-center justify-center
                       active:scale-90 transition-transform duration-[180ms] flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M6 12h12M10 18h4" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1
                               rounded-full bg-c1 text-white text-[9px] font-bold
                               flex items-center justify-center border-2 border-bg">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Social proof strip (rotativo) */}
      <div className="screen-x mb-4">
        <div className="bg-c2l rounded-full px-4 py-2 flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-c2 animate-pulse flex-shrink-0" />
          <p className="text-[12px] text-[#0F7A5A] flex-1 truncate transition-opacity duration-300">
            <span className="font-bold">{reservedToday}</span> personas ya reservaron hoy ·
            {' '}<span className="font-semibold">{currentActivity.name}</span> en{' '}
            <span className="font-semibold">{currentActivity.venue}</span>
          </p>
        </div>
      </div>

      {/* Hero venue (primera pantalla) */}
      {hero ? (
        <div className="screen-x mt-3 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
              Destacado
            </p>
            {availableNow > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F7A5A]">
                <span className="w-1.5 h-1.5 rounded-full bg-c2 animate-pulse" />
                {availableNow} disponibles ahora
              </span>
            )}
          </div>
          <VenueCardLab venue={hero} variant="hero" availableSlots={mockSlots(hero.id)} distanceKm={distTo(hero)} linkSuffix={qs} />
        </div>
      ) : (
        <div className="screen-x mt-3 mb-5 text-center py-8 bg-sf rounded-xl border border-[var(--br)]">
          <p className="text-[40px]">🔍</p>
          <p className="font-display text-[18px] font-bold text-tx mt-2">Sin resultados</p>
          <p className="text-tx2 text-[13px] mt-1">Probá otra cocina o ajustá los filtros.</p>
          <button
            onClick={() => {
              setCuisine('all'); setQuery('')
              setFilters(EMPTY_FILTERS)
            }}
            className="mt-3 text-c1 text-[13px] font-semibold underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Live reviews strip — social proof en movimiento, arriba de los controles */}
      {hero && (
        <div className="mb-6">
          <div className="screen-x">
            <LiveReviewsStrip />
          </div>
        </div>
      )}

      {/* Controles: search pill + text search */}
      <div className="screen-x mb-3">
        <SearchPill defaultTime="21:00" onChange={setSearchState} />
      </div>

      {/* Cuisine tabs */}
      <div className="mb-3">
        <CuisineTabs value={cuisine} onChange={setCuisine} counts={counts} />
      </div>

      {/* Filtros rápidos activos (chips de lo seleccionado) */}
      {activeFiltersCount > 0 && (
        <div className="screen-x mb-3 flex flex-wrap items-center gap-1.5">
          {filters.meal.map((k) => (
            <ActiveChip key={`m-${k}`} label={k} onRemove={() => setFilters({ ...filters, meal: filters.meal.filter((x) => x !== k) })} />
          ))}
          {filters.cuisines.map((k) => (
            <ActiveChip key={`c-${k}`} label={k} onRemove={() => setFilters({ ...filters, cuisines: filters.cuisines.filter((x) => x !== k) })} />
          ))}
          {filters.promos.map((k) => (
            <ActiveChip key={`p-${k}`} label={k} onRemove={() => setFilters({ ...filters, promos: filters.promos.filter((x) => x !== k) })} />
          ))}
          {filters.neighborhoods.map((k) => (
            <ActiveChip key={`n-${k}`} label={k} onRemove={() => setFilters({ ...filters, neighborhoods: filters.neighborhoods.filter((x) => x !== k) })} />
          ))}
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-[12px] text-tx3 font-semibold underline underline-offset-2 ml-1"
          >
            Limpiar todos
          </button>
        </div>
      )}

      <div className="screen-x space-y-5">
        {/* Info header */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-tx2">
            <span className="font-bold text-tx">{filtered.length}</span> locales
            {cuisine !== 'all' && (
              <> · <span className="capitalize">{cuisine}</span></>
            )}
          </p>
          <p className="text-[11px] text-tx3 font-semibold">
            {filters.sort === 'relevance' && 'Recomendados'}
            {filters.sort === 'available' && 'Disponibles ahora'}
            {filters.sort === 'reputation' && 'Mejor reputación'}
            {filters.sort === 'nearby' && 'Cerca mío'}
          </p>
        </div>

        {/* Grid resto */}
        {rest.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="font-display text-[19px] font-bold text-tx">
                Más restaurantes
              </h2>
              <p className="text-[11px] text-tx3">{rest.length}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rest.slice(0, 6).map((v) => (
                <VenueCardLab key={v.id} venue={v} variant="standard" availableSlots={mockSlots(v.id)} distanceKm={distTo(v)} linkSuffix={qs} />
              ))}
            </div>
          </section>
        )}

        {/* Banda editorial */}
        <div className="pt-2">
          <EditorialBand />
        </div>

        {/* Lista compacta resto */}
        {rest.length > 6 && (
          <section>
            <h2 className="font-display text-[19px] font-bold text-tx mb-3">
              Todos los locales
            </h2>
            <div className="space-y-2">
              {rest.slice(6).map((v) => (
                <VenueCardLab key={v.id} venue={v} variant="compact" availableSlots={mockSlots(v.id)} distanceKm={distTo(v)} linkSuffix={qs} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom sheet de filtros */}
      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={setFilters}
      />

      {/* Bottom sheet de notificaciones */}
      <NotificationsSheet
        open={notifsOpen}
        onClose={() => setNotifsOpen(false)}
      />
    </>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-sf2 text-tx rounded-full
                     pl-3 pr-1 py-1 text-[12px] font-semibold capitalize">
      {label.replace(/_/g, ' ')}
      <button
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="w-5 h-5 rounded-full hover:bg-white/50 flex items-center justify-center"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  )
}
