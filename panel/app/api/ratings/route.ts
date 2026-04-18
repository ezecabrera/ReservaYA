import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import type { RatingInput } from '@/lib/shared'

/**
 * POST /api/ratings
 * Crea un rating en cualquiera de las dos direcciones.
 *
 *   - direction='venue_to_user': usado desde el panel post check-in para
 *     calificar al comensal (visible internamente en el CRM del venue).
 *     Solo el staff del venue dueño de la reserva puede crearlo.
 *
 *   - direction='user_to_venue': usado desde la PWA cliente para calificar
 *     al restaurante (alimenta el perfil público). Solo el usuario dueño
 *     de la reserva puede crearlo.
 *
 * Restricciones:
 *   - Máx 1 rating por dirección por reserva (UNIQUE en DB)
 *   - Stars entre 1 y 5
 *   - La reserva debe haber tenido un "contacto real":
 *     · checked_in  → ambas direcciones permitidas
 *     · no_show     → solo venue_to_user (el cliente no apareció)
 *     · cancelled con cancelled_by='venue' → solo user_to_venue
 *                    (el cliente puede calificar al que lo cancela)
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
  if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
    return NextResponse.json({ error: 'Stars debe ser entero entre 1 y 5' }, { status: 400 })
  }
  if (direction !== 'user_to_venue' && direction !== 'venue_to_user') {
    return NextResponse.json({ error: 'Direction inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: reservation } = await admin
    .from('reservations')
    .select('id, venue_id, user_id, status, cancelled_by, guest_phone')
    .eq('id', reservation_id)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  // Validar permiso según la dirección
  if (direction === 'venue_to_user') {
    const { data: staff } = await admin
      .from('staff_users')
      .select('venue_id')
      .eq('id', user.id)
      .single()

    if (!staff || staff.venue_id !== reservation.venue_id) {
      return NextResponse.json({ error: 'Sin permisos sobre esta reserva' }, { status: 403 })
    }

    // Solo tiene sentido calificar a alguien que vino o que no vino
    if (reservation.status !== 'checked_in' && reservation.status !== 'no_show') {
      return NextResponse.json(
        { error: 'Sólo se puede calificar al comensal tras el check-in o no-show' },
        { status: 400 },
      )
    }
  } else {
    // user_to_venue
    if (reservation.user_id !== user.id) {
      return NextResponse.json({ error: 'Esta reserva no es tuya' }, { status: 403 })
    }
    // Permitimos rating si el cliente visitó, o si el venue lo canceló unilateralmente
    const visited = reservation.status === 'checked_in'
    const unilateralCancel =
      reservation.status === 'cancelled' && reservation.cancelled_by === 'venue'
    if (!visited && !unilateralCancel) {
      return NextResponse.json(
        { error: 'Solo podés calificar tras la visita o si el restaurante canceló' },
        { status: 400 },
      )
    }
  }

  const { data: rating, error: insertError } = await admin
    .from('ratings')
    .insert({
      reservation_id,
      venue_id: reservation.venue_id,
      user_id: direction === 'venue_to_user' ? reservation.user_id : null,
      guest_phone: direction === 'venue_to_user' ? reservation.guest_phone : null,
      direction,
      stars,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (insertError) {
    // 23505 = unique_violation → ya existe el rating en esa dirección
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: 'Ya calificaste esta reserva' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(rating, { status: 201 })
}
