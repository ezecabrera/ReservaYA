import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, clientKey } from '@/lib/rate-limit'

/**
 * POST /api/reviews
 * Body: { reservation_id: string, score: 1-5, comment?: string }
 *
 * Crea una reseña del usuario para el venue asociado a su reservación.
 * La RLS del DB aplica la regla: sólo funciona si la reservation pertenece
 * al user y está en status 'checked_in'.
 *
 * Devuelve 503 amigable si la migration 007 todavía no fue aplicada
 * (patron usado en endpoint /api/grupo/[token]/order para grupo menú).
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit({ key: clientKey(request, 'reviews-post'), limit: 3, windowSec: 60 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Esperá un momento para enviar otra reseña.' },
      { status: 429 },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as {
    reservation_id?: string
    score?: number
    comment?: string
  }

  const reservationId = body.reservation_id?.trim()
  const score = Number(body.score)
  const comment = body.comment?.trim() ?? ''

  if (!reservationId) {
    return NextResponse.json({ error: 'reservation_id requerido' }, { status: 400 })
  }
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: 'score debe ser entre 1 y 5' }, { status: 400 })
  }

  // Leer la reserva para obtener venue_id y validar ownership + estado
  const { data: reservation, error: resErr } = await supabase
    .from('reservations')
    .select('id, user_id, venue_id, status')
    .eq('id', reservationId)
    .single()

  if (resErr || !reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }
  if (reservation.user_id !== user.id) {
    return NextResponse.json({ error: 'Esta reserva no es tuya' }, { status: 403 })
  }
  if (reservation.status !== 'checked_in') {
    return NextResponse.json(
      { error: 'Sólo podés dejar reseña después de asistir a tu reserva.' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reservation_id: reservationId,
      user_id: user.id,
      venue_id: reservation.venue_id,
      score,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('does not exist') || msg.includes('column') || msg.includes('relation')) {
      return NextResponse.json(
        { error: 'Feature aún no disponible. Aplicá migration 007_reviews.sql.' },
        { status: 503 },
      )
    }
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json(
        { error: 'Ya dejaste una reseña para esta reserva.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
