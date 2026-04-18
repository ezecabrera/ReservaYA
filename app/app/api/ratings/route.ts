import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RatingInput } from '@/lib/shared'

/**
 * POST /api/ratings (app cliente)
 * Dirección permitida: user_to_venue.
 * El usuario puede calificar al venue si:
 *   - Hizo check-in (visitó)
 *   - O si el venue canceló unilateralmente (cancelled_by='venue')
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: Partial<RatingInput>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { reservation_id, direction, stars, comment } = body

  if (!reservation_id || !direction || !stars) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (direction !== 'user_to_venue') {
    return NextResponse.json(
      { error: 'Desde la app solo podés calificar al restaurante' },
      { status: 400 },
    )
  }
  if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    return NextResponse.json({ error: 'Stars debe ser entero entre 1 y 5' }, { status: 400 })
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, venue_id, user_id, status, cancelled_by')
    .eq('id', reservation_id)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }
  if (reservation.user_id !== user.id) {
    return NextResponse.json({ error: 'Esta reserva no es tuya' }, { status: 403 })
  }

  const visited = reservation.status === 'checked_in'
  const unilateralCancel =
    reservation.status === 'cancelled' && reservation.cancelled_by === 'venue'
  if (!visited && !unilateralCancel) {
    return NextResponse.json(
      { error: 'Solo podés calificar tras la visita o si el restaurante canceló' },
      { status: 400 },
    )
  }

  const { data: rating, error: insertError } = await supabase
    .from('ratings')
    .insert({
      reservation_id,
      venue_id: reservation.venue_id,
      user_id: null,           // es user_to_venue, el sujeto es el venue
      guest_phone: null,
      direction: 'user_to_venue',
      stars,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (insertError) {
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Ya calificaste esta reserva' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(rating, { status: 201 })
}
