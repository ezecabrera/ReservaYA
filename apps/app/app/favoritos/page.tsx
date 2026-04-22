'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/BottomNav'
import { VenueCardLab } from '@/components/lab/VenueCardLab'
import { useFavorites } from '@/lib/favorites'
import { getVenueHero } from '@/lib/venue-images'
import type { Venue } from '@/lib/shared'

export default function FavoritosPage() {
  const { favorites, clear } = useFavorites()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (favorites.length === 0) {
      setVenues([])
      setLoading(false)
      return
    }
    // Fetch todos los venues y filtrar por los guardados
    fetch('/api/venues')
      .then((r) => r.ok ? r.json() : [])
      .then((list: Venue[]) => {
        if (!Array.isArray(list)) { setVenues([]); return }
        const favSet = new Set(favorites)
        setVenues(list.filter((v) => favSet.has(v.id)))
      })
      .finally(() => setLoading(false))
  }, [favorites])

  return (
    <div className="min-h-screen bg-bg pb-28 lg:pb-0">
      {/* ═══════════ DESKTOP ═══════════ */}
      <div className="hidden lg:block dk-content-centered py-8">
        <header className="flex items-end justify-between mb-8">
          <div>
            <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">
              Tu colección
            </p>
            <h1 className="font-display text-[36px] text-tx leading-none tracking-tight">
              Favoritos
            </h1>
            {!loading && venues.length > 0 && (
              <p className="text-tx2 text-[14px] mt-2">
                {venues.length} {venues.length === 1 ? 'lugar guardado' : 'lugares guardados'}
              </p>
            )}
          </div>
          {favorites.length > 0 && (
            <button
              onClick={() => { if (confirm('¿Quitar todos los favoritos?')) clear() }}
              className="px-4 py-2.5 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx2 text-[13px] font-semibold hover:text-[#C42434] hover:border-[#C42434]/30 transition-colors"
            >
              Vaciar favoritos
            </button>
          )}
        </header>

        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 skeleton rounded-xl" />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-sf flex items-center justify-center mx-auto mb-5 border border-[rgba(0,0,0,0.07)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                      stroke="#FF4757" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-display text-[26px] text-tx">Sin favoritos todavía</p>
            <p className="text-tx2 text-[14px] mt-2 max-w-md mx-auto">
              Tocá el corazón en cualquier restaurante para tenerlo siempre a mano en tu lista.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-3 rounded-md text-white font-semibold text-[14px] no-underline"
              style={{ background: '#FF4757' }}
            >
              Explorar restaurantes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {venues.map((v) => <DesktopFavoriteCard key={v.id} venue={v} />)}
          </div>
        )}
      </div>

      {/* ═══════════ MOBILE ═══════════ */}
      <div className="lg:hidden">
      <header className="screen-x pt-14 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-tx3 text-[11px] font-bold uppercase tracking-wider">
              Tu selección
            </p>
            <h1 className="font-display text-[26px] font-bold text-tx tracking-tight leading-tight">
              Favoritos
            </h1>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Quitar todos los favoritos?')) clear()
              }}
              className="text-[12px] text-tx3 font-semibold underline underline-offset-2"
            >
              Vaciar
            </button>
          )}
        </div>
      </header>

      <div className="screen-x mt-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-lg" />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="mt-6 text-center py-10 px-5 bg-sf rounded-2xl border border-[var(--br)]">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 border border-[var(--br)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                      stroke="var(--c1)" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-display text-[18px] font-bold text-tx">
              Todavía no guardaste ninguno
            </p>
            <p className="text-tx2 text-[13px] mt-1.5 max-w-[260px] mx-auto leading-relaxed">
              Tocá el corazón en cualquier restaurante para tenerlo siempre a mano.
            </p>
            <Link href="/" className="btn-primary mt-5 inline-block">
              Explorar restaurantes
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-tx2 text-[13px] mb-1">
              <span className="font-bold text-tx">{venues.length}</span>{' '}
              {venues.length === 1 ? 'lugar guardado' : 'lugares guardados'}
            </p>
            {venues.map((v) => (
              <VenueCardLab key={v.id} venue={v} variant="compact" />
            ))}
          </div>
        )}
      </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ── Desktop card (más editorial que la mobile) ───────────────────────────────
function DesktopFavoriteCard({ venue }: { venue: Venue }) {
  const explicit = (venue.config_json as { image_url?: string } | null)?.image_url
  const src = explicit || getVenueHero(venue, 600, 400)
  const hood = venue.address.match(/,\s*([^,]+),\s*CABA/i)?.[1] ?? 'CABA'
  const price = (venue.config_json as { price_range?: string } | null)?.price_range ?? '$$'
  return (
    <Link
      href={`/${venue.id}`}
      className="block rounded-2xl border border-[rgba(0,0,0,0.07)] bg-bg overflow-hidden no-underline dk-card-hover"
    >
      <div className="h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={venue.name} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-display text-[17px] text-tx tracking-tight leading-tight line-clamp-1">
          {venue.name}
        </h3>
        <p className="text-tx3 text-[12px] mt-1 line-clamp-1">
          {hood} · <span className="font-mono">{price}</span>
        </p>
      </div>
    </Link>
  )
}
