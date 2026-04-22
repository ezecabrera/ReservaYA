'use client'

/**
 * DesktopHome — home del PWA cliente en pantallas ≥1024px.
 *
 * Se renderiza SOLO en desktop (el page.tsx usa `hidden lg:block`).
 * El mobile sigue usando `<HomeClient />` sin tocar.
 *
 * Identidad: coral `#FF4757` primary (mismo que mobile) + Fraunces en titulares.
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Venue } from '@/lib/shared'
import { getVenueHero } from '@/lib/venue-images'

const CORAL = '#FF4757'
const CORAL_HOVER = '#ED3847'

interface Props {
  venues: Venue[]
  userFirstName: string | null
}

interface Cuisine { key: string; label: string }
const CUISINES: Cuisine[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'parrilla',  label: 'Parrilla' },
  { key: 'italiana',  label: 'Italiana' },
  { key: 'japonesa',  label: 'Japonesa' },
  { key: 'cafeteria', label: 'Cafetería' },
  { key: 'mexicana',  label: 'Mexicana' },
  { key: 'bar',       label: 'Bar' },
  { key: 'peruana',   label: 'Peruana' },
  { key: 'vegana',    label: 'Vegana' },
]

function venueCuisine(v: Venue): string {
  return (v.config_json as { cuisine?: string } | null)?.cuisine ?? 'other'
}

function venueNeighborhood(v: Venue): string {
  const m = v.address.match(/,\s*([^,]+),\s*CABA/i)
  return m ? m[1].trim() : ''
}

function priceRange(v: Venue): string {
  const p = (v.config_json as { price_range?: string } | null)?.price_range
  return p ?? '$$'
}

// Rating mock determinístico desde el id (en prod vendrá del backend)
function mockRating(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return 4.0 + (Math.abs(h) % 10) / 10
}

export function DesktopHome({ venues, userFirstName }: Props) {
  const [cuisine, setCuisine] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = venues
    if (cuisine !== 'all') list = list.filter(v => venueCuisine(v) === cuisine)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [venues, cuisine, query])

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <div className="dk-content-centered py-8">
      {/* Hero editorial coral */}
      <section
        className="relative overflow-hidden rounded-2xl mb-10 dk-hero-coral"
        style={{ padding: '44px 48px 36px', color: 'white' }}
      >
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)` }}
        />
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
              Reservá en un toque
            </span>
          </div>
          <h1 className="font-display text-white leading-[0.95] tracking-tight text-[56px] max-w-[720px]">
            {userFirstName
              ? <>Hola {userFirstName}, <span className="text-white/85">¿dónde comemos hoy?</span></>
              : <>El mejor lugar para comer <span className="text-white/85">está a un toque</span>.</>}
          </h1>
          <p className="text-white/90 text-[15px] mt-4 max-w-[520px] leading-relaxed">
            Restaurantes de Buenos Aires con reservas reales. Seña online, sin llamadas,
            sin promesas vacías.
          </p>

          {/* Search bar */}
          <div
            className="mt-7 rounded-xl bg-white p-1.5 grid gap-1 items-stretch"
            style={{ gridTemplateColumns: '1.3fr 1fr 1fr auto', maxWidth: 720 }}
          >
            <div className="px-4 py-2.5 rounded-lg hover:bg-sf transition-colors">
              <div className="text-[10px] font-bold text-tx3 uppercase tracking-[0.14em]">
                Buscar
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Restaurante, barrio o cocina"
                className="w-full bg-transparent border-none outline-none text-[14px] text-tx placeholder:text-tx3 font-body mt-0.5"
              />
            </div>
            <SearchCell label="Fecha" value="Hoy" />
            <SearchCell label="Personas" value="2 personas" />
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-[14px] transition-colors no-underline"
              style={{ background: CORAL }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.5" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Explorar
            </Link>
          </div>
        </div>
      </section>

      {/* Cuisine chips */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">Explorar por cocina</p>
          <h2 className="font-display text-[30px] text-tx leading-none tracking-tight">
            ¿Qué se te antoja hoy?
          </h2>
        </div>
        <Link href="/buscar" className="text-[13px] font-bold no-underline hover:underline" style={{ color: CORAL }}>
          Ver todos los filtros →
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-8" style={{ scrollbarWidth: 'none' }}>
        {CUISINES.map(c => {
          const active = cuisine === c.key
          return (
            <button
              key={c.key}
              onClick={() => setCuisine(c.key)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors
                          ${active
                            ? 'bg-tx text-bg border-tx'
                            : 'bg-sf text-tx2 border-[rgba(0,0,0,0.08)] hover:border-[#FF4757]/40 hover:text-tx'
                          }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Featured editorial */}
      {featured && (
        <div className="grid gap-5 mb-10" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
          <Link
            href={`/${featured.id}`}
            className="relative overflow-hidden rounded-2xl no-underline dk-card-hover"
            style={{ minHeight: 320 }}
          >
            <VenueImage venue={featured} className="absolute inset-0" />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)' }}
            />
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
              <div
                className="inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 mb-3 backdrop-blur-sm"
                style={{ background: 'rgba(197,96,42,0.85)' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Destacado</span>
              </div>
              <h3 className="font-display text-[38px] leading-none tracking-tight mb-2">
                {featured.name}
              </h3>
              <p className="text-white/85 text-[14px] max-w-md line-clamp-2 mb-3">
                {featured.description ?? venueNeighborhood(featured)}
              </p>
              <div className="flex items-center gap-4 text-[12px] font-semibold text-white/80">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB800">
                    <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
                  </svg>
                  {mockRating(featured.id).toFixed(1)}
                </span>
                <span>·</span>
                <span>{venueNeighborhood(featured) || 'CABA'}</span>
                <span>·</span>
                <span className="font-mono">{priceRange(featured)}</span>
              </div>
            </div>
          </Link>

          {/* Sidebar con top 3 */}
          <div className="rounded-2xl bg-sf border border-[rgba(0,0,0,0.07)] p-5">
            <p className="text-tx3 text-[10px] font-bold uppercase tracking-[0.18em] mb-3">
              Top recomendados
            </p>
            <div className="space-y-3">
              {rest.slice(0, 3).map(v => (
                <Link
                  key={v.id}
                  href={`/${v.id}`}
                  className="flex items-center gap-3 no-underline group"
                >
                  <div
                    className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden border border-[rgba(0,0,0,0.07)]"
                  >
                    <VenueImage venue={v} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[15px] text-tx leading-tight truncate group-hover:text-[#FF4757] transition-colors">
                      {v.name}
                    </p>
                    <p className="text-tx2 text-[11.5px] truncate mt-0.5">
                      {venueNeighborhood(v)} · {priceRange(v)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[12px] font-bold text-tx">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB800">
                      <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
                    </svg>
                    {mockRating(v.id).toFixed(1)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Venue grid */}
      <div className="flex items-end justify-between mt-12 mb-4">
        <div>
          <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">Para explorar</p>
          <h2 className="font-display text-[30px] text-tx leading-none tracking-tight">
            Todos los restaurantes
          </h2>
        </div>
        <span className="text-[13px] text-tx3 font-semibold">
          {filtered.length} {filtered.length === 1 ? 'lugar' : 'lugares'}
        </span>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {rest.length > 3 ? rest.slice(3).map(v => (
          <VenueCardDesktop key={v.id} venue={v} />
        )) : filtered.map(v => (
          <VenueCardDesktop key={v.id} venue={v} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)]">
          <p className="font-display text-[22px] text-tx">Sin resultados</p>
          <p className="text-tx2 text-[14px] mt-1">Probá con otra cocina o cambiando el filtro.</p>
        </div>
      )}
    </div>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

function SearchCell({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="text-left px-4 py-2.5 rounded-lg hover:bg-sf transition-colors"
    >
      <div className="text-[10px] font-bold text-tx3 uppercase tracking-[0.14em]">{label}</div>
      <div className="text-[14px] font-bold text-tx mt-0.5">{value}</div>
    </button>
  )
}

function VenueCardDesktop({ venue }: { venue: Venue }) {
  const rating = mockRating(venue.id)
  const hood = venueNeighborhood(venue)

  return (
    <Link
      href={`/${venue.id}`}
      className="block rounded-2xl border border-[rgba(0,0,0,0.07)] bg-bg overflow-hidden no-underline dk-card-hover"
    >
      <div className="relative h-[180px] overflow-hidden">
        <VenueImage venue={venue} className="absolute inset-0" />
        <button
          type="button"
          aria-label="Agregar a favoritos"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-tx2 hover:text-[#FF4757] transition-colors"
          onClick={(e) => { e.preventDefault() }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 20.5s-7.5-4.1-7.5-9.5A4.5 4.5 0 0112 6.5 4.5 4.5 0 0119.5 11c0 5.4-7.5 9.5-7.5 9.5z"
              stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-display text-[18px] text-tx leading-tight tracking-tight line-clamp-1">
          {venue.name}
        </h3>
        <p className="text-tx3 text-[12.5px] mt-1 line-clamp-1">
          {hood || 'CABA'} · <span className="font-mono">{priceRange(venue)}</span>
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-tx">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFB800">
              <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
            </svg>
            {rating.toFixed(1)}
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'var(--c2l)', color: '#0E8F6A' }}
          >
            Disponible hoy
          </span>
        </div>
      </div>
    </Link>
  )
}

function VenueImage({ venue, className }: { venue: Venue; className?: string }) {
  // Prioridad 1: image_url del venue. Prioridad 2: LoremFlickr con tags
  // coherentes por cocina (mismo helper que usa el mobile). Siempre hay imagen.
  const explicitUrl = (venue.config_json as { image_url?: string } | null)?.image_url
  const src = explicitUrl || getVenueHero(venue, 800, 600)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={venue.name}
      loading="lazy"
      className={`${className ?? ''} object-cover w-full h-full`}
    />
  )
}
