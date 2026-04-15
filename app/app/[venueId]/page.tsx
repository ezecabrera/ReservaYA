import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import { BottomNav } from '@/components/ui/BottomNav'
import type { Venue } from '@reservaya/shared'

interface Props {
  params: { venueId: string }
}

export default async function VenueDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single()

  if (error || !venue) notFound()

  const v = venue as Venue

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
