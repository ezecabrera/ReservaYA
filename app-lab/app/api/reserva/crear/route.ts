import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/reserva/crear
 * Body: { venue_id, table_id, date, time_slot, party_size, lock_id }
 *
 * 1. Verifica auth
 * 2. Verifica que el lock sigue vigente
 * 3. Crea la reserva en status 'pending_payment'
 * 4. Actualiza el lock: type='payment', expires_at = +10min, reservation_id = nueva reserva
 * 5. Devuelve la reserva creada
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json() as {
    venue_id: string
    table_id: string
    date: string
    time_slot: string
    party_size: number
    lock_id: string
  }

  const { venue_id, table_id, date, time_slot, party_size, lock_id } = body

  if (!venue_id || !table_id || !date || !time_slot || !party_size || !lock_id) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Verificar que el lock sigue vigente
  const { data: lock } = await supabase
    .from('table_locks')
    .select('*')
    .eq('id', lock_id)
    .eq('table_id', table_id)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!lock) {
    return NextResponse.json(
      { error: 'El tiempo de selección venció. Por favor, elegí la mesa de nuevo.' },
      { status: 409 },
    )
  }

  // Doble verificación: no hay reserva confirmada para esta mesa en este slot
  const { data: conflict } = await supabase
    .from('reservations')
    .select('id')
    .eq('table_id', table_id)
    .eq('date', date)
    .eq('time_slot', time_slot)
    .in('status', ['confirmed', 'checked_in'])
    .maybeSingle()

  if (conflict) {
    return NextResponse.json(
      { error: 'Esta mesa ya fue reservada. Por favor, elegí otra.' },
      { status: 409 },
    )
  }

  // Crear la reserva
  const { data: reservation, error: reservationError } = await supabase
    .from('reservations')
    .insert({
      venue_id,
      table_id,
      user_id: user.id,
      date,
      time_slot,
      party_size,
      status: 'pending_payment',
      qr_token: '', // se genera al confirmar el pago
    })
    .select()
    .single()

  if (reservationError || !reservation) {
    return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
  }

  // Actualizar lock: tipo payment, 10 min, vinculado a la reserva
  const paymentLockExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  await supabase
    .from('table_locks')
    .update({
      type: 'payment',
      expires_at: paymentLockExpiry,
      reservation_id: reservation.id,
    })
    .eq('id', lock_id)

  return NextResponse.json(reservation, { status: 201 })
}
