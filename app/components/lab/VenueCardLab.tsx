'use client'

import Link from 'next/link'
import type { Venue } from '@/lib/shared'
import { useFavorites } from '@/lib/favorites'

interface Props {
  venue: Venue
  variant?: 'hero' | 'standard' | 'compact'
  /** Para mostrar disponibilidad "20:30 · 21:00 · 21:30" */
  availableSlots?: string[]
  /** Price tier $ → $$$$ */
  priceTier?: 1 | 2 | 3 | 4
  /** Indica si la reserva requiere seña */
  hasDeposit?: boolean
  /** Distancia en km si está geolocalizado */
  distanceKm?: number
  /** Query string a pegar al href (prefill wizard): '?date=...&time=...&party=...' */
  linkSuffix?: string
}

// ── Derivaciones desde venue (mock si no hay data) ────────────────────────

function cuisineLabel(v: Venue): string {
  const c = (v.config_json as { cuisine?: string } | null)?.cuisine
  const map: Record<string, string> = {
    pastas: 'Pastas', carnes: 'Carnes', pizza: 'Pizza',
    vegano: 'Vegano', sushi: 'Sushi',
  }
  return c && map[c] ? map[c] : 'Restaurante'
}

function neighborhood(address: string): string {
  const match = address.match(/,\s*([^,]+),\s*CABA/i)
  return match ? match[1].trim() : ''
}

function cuisineEmoji(v: Venue): string {
  const c = (v.config_json as { cuisine?: string } | null)?.cuisine
  const map: Record<string, string> = {
    pastas: '🍝', carnes: '🥩', pizza: '🍕',
    vegano: '🥗', sushi: '🍣',
  }
  return (c && map[c]) || '🍽️'
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * Rating mock determinístico por venue.id hasta que tengamos la tabla
 * `reviews` conectada. Genera 3.8–4.9 + count 35–250. Se reemplaza por
 * venue_reputation_view en cuanto esté disponible.
 */
function mockVenueRating(id: string): { rating: number; count: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  const a = Math.abs(h)
  const rating = 3.8 + (a % 12) / 10        // 3.8 – 4.9
  const count = 35 + (a % 216)               // 35 – 250
  return { rating, count }
}

function priceTierOf(v: Venue): 1 | 2 | 3 | 4 {
  const cfg = v.config_json as { price_tier?: number; deposit_amount?: number } | null
  if (cfg?.price_tier && cfg.price_tier >= 1 && cfg.price_tier <= 4) return cfg.price_tier as 1 | 2 | 3 | 4
  const deposit = cfg?.deposit_amount ?? 1500
  if (deposit >= 4000) return 4
  if (deposit >= 2500) return 3
  if (deposit >= 1500) return 2
  return 1
}

// ─── Components ───────────────────────────────────────────────────────────

function NewBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F7A5A]">
      <span className="w-1.5 h-1.5 rounded-full bg-c2" />
      Nuevo
    </span>
  )
}

function HeartButton({ venueId, absolute }: { venueId: string; absolute?: boolean }) {
  const { isFavorite, toggle } = useFavorites()
  const saved = isFavorite(venueId)
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(venueId) }}
      aria-label={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      aria-pressed={saved}
      className={`${absolute ? 'absolute top-3 right-3 ' : ''}w-9 h-9 rounded-full
                  bg-white/95 backdrop-blur-sm flex items-center justify-center
                  shadow-sm active:scale-90 transition-transform duration-[180ms]`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'var(--c1)' : 'none'}>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              stroke={saved ? 'var(--c1)' : 'var(--tx2)'} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function PriceTier({ tier }: { tier: number }) {
  return (
    <span className="text-[12px] font-semibold text-tx3">
      {'$'.repeat(tier)}
      <span className="text-tx3/30">{'$'.repeat(4 - tier)}</span>
    </span>
  )
}

export function VenueCardLab({
  venue, variant = 'standard', availableSlots,
  priceTier, hasDeposit, distanceKm, linkSuffix = '',
}: Props) {
  const tier = priceTier ?? priceTierOf(venue)
  const href = `/${venue.id}${linkSuffix}`
  const cuisine = cuisineLabel(venue)
  const hood = neighborhood(venue.address)
  const deposit = hasDeposit ?? ((venue.config_json as { deposit_amount?: number } | null)?.deposit_amount ?? 0) > 0

  // ── HERO ────────────────────────────────────────────────────────────────
  if (variant === 'hero') {
    const { rating, count: reviewsCount } = mockVenueRating(venue.id)
    const shortDesc = venue.description
      ? venue.description.replace(/\s+/g, ' ').trim()
      : null
    const available = availableSlots && availableSlots.length > 0
    return (
      <div className="relative">
        <HeartButton venueId={venue.id} absolute />
        <Link href={href} className="block rounded-xl overflow-hidden
                                              border border-[var(--br)] shadow-sm bg-white
                                              active:scale-[0.99] transition-transform duration-[180ms]">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
          {venue.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          {/* Disponibilidad top-right (arriba del heart no, a la izquierda del heart) */}
          {available && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 bg-c2l text-[#0F7A5A]
                               rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-c2 animate-pulse" />
                Disponible
              </span>
            </div>
          )}
          {/* Bottom overlay: nombre + meta */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h2 className="font-display text-[24px] font-bold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              {venue.name}
            </h2>
            <p className="text-white/85 text-[13px] font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {hood && `${hood} · `}<PriceTier tier={tier} />
              {typeof distanceKm === 'number' && (
                <span className="ml-1">· {formatDistance(distanceKm)}</span>
              )}
            </p>
          </div>
        </div>
        <div className="px-4 pt-3 pb-3.5 space-y-2">
          {/* Rating row */}
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-c3">★</span>
            <span className="font-bold text-tx">{rating.toFixed(1)}</span>
            <span className="text-tx3">·</span>
            <span className="text-tx3">{reviewsCount} reseñas</span>
            {deposit && (
              <>
                <span className="text-tx3">·</span>
                <span className="text-[#B78200] font-semibold">Seña</span>
              </>
            )}
          </div>
          {/* Descripción */}
          {shortDesc && (
            <p className="text-[13px] text-tx2 leading-snug line-clamp-2">
              {shortDesc}
            </p>
          )}
          {/* CTA inline */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[13px] text-c1 font-bold inline-flex items-center gap-1">
              Ver mesas
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {available && availableSlots && (
              <span className="text-[11px] text-tx3">
                Hoy · {availableSlots[0]}
              </span>
            )}
          </div>
        </div>
        </Link>
      </div>
    )
  }

  // ── COMPACT (lista) ─────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="relative">
        <Link href={href} className="flex gap-3 p-2.5 bg-white rounded-lg
                                              border border-[var(--br)] shadow-sm
                                              active:scale-[0.98] transition-transform duration-[180ms]">
        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-sf2 flex-shrink-0">
          {venue.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5 pr-9">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-[14px] text-tx truncate">{venue.name}</p>
            <NewBadge />
          </div>
          <p className="text-[12px] text-tx3 truncate mt-0.5">
            {cuisine} · {hood && `${hood} · `}<PriceTier tier={tier} />
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {availableSlots?.slice(0, 3).map((s) => (
              <span key={s} className="badge bg-c2l text-[#0F7A5A] text-[10px]">{s}</span>
            ))}
            {deposit && availableSlots && availableSlots.length > 0 && (
              <span className="text-[10px] text-tx3">· Seña</span>
            )}
            {typeof distanceKm === 'number' && (
              <span className="text-[10px] text-tx3">· {formatDistance(distanceKm)}</span>
            )}
          </div>
        </div>
        </Link>
        <div className="absolute top-2 right-2">
          <HeartButton venueId={venue.id} />
        </div>
      </div>
    )
  }

  // ── STANDARD ────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      <HeartButton venueId={venue.id} absolute />
      <Link href={href}
          className="block bg-white rounded-xl overflow-hidden border border-[var(--br)]
                     shadow-sm active:scale-[0.99] transition-transform duration-[180ms]">
      <div className="relative aspect-[4/3] overflow-hidden bg-sf2">
        {venue.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 left-2">
          <span className="badge bg-white/95 text-tx text-[10px] font-bold backdrop-blur-sm">
            {cuisineEmoji(venue)} {cuisine}
          </span>
        </div>
        {availableSlots && availableSlots.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
            {availableSlots.slice(0, 3).map((s) => (
              <span key={s}
                    className="px-2 py-0.5 rounded-md bg-white/95 text-tx text-[11px]
                               font-bold backdrop-blur-sm">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-[15px] text-tx truncate">{venue.name}</p>
            <p className="text-[12px] text-tx3 truncate">
              {hood && `${hood} · `}<PriceTier tier={tier} />
              {typeof distanceKm === 'number' && (
                <span className="ml-1">· {formatDistance(distanceKm)}</span>
              )}
            </p>
          </div>
          <NewBadge />
        </div>
      </div>
      </Link>
    </div>
  )
}
