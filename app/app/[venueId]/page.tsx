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
      {/* Hero del restaurante */}
      <div className="relative h-52 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460]">
        {v.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.image_url} alt={v.name}
            className="w-full h-full object-cover opacity-70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Back button */}
        <a
          href="/"
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/40
                     backdrop-blur-sm flex items-center justify-center"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="white"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        {/* Venue name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-display text-[26px] font-bold text-white tracking-tight">
            {v.name}
          </h1>
          <p className="text-white/70 text-[13px] mt-0.5">{v.address}</p>
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
