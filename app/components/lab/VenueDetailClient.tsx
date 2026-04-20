'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Venue, ServiceHours } from '@/lib/shared'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import { useFavorites } from '@/lib/favorites'
import { VenueMap } from './VenueMap'

type DetailTab = 'reservar' | 'menu' | 'resenas' | 'nosotros'

const TAB_META: { key: DetailTab; label: string }[] = [
  { key: 'reservar', label: 'Reservar' },
  { key: 'menu',     label: 'Menú' },
  { key: 'resenas',  label: 'Reseñas' },
  { key: 'nosotros', label: 'Sobre nosotros' },
]

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// ─── Helpers horario / features ──────────────────────────────────────────

function todayHoursLabel(venue: Venue): string {
  const hours = (venue.config_json?.service_hours ?? []) as ServiceHours[]
  const today = new Date().getDay()
  const shifts = hours
    .filter((h) => h.day_of_week === today && h.is_open)
    .map((h) => `${h.opens_at}–${h.closes_at}`)
  if (shifts.length === 0) return 'Cerrado hoy'
  return shifts.join(' · ')
}

interface VenueFeature {
  emoji: string
  label: string
}

const FEATURE_LIB: Record<string, VenueFeature> = {
  wifi:        { emoji: '📶', label: 'Wi-Fi gratis' },
  accessible:  { emoji: '♿', label: 'Accesible' },
  parking:     { emoji: '🅿️', label: 'Estacionamiento' },
  pet_friendly:{ emoji: '🐾', label: 'Pet-friendly' },
  outdoor:     { emoji: '🌿', label: 'Al aire libre' },
  cards:       { emoji: '💳', label: 'Acepta tarjetas' },
  vegetarian:  { emoji: '🥗', label: 'Opciones vegetarianas' },
  vegan:       { emoji: '🌱', label: 'Opciones veganas' },
  celiaco:     { emoji: '🌾', label: 'Sin TACC' },
  kids:        { emoji: '👶', label: 'Apto niños' },
  wine_bar:    { emoji: '🍷', label: 'Carta de vinos' },
  bar:         { emoji: '🍸', label: 'Barra / tragos' },
  quiet:       { emoji: '🤫', label: 'Ambiente tranquilo' },
  trendy:      { emoji: '✨', label: 'Trendy' },
}

function venueFeatures(venue: Venue): VenueFeature[] {
  const cfg = venue.config_json as { features?: string[] } | null
  const features = cfg?.features ?? ['cards', 'vegetarian', 'wifi', 'accessible']
  return features.map((k) => FEATURE_LIB[k]).filter((f): f is VenueFeature => !!f).slice(0, 6)
}

export type MenuPreview = Array<{
  name: string
  items: Array<{ name: string; price: number; description: string | null }>
}>

interface Props {
  venue: Venue
  menu?: MenuPreview
  prefill?: { date?: string; time?: string; partySize?: number }
}

function cuisineLabel(v: Venue): string {
  const c = (v.config_json as { cuisine?: string } | null)?.cuisine
  const map: Record<string, string> = {
    pastas: 'Pastas', carnes: 'Carnes', pizza: 'Pizza',
    vegano: 'Cocina vegana', sushi: 'Sushi',
  }
  return (c && map[c]) || 'Restaurante'
}

function cuisineEmoji(v: Venue): string {
  const c = (v.config_json as { cuisine?: string } | null)?.cuisine
  const map: Record<string, string> = {
    pastas: '🍝', carnes: '🥩', pizza: '🍕', vegano: '🥗', sushi: '🍣',
  }
  return (c && map[c]) || '🍽️'
}

function neighborhood(address: string): string {
  const m = address.match(/,\s*([^,]+),\s*CABA/i)
  return m ? m[1].trim() : ''
}

// Galería desde config_json.gallery_urls o fallback derivado del image_url
function gallery(venue: Venue): string[] {
  const configGallery = (venue.config_json as { gallery_urls?: string[] } | null)?.gallery_urls
  if (configGallery && configGallery.length > 0) return configGallery
  if (!venue.image_url) return []
  const base = venue.image_url.match(/\/seed\/([^/]+)/)?.[1]
  if (!base) return [venue.image_url]
  return [
    venue.image_url,
    `https://picsum.photos/seed/${base}-interior/800/600`,
    `https://picsum.photos/seed/${base}-plato/800/600`,
    `https://picsum.photos/seed/${base}-ambiente/800/600`,
  ]
}

// Reviews: por ahora sin data real (venue_reputation_view aún no conectado en lab).
// Mostramos empty state verificable en vez de datos ficticios que erosionan confianza.
const DEMO_REVIEWS: Array<{ name: string; date: string; score: number; text: string }> = []

// ¿Estamos dentro de alguno de los shifts de apertura de HOY?
function isOpenAt(shifts: ServiceHours[]): boolean {
  if (shifts.length === 0) return false
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return shifts.some((s) => s.opens_at <= hhmm && hhmm <= s.closes_at)
}

export function VenueDetailClient({ venue, menu = [], prefill }: Props) {
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [showWizard, setShowWizard] = useState(false)
  const [showFullMenu, setShowFullMenu] = useState(false)
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [fullscreenGallery, setFullscreenGallery] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('reservar')
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const saved = isFavorite(venue.id)

  // Tabs switcheadas (no scroll-spy): cambio inmediato de contenido + scroll
  // al top para que el usuario vea la nueva tab desde el principio.
  function handleTabClick(tab: DetailTab) {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: tabsScrollTop(), behavior: 'smooth' })
    }
  }

  // Posición a la que hacemos scroll al cambiar de tab: apenas debajo del hero,
  // para que la tab bar quede visible arriba.
  function tabsScrollTop(): number {
    if (typeof document === 'undefined') return 0
    const hero = document.querySelector('[data-hero="true"]') as HTMLElement | null
    return hero ? hero.offsetHeight - 56 : 0
  }

  async function handleShare() {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/${venue.id}`
      : `/${venue.id}`
    const title = venue.name
    const text = venue.description
      ? `${venue.name} — ${venue.description}`
      : `Mirá este restaurante en Un Toque: ${venue.name}`

    // Web Share API (iOS Safari, Android Chrome, Edge)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (e) {
        // User cancelled — ignore
        if ((e as Error)?.name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('Link copiado al portapapeles ✓')
      setTimeout(() => setShareMsg(null), 2500)
    } catch {
      setShareMsg('No pudimos copiar el link. Probá de nuevo.')
      setTimeout(() => setShareMsg(null), 2500)
    }
  }
  const pics = gallery(venue)
  const hood = neighborhood(venue.address)
  const deposit = (venue.config_json as { deposit_amount?: number } | null)?.deposit_amount ?? 0
  const zonesEnabled = (venue.config_json as { zones_enabled?: boolean } | null)?.zones_enabled
  const cancellationHours = (venue.config_json as { cancellation_grace_hours?: number } | null)?.cancellation_grace_hours ?? 2
  const reviewCount = DEMO_REVIEWS.length

  return (
    <>
      {shareMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80]
                        bg-tx text-white px-4 py-2.5 rounded-full shadow-lg
                        text-[13px] font-semibold animate-fade-up">
          {shareMsg}
        </div>
      )}

      {/* Fullscreen gallery (stories-style) */}
      {fullscreenGallery && pics.length > 0 && (
        <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
          {/* Close */}
          <button
            onClick={() => setFullscreenGallery(false)}
            aria-label="Cerrar galería"
            className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full
                       bg-white/10 backdrop-blur-sm flex items-center justify-center
                       active:scale-95 transition-transform"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {/* Progress bars stories-style */}
          <div className="absolute top-12 left-4 right-16 z-10 flex gap-1">
            {pics.map((_, i) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                aria-label={`Foto ${i + 1} de ${pics.length}`}
                className={`flex-1 h-0.5 rounded-full transition-colors
                            ${i === galleryIdx ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
          {/* Left/right tap zones */}
          <button
            onClick={() => setGalleryIdx((i) => Math.max(0, i - 1))}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-5"
            aria-label="Foto anterior"
            disabled={galleryIdx === 0}
          />
          <button
            onClick={() => setGalleryIdx((i) => Math.min(pics.length - 1, i + 1))}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-5"
            aria-label="Foto siguiente"
            disabled={galleryIdx === pics.length - 1}
          />
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pics[galleryIdx]}
            alt={venue.name}
            className="max-w-full max-h-full object-contain"
          />
          {/* Caption */}
          <div className="absolute bottom-10 left-4 right-4 z-10 text-center">
            <p className="text-white font-display text-[18px] font-bold">{venue.name}</p>
            <p className="text-white/60 text-[12px] mt-0.5">
              Foto {galleryIdx + 1} de {pics.length} · Tocá los lados para navegar
            </p>
          </div>
        </div>
      )}

      {/* Gallery hero */}
      <div className="relative" data-hero="true">
        <div className="relative h-64 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] overflow-hidden">
          {pics.length > 0 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pics[galleryIdx]}
              alt={venue.name}
              onClick={() => setFullscreenGallery(true)}
              className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

          {/* Top actions */}
          <div className="absolute top-10 left-4 right-4 flex items-center justify-between">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm
                         flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              aria-label="Volver"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                aria-label="Compartir restaurante"
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm
                           flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="18" cy="5" r="3" stroke="var(--tx)" strokeWidth="2" />
                  <circle cx="6" cy="12" r="3" stroke="var(--tx)" strokeWidth="2" />
                  <circle cx="18" cy="19" r="3" stroke="var(--tx)" strokeWidth="2" />
                  <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={() => toggleFavorite(venue.id)}
                aria-label={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                aria-pressed={saved}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm
                           flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'var(--c1)' : 'none'}>
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                        stroke={saved ? 'var(--c1)' : 'var(--tx)'} strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Gallery dots */}
          {pics.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {pics.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIdx(i)}
                  className={`rounded-full transition-all ${
                    i === galleryIdx ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                  }`}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {pics.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-[18px] py-3 -mt-2 bg-bg border-b border-[var(--br)]">
            {pics.map((p, i) => (
              <button
                key={i}
                onClick={() => setGalleryIdx(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={i === galleryIdx}
                className={`relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0
                           transition-all ${i === galleryIdx ? 'ring-2 ring-c1' : 'opacity-70'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="screen-x pt-5 space-y-5">
        {/* Título + badges */}
        <section>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge bg-sf text-tx2">
              {cuisineEmoji(venue)} {cuisineLabel(venue)}
            </span>
            {hood && (
              <span className="text-[12px] text-tx3 font-semibold">· {hood}</span>
            )}
          </div>
          <h1 className="font-display text-[28px] font-bold text-tx tracking-tight leading-tight">
            {venue.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="badge bg-c2l text-[#0F7A5A]">Nuevo en Un Toque</span>
            {deposit > 0 && (
              <span className="badge bg-c3l text-[#B78200]">Seña ${deposit.toLocaleString('es-AR')}</span>
            )}
            {((venue.config_json as { dietary?: string[] } | null)?.dietary ?? []).map((d) => {
              const labels: Record<string, string> = {
                vegetarian: 'Vegetariano',
                vegan: 'Vegano',
                celiaco: 'Celíacos',
                kosher: 'Kosher',
                halal: 'Halal',
              }
              const label = labels[d]
              if (!label) return null
              return (
                <span key={d} className="badge bg-c5l text-[#6B30CC]">
                  {label}
                </span>
              )
            })}
          </div>
        </section>

      </div>

      {/* ═══════ Tabs underline ═══════ */}
      <div
        className="sticky top-0 z-30 bg-bg/95 backdrop-blur-md
                   border-b border-[var(--br)] -mx-[18px] px-[18px] mt-5"
      >
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
          {TAB_META.map((t) => {
            const isActive = activeTab === t.key
            const label = t.key === 'resenas' ? `${t.label} (${reviewCount})` : t.label
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabClick(t.key)}
                className={`relative flex-shrink-0 px-4 py-3 text-[14px] font-semibold
                            transition-colors
                            ${isActive ? 'text-c1' : 'text-tx3 hover:text-tx2'}`}
              >
                {label}
                <span
                  aria-hidden
                  className={`absolute left-2 right-2 bottom-0 h-[2.5px] rounded-t-full
                              transition-all duration-[180ms]
                              ${isActive ? 'bg-c1' : 'bg-transparent'}`}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════ Contenido por tab ═══════ */}
      <div className="screen-x pt-5 pb-24">
        {/* ── Tab Reservar ────────────────────────────────────────── */}
        {activeTab === 'reservar' && (
          <div className="space-y-5">
            {venue.description && (
              <p className="text-[14px] text-tx2 leading-relaxed">
                {venue.description}
              </p>
            )}

            {/* Dirección → Maps */}
            {(() => {
              const coords = (venue.config_json as { coords?: { lat: number; lng: number } } | null)?.coords
              const mapsHref = coords
                ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&destination_place_id=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`
              return (
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-[var(--br)]">
                  <div className="w-9 h-9 rounded-full bg-c4l flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 21s-7-6.6-7-12a7 7 0 1114 0c0 5.4-7 12-7 12z" stroke="var(--c4)" strokeWidth="2" strokeLinejoin="round" />
                      <circle cx="12" cy="9" r="2.5" stroke="var(--c4)" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">Dirección</p>
                    <p className="text-[14px] text-tx font-semibold truncate">{venue.address}</p>
                  </div>
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-4 py-2 rounded-full border border-[var(--br)]
                               bg-white text-[13px] font-bold text-tx
                               active:scale-95 transition-transform"
                  >
                    Mapa
                  </a>
                </div>
              )
            })()}

            {/* Horarios hoy */}
            {(() => {
              const hours = (venue.config_json?.service_hours ?? []) as ServiceHours[]
              const today = new Date().getDay()
              const shifts = hours.filter((h) => h.day_of_week === today && h.is_open)
              const isOpenNow = isOpenAt(shifts)
              const label = shifts.length === 0
                ? 'Cerrado hoy'
                : shifts.map((h) => `${h.opens_at} – ${h.closes_at} hs`).join(' · ')
              return (
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-[var(--br)]">
                  <div className="w-9 h-9 rounded-full bg-c3l flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="#B78200" strokeWidth="2" />
                      <path d="M12 7v5l3 2" stroke="#B78200" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">Horarios hoy</p>
                    <p className="text-[14px] text-tx font-semibold truncate">{label}</p>
                  </div>
                  {shifts.length > 0 && (
                    <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-bold
                                      ${isOpenNow ? 'bg-c2l text-[#0F7A5A]' : 'bg-sf2 text-tx3'}`}>
                      {isOpenNow ? 'Abierto' : 'Cerrado'}
                    </span>
                  )}
                </div>
              )
            })()}

            {/* Hacé tu reserva */}
            <section id="reservar" className="pt-2">
              <h2 className="font-display text-[22px] font-bold text-tx">Hacé tu reserva</h2>
              <p className="text-[13px] text-tx2 mt-1 mb-4">Seleccioná fecha, horario y mesa.</p>

              {showWizard ? (
                <ReservationWizard venue={venue} prefill={prefill} />
              ) : (
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full bg-c1 text-white font-bold text-[15px] py-4 rounded-full
                             shadow-[0_8px_24px_rgba(255,71,87,0.28)]
                             active:scale-[0.98] transition-transform duration-[180ms]
                             inline-flex items-center justify-center gap-2"
                >
                  Empezar reserva
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}

              <p className="text-[11.5px] text-tx3 text-center mt-3">
                Cancelá gratis hasta {cancellationHours}h antes · Reserva en ~30 segundos
              </p>
            </section>
          </div>
        )}

        {/* ── Tab Menú ────────────────────────────────────────────── */}
        {activeTab === 'menu' && (
          <section>
            <h2 className="font-display text-[20px] font-bold text-tx mb-3">La carta</h2>
            {menu.length === 0 ? (
              <div className="bg-sf rounded-xl p-5 text-center border border-[var(--br)]">
                <p className="text-[13px] text-tx2">La carta todavía no está disponible online.</p>
                <p className="text-[11.5px] text-tx3 mt-1">
                  Consultá al llegar o llamá al local.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(showFullMenu ? menu : menu.slice(0, 2)).map((cat) => (
                    <div key={cat.name} className="bg-white rounded-xl p-4 border border-[var(--br)]">
                      <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2.5">
                        {cat.name}
                      </p>
                      <ul className="space-y-2.5">
                        {cat.items.map((it) => (
                          <li key={it.name} className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-semibold text-tx truncate">{it.name}</p>
                              {it.description && (
                                <p className="text-[12px] text-tx2 mt-0.5 line-clamp-2 leading-snug">
                                  {it.description}
                                </p>
                              )}
                            </div>
                            <span className="font-display font-bold text-tx text-[15px] tabular-nums flex-shrink-0">
                              ${it.price.toLocaleString('es-AR')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {menu.length > 2 && (
                  <button
                    onClick={() => setShowFullMenu((v) => !v)}
                    className="mt-3 w-full py-2.5 rounded-lg bg-sf border border-[var(--br)]
                               text-[13px] font-semibold text-tx hover:bg-sf2 transition-colors"
                  >
                    {showFullMenu ? 'Ver menos' : `Ver toda la carta (${menu.length} secciones)`}
                  </button>
                )}
                <p className="text-[11px] text-tx3 mt-2 text-center">
                  Los precios pueden variar. Consultá al llegar.
                </p>
              </>
            )}
          </section>
        )}

        {/* ── Tab Reseñas ─────────────────────────────────────────── */}
        {activeTab === 'resenas' && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[20px] font-bold text-tx">Reseñas</h2>
              {reviewCount > 0 && (
                <span className="text-[12px] text-tx3 font-semibold">{reviewCount} opiniones</span>
              )}
            </div>

            {DEMO_REVIEWS.length === 0 ? (
              <div className="bg-sf rounded-xl p-6 text-center border border-[var(--br)]">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 border border-[var(--br)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.4L6 22l1.5-7.2L2 10l7.1-1.1z"
                          stroke="var(--c3)" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-display text-[16px] font-bold text-tx">
                  Todavía no hay reseñas
                </p>
                <p className="text-[13px] text-tx2 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Sé el primero en compartir tu experiencia después de tu visita.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {DEMO_REVIEWS.map((r, i) => (
                  <li key={i} className="bg-white rounded-xl p-4 border border-[var(--br)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-bold text-[14px] text-tx">{r.name}</p>
                      <p className="text-[12px] text-tx3">{r.date}</p>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className={j < r.score ? 'text-c3' : 'text-tx3/30'}>★</span>
                      ))}
                    </div>
                    <p className="text-[13px] text-tx2 leading-relaxed">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Tab Sobre nosotros ──────────────────────────────────── */}
        {activeTab === 'nosotros' && (
          <div className="space-y-6">
            {venue.description && (
              <section>
                <h2 className="font-display text-[20px] font-bold text-tx mb-2">La historia</h2>
                <p className="font-display text-[15px] text-tx leading-relaxed italic border-l-2 border-c1 pl-3">
                  {venue.description}
                </p>
              </section>
            )}

            <section>
              <h2 className="font-display text-[20px] font-bold text-tx mb-3">Lo bueno de acá</h2>
              <div className="grid grid-cols-2 gap-2">
                {venueFeatures(venue).map((f) => (
                  <Feature key={f.label} emoji={f.emoji} text={f.label} />
                ))}
              </div>
            </section>

            {zonesEnabled && (
              <section>
                <h2 className="font-display text-[20px] font-bold text-tx mb-3">Sectores</h2>
                <div className="flex flex-wrap gap-2">
                  <SectorChip emoji="🏠" label="Salón principal" />
                  <SectorChip emoji="🌿" label="Terraza" />
                  <SectorChip emoji="🍸" label="Barra" />
                  <SectorChip emoji="🔒" label="Privado" />
                </div>
              </section>
            )}

            <section>
              <h2 className="font-display text-[20px] font-bold text-tx mb-3">Horarios</h2>
              <WeeklyHours venue={venue} />
            </section>

            <section>
              <h2 className="font-display text-[20px] font-bold text-tx mb-3">Ubicación</h2>
              {(() => {
                const coords = (venue.config_json as { coords?: { lat: number; lng: number } } | null)?.coords
                return coords ? (
                  <VenueMap name={venue.name} address={venue.address} coords={coords} />
                ) : (
                  <div className="bg-sf rounded-xl p-5 text-center border border-[var(--br)]">
                    <p className="text-[13px] text-tx2">{venue.address}</p>
                    <p className="text-[11.5px] text-tx3 mt-1">Coordenadas no configuradas.</p>
                  </div>
                )
              })()}
            </section>

            <section className="bg-sf rounded-xl p-4 border border-[var(--br)]">
              <div className="flex items-start gap-2">
                <span className="text-[18px]">🛡️</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-tx">Política de cancelación</p>
                  <p className="text-[12px] text-tx2 mt-1 leading-relaxed">
                    Cancelá gratis hasta <b>{cancellationHours}h antes</b> de tu turno.
                    {deposit > 0 && ' La seña se devuelve automáticamente 24h antes.'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Grilla semanal de horarios — día de la semana con sus shifts.
 * Hoy resaltado en coral; cerrado en gris tenue.
 */
function WeeklyHours({ venue }: { venue: Venue }) {
  const hours = (venue.config_json?.service_hours ?? []) as ServiceHours[]
  const today = new Date().getDay()

  // Agrupar por día_of_week
  const byDay: Record<number, ServiceHours[]> = {}
  for (const h of hours) {
    if (!byDay[h.day_of_week]) byDay[h.day_of_week] = []
    byDay[h.day_of_week].push(h)
  }

  // Orden: empezar por hoy para que la info más útil esté arriba
  const order = [today, ...[0, 1, 2, 3, 4, 5, 6].filter((d) => d !== today)]

  return (
    <div className="bg-white rounded-xl border border-[var(--br)] overflow-hidden">
      {order.map((dow, i) => {
        const shifts = (byDay[dow] ?? []).filter((h) => h.is_open)
        const isToday = dow === today
        return (
          <div
            key={dow}
            className={`flex items-center justify-between px-4 py-3
                        ${i < 6 ? 'border-b border-[var(--br)]' : ''}
                        ${isToday ? 'bg-c1l' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold text-[13.5px] capitalize
                            ${isToday ? 'text-c1' : 'text-tx'}`}
              >
                {DAY_NAMES[dow]}
              </span>
              {isToday && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-c1
                                 bg-white px-1.5 py-0.5 rounded-full border border-c1/25">
                  Hoy
                </span>
              )}
            </div>
            {shifts.length === 0 ? (
              <span className="text-[12.5px] text-tx3 font-medium">Cerrado</span>
            ) : (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {shifts.map((h, idx) => (
                  <span
                    key={idx}
                    className={`text-[12px] font-mono tabular-nums font-semibold
                                ${isToday ? 'text-tx' : 'text-tx2'}`}
                  >
                    {h.opens_at}–{h.closes_at}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SectorChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-[var(--br)]
                    rounded-full px-3 py-1.5 text-[13px] font-semibold text-tx">
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  )
}

function Feature({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-tx2">
      <span className="w-5 h-5 rounded-full bg-c2l text-[#15A67A] flex items-center justify-center font-bold text-[11px]">
        {emoji}
      </span>
      {text}
    </div>
  )
}
