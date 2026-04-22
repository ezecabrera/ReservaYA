import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tables/disponibles?venue_id=&date=&time_slot=&party_size=
 * Devuelve las mesas disponibles para la combinación fecha/horario/personas.
 * Excluye mesas con reservas activas o locks vigentes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const venueId   = searchParams.get('venue_id')
  const date      = searchParams.get('date')
  const timeSlot  = searchParams.get('time_slot')
  const partySize = Number(searchParams.get('party_size') ?? 1)

  if (!venueId || !date || !timeSlot) {
    return NextResponse.json(
      { error: 'Faltan parámetros: venue_id, date, time_slot' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  // IDs de mesas con reservas activas en ese slot
  const { data: busyReservations } = await supabase
    .from('reservations')
    .select('table_id')
    .eq('venue_id', venueId)
    .eq('date', date)
    .eq('time_slot', timeSlot)
    .in('status', ['pending_payment', 'confirmed', 'checked_in'])

  const busyFromReservations = (busyReservations ?? []).map((r) => r.table_id as string)

  // IDs de mesas con lock vigente
  const { data: activeLocks } = await supabase
    .from('table_locks')
    .select('table_id')
    .gt('expires_at', new Date().toISOString())

  const busyFromLocks = (activeLocks ?? []).map((l) => l.table_id as string)

  const busyTableIds = [...new Set([...busyFromReservations, ...busyFromLocks])]

  // Mesas del venue que cumplen capacidad y no están ocupadas
  let query = supabase
    .from('tables')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .eq('is_occupied', false)
    .gte('capacity', partySize)
    .order('position_order')

  if (busyTableIds.length > 0) {
    query = query.not('id', 'in', `(${busyTableIds.join(',')})`)
  }

  const { data: tables, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(tables ?? [])
}
