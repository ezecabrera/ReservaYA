import { redirect } from 'next/navigation'
import { SignJWT } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { ConfirmationClient } from '@/components/confirmation/ConfirmationClient'
import type { Venue, Table, User, Payment } from '@/lib/shared'

interface Props {
  params: { id: string }
  searchParams: { status?: string; payment_id?: string }
}

export default async function ConfirmacionPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/reserva/${params.id}/confirmacion`)

  const status = (searchParams.status ?? 'pending') as 'approved' | 'rejected' | 'pending'
  const paymentId = searchParams.payment_id ?? null

  // Obtener la reserva
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!reservation) redirect('/')

  // Procesar pago aprobado server-side
  if (status === 'approved' && reservation.status === 'pending_payment') {
    // Generar QR JWT
    const secret = new TextEncoder().encode(process.env.QR_JWT_SECRET!)
    const [year, month, day] = (reservation.date as string).split('-').map(Number)
    const [hour, minute] = (reservation.time_slot as string).split(':').map(Number)
    const reservationTime = new Date(year, month - 1, day, hour, minute)
    const exp = Math.floor(reservationTime.getTime() / 1000) + 4 * 3600

    const qrToken = await new SignJWT({
      reservation_id: params.id,
      venue_id: reservation.venue_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(exp)
      .sign(secret)

    await Promise.all([
      supabase
        .from('payments')
        .update({ status: 'approved', external_id: paymentId })
        .eq('reservation_id', params.id)
        .eq('status', 'pending'),
      supabase
        .from('reservations')
        .update({ status: 'confirmed', qr_token: qrToken })
        .eq('id', params.id),
      supabase
        .from('table_locks')
        .delete()
        .eq('table_id', reservation.table_id)
        .eq('type', 'payment'),
    ])

    // Re-fetch con el token actualizado
    const { data: updated } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (updated) Object.assign(reservation, updated)
  }

  const [venueResult, tableResult, userResult, paymentResult] = await Promise.all([
    supabase.from('venues').select('name, address, config_json').eq('id', reservation.venue_id).single(),
    supabase.from('tables').select('label').eq('id', reservation.table_id).single(),
    supabase.from('users').select('name').eq('id', user.id).single(),
    supabase
      .from('payments')
      .select('amount')
      .eq('reservation_id', params.id)
      .eq('status', 'approved')
      .maybeSingle(),
  ])

  const venue = venueResult.data as Pick<Venue, 'name' | 'address' | 'config_json'> | null
  const table = tableResult.data as Pick<Table, 'label'> | null
  const profile = userResult.data as Pick<User, 'name'> | null
  const payment = paymentResult.data as Pick<Payment, 'amount'> | null

  const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL ?? 'http://localhost:3001'
  const qrUrl = reservation.qr_token
    ? `${panelUrl}/check-in?token=${encodeURIComponent(reservation.qr_token)}`
    : ''

  return (
    <ConfirmationClient
      status={status}
      data={{
        userName: profile?.name ?? 'Usuario',
        tableLabel: table?.label ?? 'Mesa',
        venueName: venue?.name ?? 'Restaurante',
        venueAddress: venue?.address ?? '',
        date: reservation.date,
        timeSlot: reservation.time_slot,
        partySize: reservation.party_size,
        qrUrl,
        reservationId: reservation.id,
        depositAmount: payment?.amount ?? (venue?.config_json?.deposit_amount ?? 0),
      }}
    />
  )
}
