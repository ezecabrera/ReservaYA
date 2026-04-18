import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { VenueCard } from '@/components/home/VenueCard'
import { BottomNav } from '@/components/ui/BottomNav'
import { PageHero } from '@/components/ui/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconWineGlass } from '@/components/ui/Icons'
import type { Venue } from '@/lib/shared'

export const revalidate = 60

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
      <PageHero
        kicker="Reservaya"
        title="¿A dónde salís hoy?"
        subtitle="Los mejores lugares cerca tuyo, sin descargar nada."
        accent="coral"
        actions={(
          <button
            aria-label="Notificaciones"
            className="w-10 h-10 rounded-full bg-white border border-[var(--br)]
                       flex items-center justify-center active:scale-95
                       transition-transform duration-[180ms] shadow-[var(--sh-sm)]"
          >
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                stroke="var(--tx2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      />

      {/* Barra de búsqueda — tap → /buscar */}
      <div className="screen-x pt-5 mb-5">
        <Link
          href="/buscar"
          aria-label="Ir al buscador"
          className="flex items-center gap-3 bg-white border border-[var(--br)]
                     rounded-full px-4 py-3 shadow-[var(--sh-sm)]
                     hover:border-wine/30 hover:shadow-[var(--sh-md)]
                     active:scale-[0.99] transition-all"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-tx3 flex-shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-tx3 text-[14px]">Buscar restaurante o dirección…</span>
        </Link>
      </div>

      {/* Chips de categoría */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar screen-x mb-7 pb-1">
        {['Todos', 'Pastas', 'Carnes', 'Pizza', 'Vegano', 'Sushi'].map((cat, i) => (
          <button
            key={cat}
            className={`chip flex-shrink-0 ${i === 0 ? 'chip-active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="screen-x space-y-5">
        {heroVenue && (
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[10.5px] font-bold text-tx3 uppercase tracking-[0.12em]">
                Destacado
              </p>
              <span className="text-[10.5px] font-bold text-tx3 uppercase tracking-[0.12em]">
                Hoy
              </span>
            </div>
            <VenueCard venue={heroVenue} variant="hero" />
          </section>
        )}

        {restVenues.length > 0 && (
          <section>
            <p className="text-[10.5px] font-bold text-tx3 uppercase tracking-[0.12em] mb-3 mt-2">
              Más restaurantes
            </p>
            <div className="space-y-3">
              {restVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {venueList.length === 0 && (
          <EmptyState
            accent="coral"
            title="Próximamente"
            description="Los primeros restaurantes piloto se suman pronto."
            icon={<IconWineGlass size={28} />}
          />
        )}
      </div>

      <BottomNav />
    </div>
  )
}
