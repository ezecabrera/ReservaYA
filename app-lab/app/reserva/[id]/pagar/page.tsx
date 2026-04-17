import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentMethodClient } from '@/components/lab/PaymentMethodClient'
import type { Venue } from '@/lib/shared'

interface Props {
  params: { id: string }
}

export default async function PagarPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/reserva/${params.id}/pagar`)

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(`
      id, date, time_slot, party_size, status,
      venues (name, address, config_json),
      tables (label)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !reservation) notFound()

  // Si ya está confirmada, saltar directo al comprobante
  if (reservation.status === 'confirmed' || reservation.status === 'checked_in') {
    redirect(`/reserva/${params.id}/confirmacion?status=approved`)
  }

  const venue = reservation.venues as unknown as Pick<Venue, 'name' | 'address' | 'config_json'> | null
  const table = reservation.tables as unknown as { label: string } | null
  const deposit = (venue?.config_json as { deposit_amount?: number } | null)?.deposit_amount ?? 0

  return (
    <PaymentMethodClient
      reservationId={params.id}
      data={{
        venueName: venue?.name ?? 'Restaurante',
        tableLabel: table?.label ?? 'Mesa',
        date: reservation.date as string,
        timeSlot: reservation.time_slot as string,
        partySize: reservation.party_size as number,
        depositAmount: deposit,
      }}
    />
  )
}
