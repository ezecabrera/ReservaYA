import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import { BottomNav } from '@/components/ui/BottomNav'
import { VenueRatingBlock } from '@/components/venue/VenueRatingBlock'
import { computeVenueRatingStats } from '@/lib/shared'
import type { Venue, VenueRatingStats } from '@/lib/shared'

interface Props {
  params: { venueId: string }
}

export default async function VenueDetailPage({ params }: Props) {
  const supabase = await createClient()

  // Venue + data para el rating block en paralelo
  const [venueResult, ratingsResult, reservationsResult] = await Promise.all([
    supabase
      .from('venues')
      .select('*')
      .eq('id', params.venueId)
      .eq('is_active', true)
      .single(),
    supabase
      .from('ratings')
      .select('stars, hidden')
      .eq('venue_id', params.venueId)
      .eq('direction', 'user_to_venue')
      .eq('hidden', false),
    supabase
      .from('reservations')
      .select('status, cancelled_by, date')
      .eq('venue_id', params.venueId),
  ])

  if (venueResult.error || !venueResult.data) notFound()

  const v = venueResult.data as Venue

  // Si la tabla ratings no existe todavía (migration 008 no aplicada),
  // ratingsResult.error será no-null. Caemos a stats vacíos sin romper la página.
  let ratingStats: VenueRatingStats | null = null
  if (!ratingsResult.error && !reservationsResult.error) {
    ratingStats = computeVenueRatingStats(
      ratingsResult.data ?? [],
      reservationsResult.data ?? [],
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Hero del restaurante — ink con accent wine sutil si no hay imagen */}
      <div
        className="relative h-52 bg-ink overflow-hidden"
        style={{
          backgroundImage: v.image_url
            ? undefined
            : 'radial-gradient(80% 100% at 100% 0%, rgba(161,49,67,0.28) 0%, transparent 60%)',
        }}
      >
        {v.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.image_url}
            alt={v.name}
            className="w-full h-full object-cover opacity-75"
          />
        )}
        {/* Gradient reading del nombre — más fuerte con imagen, sutil sin ella */}
        <div className={`absolute inset-0 ${v.image_url ? 'bg-gradient-to-t from-black/70 to-transparent' : 'bg-gradient-to-t from-black/40 to-transparent'}`} />

        {/* Back button */}
        <a
          href="/"
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/45
                     backdrop-blur-sm flex items-center justify-center
                     border border-white/10 hover:bg-black/60 transition-colors"
          aria-label="Volver"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        {/* Venue name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/65 text-[10.5px] font-bold uppercase tracking-[0.14em] mb-1">
            Restaurante
          </p>
          <h1 className="font-display text-[26px] font-bold text-white tracking-tight leading-tight">
            {v.name}
          </h1>
          <p className="text-white/75 text-[13px] mt-0.5">{v.address}</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="screen-x pt-5 space-y-5">
        {/* Info rápida */}
        {v.description && (
          <p className="text-tx2 text-[14px] leading-relaxed">{v.description}</p>
        )}

        {/* Rating público + disciplina del local */}
        {ratingStats && <VenueRatingBlock stats={ratingStats} />}

        {/* Divider */}
        <div className="h-px bg-[var(--br)]" />

        {/* Wizard de reserva */}
        <div>
          <h2 className="font-display text-[20px] font-bold text-tx mb-4">
            Hacé tu reserva
          </h2>
          <ReservationWizard venue={v} />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
