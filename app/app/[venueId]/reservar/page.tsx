import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReservationWizard } from '@/components/reservation/ReservationWizard'
import { ReservarBackButton } from './BackButton'
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
 * El back button usa router.back() (no Link) para no agregar una entrada
 * al history y evitar el loop venue → wizard → venue → wizard.
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

  // Fetch de zones (sectores) — usa el mismo supabase client (anon tiene
  // lectura pública a zones). Si falla o devuelve vacío, el wizard salta
  // el paso de sector sin romperse.
  const { data: zonesData } = await supabase
    .from('zones')
    .select('name, prefix')
    .eq('venue_id', params.venueId)
    .order('created_at')
  const zones: { name: string; prefix: string | null }[] = zonesData ?? []

  // Prefill desde SearchPill del home
  const party = searchParams.party ? parseInt(searchParams.party, 10) : undefined
  const prefill = {
    date: searchParams.date,
    time: searchParams.time,
    partySize: party && party >= 1 && party <= 20 ? party : undefined,
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="screen-x pt-12 pb-2 flex items-start gap-3">
        <ReservarBackButton venueId={params.venueId} />
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
        <ReservationWizard venue={venue as Venue} prefill={prefill} sectors={zones} />
      </div>
    </div>
  )
}
