import { createClient } from '@/lib/supabase/server'
import { VenueCard } from '@/components/home/VenueCard'
import { BottomNav } from '@/components/ui/BottomNav'
import type { Venue } from '@reservaya/shared'

export const revalidate = 60 // revalidar cada 60s

export default async function HomePage() {
  const supabase = await createClient()
  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const venueList = (venues ?? []) as Venue[]
  const heroVenue = venueList[0]
  const restVenues = venueList.slice(1)

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <header className="screen-x pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-[26px] font-black text-tx tracking-tight">
              ReservaYa
            </h1>
            <p className="text-tx2 text-[13px]">¿A dónde salís hoy?</p>
          </div>
          <button
            aria-label="Notificaciones"
            className="w-10 h-10 rounded-full bg-sf flex items-center justify-center
                       border border-[var(--br)] active:scale-95 transition-transform duration-[180ms]"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                stroke="var(--tx2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Barra de búsqueda */}
      <div className="screen-x mb-5">
        <div className="flex items-center gap-3 bg-sf border border-[var(--br)]
                        rounded-full px-4 py-3">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-tx3 flex-shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-tx3 text-[14px]">Buscar restaurante o dirección…</span>
        </div>
      </div>

      {/* Chips de categoría */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar screen-x mb-6 pb-1">
        {['Todos', 'Pastas', 'Carnes', 'Pizza', 'Vegano', 'Sushi'].map((cat, i) => (
          <button
            key={cat}
            className={`chip flex-shrink-0 ${i === 0 ? 'chip-active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="screen-x space-y-4">
        {/* Hero card */}
        {heroVenue && (
          <>
            <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
              Destacado
            </p>
            <VenueCard venue={heroVenue} variant="hero" />
          </>
        )}

        {/* Lista compacta */}
        {restVenues.length > 0 && (
          <>
            <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider pt-2">
              Más restaurantes
            </p>
            <div className="space-y-3">
              {restVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} variant="compact" />
              ))}
            </div>
          </>
        )}

        {venueList.length === 0 && (
          <div className="text-center py-16">
            <p className="font-display text-[22px] font-bold text-tx">
              Próximamente
            </p>
            <p className="text-tx2 text-[14px] mt-2">
              Los primeros restaurantes piloto se suman pronto.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
