import Link from 'next/link'
import type { Venue } from '@/lib/shared'

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
  priceTier, hasDeposit, distanceKm,
}: Props) {
  const tier = priceTier ?? priceTierOf(venue)
  const cuisine = cuisineLabel(venue)
  const hood = neighborhood(venue.address)
  const deposit = hasDeposit ?? ((venue.config_json as { deposit_amount?: number } | null)?.deposit_amount ?? 0) > 0

  // ── HERO ────────────────────────────────────────────────────────────────
  if (variant === 'hero') {
    return (
      <Link href={`/${venue.id}`} className="block rounded-xl overflow-hidden
                                              border border-[var(--br)] shadow-sm bg-white
                                              active:scale-[0.99] transition-transform duration-[180ms]">
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
          {venue.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {/* Badges superiores */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="badge bg-white/95 text-tx backdrop-blur-sm shadow-sm">
              {cuisineEmoji(venue)} {cuisine}
            </span>
            {deposit && (
              <span className="badge bg-c3l text-[#B78200] backdrop-blur-sm shadow-sm">
                Seña
              </span>
            )}
          </div>
          {/* Bottom overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h2 className="font-display text-[22px] font-bold leading-tight drop-shadow-md">
              {venue.name}
            </h2>
            <p className="text-white/80 text-[12px] drop-shadow-md">
              {hood && `${hood} · `}<PriceTier tier={tier} />
            </p>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <NewBadge />
          {availableSlots && availableSlots.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-c2 animate-pulse" />
              <span className="text-[12px] text-tx2 font-semibold">
                Hoy {availableSlots[0]}
              </span>
            </div>
          ) : (
            <span className="text-[12px] text-tx3">Ver disponibilidad →</span>
          )}
        </div>
      </Link>
    )
  }

  // ── COMPACT (lista) ─────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Link href={`/${venue.id}`} className="flex gap-3 p-2.5 bg-white rounded-lg
                                              border border-[var(--br)] shadow-sm
                                              active:scale-[0.98] transition-transform duration-[180ms]">
        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-sf2 flex-shrink-0">
          {venue.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5">
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
              <span className="text-[10px] text-tx3">· {distanceKm.toFixed(1)} km</span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  // ── STANDARD ────────────────────────────────────────────────────────────
  return (
    <Link href={`/${venue.id}`}
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
            </p>
          </div>
          <NewBadge />
        </div>
      </div>
    </Link>
  )
}
