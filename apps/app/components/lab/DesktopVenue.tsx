'use client'

/**
 * DesktopVenue — detalle del restaurante en ≥1024px.
 * Solo se muestra en lg. Mobile sigue usando VenueDetailClient.
 */

import Link from 'next/link'
import { useState } from 'react'
import type { Venue } from '@/lib/shared'
import { getVenueGallery, getVenueHero } from '@/lib/venue-images'

export interface MenuPreviewCat {
  name: string
  items: { name: string; price: number; description: string | null }[]
}

export interface Review {
  id: string
  score: number
  comment: string | null
  created_at: string
  author: string
}

interface Props {
  venue: Venue
  menu: MenuPreviewCat[]
  reviews: Review[]
}

type Tab = 'reservar' | 'menu' | 'resenas' | 'horarios' | 'nosotros'

const CORAL = '#FF4757'
const CORAL_HOVER = '#ED3847'

function neighborhood(v: Venue): string {
  const m = v.address.match(/,\s*([^,]+),\s*CABA/i)
  return m ? m[1].trim() : ''
}
function priceRange(v: Venue): string {
  return (v.config_json as { price_range?: string } | null)?.price_range ?? '$$'
}
function venueCuisine(v: Venue): string {
  return (v.config_json as { cuisine?: string } | null)?.cuisine ?? ''
}
function avgRating(reviews: Review[]): number | null {
  if (!reviews.length) return null
  return reviews.reduce((s, r) => s + r.score, 0) / reviews.length
}

export function DesktopVenue({ venue, menu, reviews }: Props) {
  const [tab, setTab] = useState<Tab>('reservar')
  const rating = avgRating(reviews)

  return (
    <div className="dk-content-centered py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-tx3 font-semibold mb-5">
        <Link href="/" className="hover:text-tx no-underline">Inicio</Link>
        <span>›</span>
        <Link href="/buscar" className="hover:text-tx no-underline">Explorar</Link>
        <span>›</span>
        <span className="text-tx truncate">{venue.name}</span>
      </nav>

      {/* Hero gallery 2x2 — usa galería de LoremFlickr coherente con la cocina */}
      <HeroGallery venue={venue} />


      {/* Title row + acciones */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {venueCuisine(venue) && (
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border"
                style={{ background: `${CORAL}14`, color: CORAL, borderColor: `${CORAL}30` }}
              >
                {venueCuisine(venue)}
              </span>
            )}
            <span
              className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
              style={{ background: 'var(--c2l)', color: '#0E8F6A' }}
            >
              Disponible hoy
            </span>
          </div>
          <h1 className="font-display text-[48px] leading-none tracking-tight text-tx">
            {venue.name}
          </h1>
          <div className="flex items-center gap-3 mt-3 text-[14px] text-tx2">
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFB800">
                <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
              </svg>
              <span className="font-bold text-tx">{rating ? rating.toFixed(1) : '4.5'}</span>
              <span className="text-tx3">({reviews.length || '12'} reseñas)</span>
            </span>
            <span className="text-tx3">·</span>
            <span>{neighborhood(venue) || 'CABA'}</span>
            <span className="text-tx3">·</span>
            <span className="font-mono font-bold">{priceRange(venue)}</span>
          </div>
          <p className="text-tx2 text-[14px] mt-3 max-w-2xl leading-relaxed line-clamp-3">
            {venue.description ?? 'Sin descripción aún — el restaurante está completando su perfil.'}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            className="w-11 h-11 rounded-lg bg-sf border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-tx2 hover:text-[#FF4757] hover:border-[#FF4757]/30 transition-colors"
            aria-label="Favorito"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 20.5s-7.5-4.1-7.5-9.5A4.5 4.5 0 0112 6.5 4.5 4.5 0 0119.5 11c0 5.4-7.5 9.5-7.5 9.5z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="w-11 h-11 rounded-lg bg-sf border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-tx2 hover:text-tx transition-colors"
            aria-label="Compartir"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs + columnas */}
      <div className="grid gap-8" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <div className="min-w-0">
          {/* Tabs sticky */}
          <div
            className="sticky z-20 bg-bg/90 backdrop-blur-md -mx-2 px-2 mb-6 border-b border-[rgba(0,0,0,0.07)]"
            style={{ top: 'var(--dk-topbar-h, 68px)' }}
          >
            <nav className="flex gap-1">
              {([
                ['reservar',  'Reservar'],
                ['menu',      'Menú'],
                ['resenas',   'Reseñas'],
                ['horarios',  'Horarios'],
                ['nosotros',  'Nosotros'],
              ] as [Tab, string][]).map(([k, label]) => {
                const active = tab === k
                return (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-colors
                                ${active
                                  ? 'text-tx border-[#FF4757]'
                                  : 'text-tx2 border-transparent hover:text-tx'
                                }`}
                    style={active ? { borderColor: CORAL, color: CORAL } : undefined}
                  >
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>

          {tab === 'reservar' && <ReservarTab venue={venue} />}
          {tab === 'menu' && <MenuTab menu={menu} />}
          {tab === 'resenas' && <ResenasTab reviews={reviews} rating={rating} />}
          {tab === 'horarios' && <HorariosTab venue={venue} />}
          {tab === 'nosotros' && <NosotrosTab venue={venue} />}
        </div>

        {/* Reservation Panel sticky */}
        <aside className="min-w-0">
          <div
            className="sticky rounded-2xl border border-[rgba(0,0,0,0.08)] bg-bg overflow-hidden"
            style={{ top: 'calc(var(--dk-topbar-h, 68px) + 12px)' }}
          >
            <ReservationPanel venue={venue} />
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function ReservarTab({ venue }: { venue: Venue }) {
  const config = venue.config_json as unknown as { [k: string]: unknown } | null
  const capacity = (config?.capacity as number | undefined) ?? 40
  const features = (config?.features as string[] | undefined) ?? ['Terraza', 'Pet-friendly', 'Wi-Fi']
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-[26px] text-tx tracking-tight mb-4">
          Qué vas a encontrar
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <InfoBox label="Capacidad" value={`${capacity} mesas`} />
          <InfoBox label="Estilo" value={(config?.cuisine as string) ?? 'Mixto'} />
          <InfoBox label="Rango" value={(config?.price_range as string) ?? '$$'} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-[26px] text-tx tracking-tight mb-4">
          Características
        </h2>
        <div className="flex flex-wrap gap-2">
          {features.map(f => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sf border border-[rgba(0,0,0,0.07)] text-[13px] text-tx2 font-semibold"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#0E8F6A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-[26px] text-tx tracking-tight mb-4">
          Ubicación
        </h2>
        <div className="rounded-xl border border-[rgba(0,0,0,0.07)] p-5 bg-sf">
          <p className="text-tx font-semibold text-[14px]">{venue.address}</p>
          {venue.phone && (
            <p className="text-tx2 text-[13px] mt-1">
              <a href={`tel:${venue.phone}`} className="hover:underline no-underline" style={{ color: CORAL }}>
                {venue.phone}
              </a>
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function MenuTab({ menu }: { menu: MenuPreviewCat[] }) {
  if (!menu.length) {
    return (
      <EmptyTab
        title="Menú aún no cargado"
        body="El restaurante todavía no subió su carta digital. Podés reservar y consultarla al llegar."
      />
    )
  }
  return (
    <div className="space-y-10">
      {menu.map(cat => (
        <section key={cat.name}>
          <h2 className="font-display text-[24px] text-tx tracking-tight mb-4">{cat.name}</h2>
          <div className="grid grid-cols-2 gap-3">
            {cat.items.map(item => (
              <div
                key={item.name}
                className="rounded-xl border border-[rgba(0,0,0,0.07)] bg-bg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-tx text-[15px] leading-tight">{item.name}</h3>
                  <span className="font-mono font-bold text-tx text-[15px] flex-shrink-0 tabular-nums">
                    ${item.price.toLocaleString('es-AR')}
                  </span>
                </div>
                {item.description && (
                  <p className="text-tx2 text-[12.5px] mt-1.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function ResenasTab({ reviews, rating }: { reviews: Review[]; rating: number | null }) {
  if (!reviews.length) {
    return (
      <EmptyTab
        title="Sin reseñas aún"
        body="Sé el primero en dejar una después de tu visita."
      />
    )
  }
  const distribution = [5, 4, 3, 2, 1].map(score => ({
    score,
    count: reviews.filter(r => Math.round(r.score) === score).length,
  }))
  const total = reviews.length

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[rgba(0,0,0,0.07)] p-6 bg-sf flex items-center gap-8">
        <div className="text-center">
          <div className="font-display text-[56px] leading-none text-tx">
            {rating?.toFixed(1) ?? '—'}
          </div>
          <div className="flex items-center gap-0.5 justify-center mt-2">
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                fill={rating && i <= Math.round(rating) ? '#FFB800' : 'rgba(0,0,0,0.08)'}>
                <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
              </svg>
            ))}
          </div>
          <p className="text-tx3 text-[12px] mt-1.5">{total} reseñas</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {distribution.map(({ score, count }) => {
            const pct = total ? (count / total) * 100 : 0
            return (
              <div key={score} className="flex items-center gap-2 text-[12px]">
                <span className="w-2 font-bold text-tx2">{score}</span>
                <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#FFB800' }} />
                </div>
                <span className="w-6 text-right text-tx3 tabular-nums">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {reviews.slice(0, 10).map(r => (
          <article key={r.id} className="rounded-xl border border-[rgba(0,0,0,0.07)] bg-bg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[13px]"
                  style={{ background: CORAL }}
                >
                  {r.author[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-tx font-semibold text-[13.5px] leading-none">{r.author}</p>
                  <p className="text-tx3 text-[11.5px] mt-1">
                    {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="12" height="12" viewBox="0 0 24 24"
                    fill={i <= Math.round(r.score) ? '#FFB800' : 'rgba(0,0,0,0.08)'}>
                    <path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17.5 5.5 21.5 8 14 2 9.5h7.5z" />
                  </svg>
                ))}
              </div>
            </div>
            {r.comment && <p className="text-tx2 text-[13.5px] leading-relaxed">{r.comment}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}

function HorariosTab({ venue }: { venue: Venue }) {
  const schedule = (venue.config_json as { schedule?: Record<string, unknown> } | null)?.schedule
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  return (
    <section>
      <h2 className="font-display text-[26px] text-tx tracking-tight mb-4">
        Cuándo atiende
      </h2>
      <div className="rounded-xl border border-[rgba(0,0,0,0.07)] bg-bg overflow-hidden">
        {days.map((d, i) => (
          <div
            key={d}
            className={`flex items-center justify-between px-5 py-3 text-[14px]
                        ${i < days.length - 1 ? 'border-b border-[rgba(0,0,0,0.06)]' : ''}`}
          >
            <span className="text-tx font-semibold">{d}</span>
            <span className="text-tx2 font-mono">
              {schedule ? '12:00 – 15:30 · 20:00 – 23:30' : '20:00 – 23:30'}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function NosotrosTab({ venue }: { venue: Venue }) {
  return (
    <section className="space-y-5">
      <h2 className="font-display text-[26px] text-tx tracking-tight">Sobre nosotros</h2>
      <p className="text-tx2 text-[15px] leading-relaxed whitespace-pre-line">
        {venue.description ?? 'El restaurante todavía no completó su descripción.'}
      </p>
      <div className="rounded-xl border border-[rgba(0,0,0,0.07)] bg-sf p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-tx3 mb-2">
          Contacto
        </p>
        <p className="text-tx text-[14px]">{venue.address}</p>
        {venue.phone && <p className="text-tx text-[14px] mt-1">{venue.phone}</p>}
      </div>
    </section>
  )
}

// ── Reservation Panel ───────────────────────────────────────────────────────

function ReservationPanel({ venue }: { venue: Venue }) {
  const slots = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30']
  const [party, setParty] = useState(2)
  const [selectedDate, setSelectedDate] = useState(0)
  // Pre-seleccionamos el primer slot para que el botón "Reservar" esté listo
  // desde el arranque. El user puede cambiarlo.
  const [selectedSlot, setSelectedSlot] = useState<string>(slots[2]) // 21:00

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  const selectedDateISO = days[selectedDate].toISOString().slice(0, 10)
  const reserveHref = `/${venue.id}/reservar?date=${selectedDateISO}&time=${encodeURIComponent(selectedSlot)}&party=${party}`

  return (
    <div>
      <div style={{ padding: '20px 22px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <p className="text-[11px] font-bold text-tx3 uppercase tracking-[0.18em] mb-1">
          Reservar mesa
        </p>
        <p className="text-tx font-semibold text-[15px]">
          Sin comisión. Seña vía Mercado Pago.
        </p>
      </div>

      <div style={{ padding: '18px 22px' }} className="space-y-5">
        {/* Date picker */}
        <div>
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2">Día</p>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {days.map((d, i) => {
              const active = selectedDate === i
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(i)}
                  className={`flex-shrink-0 w-[54px] py-2 rounded-lg border text-center transition-colors
                              ${active
                                ? 'text-white'
                                : 'bg-bg text-tx border-[rgba(0,0,0,0.08)] hover:border-[#FF4757]/40'
                              }`}
                  style={active ? { background: CORAL, borderColor: CORAL } : undefined}
                >
                  <div className="text-[9.5px] font-bold uppercase tracking-wide">
                    {d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}
                  </div>
                  <div className="font-display text-[18px] leading-none mt-0.5 tabular-nums">
                    {d.getDate()}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Party */}
        <div>
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2">Personas</p>
          <div className="flex items-center gap-3 rounded-lg bg-sf border border-[rgba(0,0,0,0.07)] p-1">
            <button
              onClick={() => setParty(Math.max(1, party - 1))}
              className="w-10 h-10 rounded-md bg-bg text-tx font-bold flex items-center justify-center hover:bg-sf2 transition-colors"
              aria-label="Menos"
            >
              −
            </button>
            <div className="flex-1 text-center font-display text-[22px] text-tx tabular-nums">
              {party}
            </div>
            <button
              onClick={() => setParty(Math.min(12, party + 1))}
              className="w-10 h-10 rounded-md bg-bg text-tx font-bold flex items-center justify-center hover:bg-sf2 transition-colors"
              aria-label="Más"
            >
              +
            </button>
          </div>
        </div>

        {/* Slots */}
        <div>
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2">Hora</p>
          <div className="grid grid-cols-3 gap-2">
            {slots.map(s => {
              const active = selectedSlot === s
              return (
                <button
                  key={s}
                  onClick={() => setSelectedSlot(s)}
                  className={`py-2 rounded-md text-[13px] font-bold border transition-colors font-mono tabular-nums
                              ${active
                                ? 'text-white'
                                : 'bg-bg text-tx border-[rgba(0,0,0,0.08)] hover:border-[#FF4757]/40'
                              }`}
                  style={active ? { background: CORAL, borderColor: CORAL } : undefined}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={reserveHref}
          className="block w-full py-3 rounded-md text-white font-bold text-[14px] text-center no-underline hover:brightness-110 transition-all"
          style={{ background: CORAL }}
        >
          Reservar a las {selectedSlot} · {party} {party === 1 ? 'persona' : 'personas'}
        </Link>

        <div className="flex items-center gap-2 text-tx3 text-[11px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Pago seguro · Cancelás cuando quieras
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hero gallery 2×2 estilo Airbnb/OpenTable:
 * - Foto principal grande a la izquierda (ocupa 2 filas)
 * - 2 fotos a la derecha, una arriba y otra abajo
 * - La última tiene overlay "Ver todas las fotos"
 * Las imágenes vienen de venue.config_json.image_url (si existe) + LoremFlickr
 * con tags de cocina para los slots restantes.
 */
function HeroGallery({ venue }: { venue: Venue }) {
  const explicit = (venue.config_json as { image_url?: string } | null)?.image_url
  const gallery = getVenueGallery(venue, 800, 600)
  // Slot 0 = imagen principal del venue si existe; si no, primera del gallery.
  const imgs = [
    explicit || gallery[0],
    gallery[1] ?? gallery[0],
    gallery[2] ?? gallery[0],
    gallery[3] ?? gallery[0],
  ]

  return (
    <section
      className="rounded-2xl overflow-hidden grid gap-2 mb-8"
      style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '200px 200px' }}
    >
      <div className="row-span-2 col-span-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[0]} alt={venue.name} loading="eager" className="w-full h-full object-cover" />
      </div>
      <div className="col-span-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[1]} alt={venue.name} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="col-span-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[2]} alt={venue.name} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="col-span-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[3]} alt={venue.name} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="col-span-1 overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gallery[4] ?? imgs[0]} alt={venue.name} loading="lazy" className="w-full h-full object-cover" />
        <button
          type="button"
          className="absolute inset-0 bg-tx/60 flex items-center justify-center text-white text-[13px] font-bold hover:bg-tx/70 transition-colors"
        >
          Ver todas las fotos
        </button>
      </div>
    </section>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgba(0,0,0,0.07)] p-4 bg-sf">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-tx3">{label}</p>
      <p className="font-display text-[22px] text-tx leading-none mt-1.5 tracking-tight">
        {value}
      </p>
    </div>
  )
}

function EmptyTab({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] p-12 text-center">
      <p className="font-display text-[22px] text-tx">{title}</p>
      <p className="text-tx2 text-[14px] mt-2 max-w-sm mx-auto">{body}</p>
    </div>
  )
}
