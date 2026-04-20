import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import type { Venue } from '@/lib/shared'

interface Props {
  params: { venueId: string }
  searchParams: { date?: string; time?: string; party?: string }
}

/**
 * Pantalla dedicada del wizard de reserva. El "Empezar reserva" del detalle
 * del venue linkea acá — da sensación de "siguiente pantalla" en lugar de
 * desplegarse inline.
 *
 * Tiene su propio header compacto con back arrow + nombre del venue.
 */
export default async function ReservarPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: venue, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', params.venueId)
    .eq('is_active', true)
    .single()

  if (error || !venue) notFound()

  // Prefill desde SearchPill del home
  const party = searchParams.party ? parseInt(searchParams.party, 10) : undefined
  const prefill = {
    date: searchParams.date,
    time: searchParams.time,
    partySize: party && party >= 1 && party <= 20 ? party : undefined,
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header compacto: back + nombre + "Paso X de 4" lo maneja el wizard */}
      <header className="screen-x pt-12 pb-2 flex items-start gap-3">
        <Link
          href={`/${params.venueId}`}
          aria-label="Volver al detalle del restaurante"
          className="flex-shrink-0 w-10 h-10 rounded-full bg-sf border border-[var(--br)]
                     flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] text-tx leading-[1.1] tracking-[-0.3px] truncate">
            {venue.name}
          </h1>
          <p className="text-tx2 text-[12.5px] mt-0.5">
            Hacé tu reserva en {venue.name}
          </p>
        </div>
      </header>

      <div className="screen-x pt-3">
        <ReservationWizard venue={venue as Venue} prefill={prefill} />
      </div>
    </div>
  )
}
