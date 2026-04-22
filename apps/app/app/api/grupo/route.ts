import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/grupo
 * Body: { reservation_id: string }
 * Crea o devuelve el group_room de la reserva. Requiere auth.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { reservation_id: string }
  if (!body.reservation_id) return NextResponse.json({ error: 'reservation_id requerido' }, { status: 400 })

  // Verificar que la reserva pertenece al usuario
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, group_room_id')
    .eq('id', body.reservation_id)
    .eq('user_id', user.id)
    .single()

  if (!reservation) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  // Si ya tiene room, devolverlo
  if (reservation.group_room_id) {
    const { data: existing } = await supabase
      .from('group_rooms')
      .select('link_token')
      .eq('id', reservation.group_room_id)
      .single()
    if (existing) return NextResponse.json({ link_token: existing.link_token })
  }

  // Crear room nuevo
  const { data: room, error } = await supabase
    .from('group_rooms')
    .insert({ reservation_id: body.reservation_id })
    .select()
    .single()

  if (error || !room) return NextResponse.json({ error: error?.message }, { status: 500 })

  // Vincular el room a la reserva
  await supabase
    .from('reservations')
    .update({ group_room_id: room.id })
    .eq('id', body.reservation_id)

  return NextResponse.json({ link_token: room.link_token })
}
