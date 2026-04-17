'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/BottomNav'
import { VenueCardLab } from '@/components/lab/VenueCardLab'
import { useFavorites } from '@/lib/favorites'
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
    <div className="min-h-screen bg-bg pb-28">
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

      <BottomNav />
    </div>
  )
}
