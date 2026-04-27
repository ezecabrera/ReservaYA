/* UnToque · API reservation history — timeline de eventos.
 *
 *   GET /api/reservas/:id/history → ReservationEvent[] ASC por created_at
 *
 * Ownership: reservation.venue_id debe coincidir con staff_users.venue_id.
 * Si la reserva no tiene events todavía → [] (no 404).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { requestLogger } from '@/lib/logger'

async function resolveStaffVenueId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', userId)
    .single()
  return (data?.venue_id as string | undefined) ?? null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const log = requestLogger(request).child({ endpoint: 'reservas.history.get' })
  const { id } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const venueId = await resolveStaffVenueId(user.id)
  if (!venueId) {
    return NextResponse.json(
      { error: 'No sos staff de ningún venue' },
      { status: 403 },
    )
  }

  const admin = createAdminClient()

  // Ownership check: reservation.venue_id matches staff venue_id
  const { data: reservation, error: resErr } = await admin
    .from('reservations')
    .select('venue_id')
    .eq('id', id)
    .single()

  if (resErr || !reservation) {
    return NextResponse.json(
      { error: 'Reserva no encontrada' },
      { status: 404 },
    )
  }
  if ((reservation as { venue_id: string }).venue_id !== venueId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('reservation_events')
    .select('*')
    .eq('reservation_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    log.error({ err: error.message, reservation_id: id }, 'history query failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
