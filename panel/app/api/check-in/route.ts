import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import type { QRTokenPayload } from '@/lib/shared'

/**
 * POST /api/check-in
 * Body: { token: string } — el JWT del QR
 *
 * 1. Verifica la firma y expiración del JWT
 * 2. Verifica que la reserva sea del venue del staff autenticado
 * 3. Actualiza reservation.status = 'checked_in' y table.is_occupied = true
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { token: string }
  if (!body.token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  // Verificar JWT
  let payload: QRTokenPayload
  try {
    const secret = new TextEncoder().encode(process.env.QR_JWT_SECRET!)
    const { payload: decoded } = await jwtVerify(body.token, secret)
    payload = decoded as unknown as QRTokenPayload
  } catch {
    return NextResponse.json({ error: 'QR inválido o vencido' }, { status: 400 })
  }

  // Verificar que el staff tiene permisos sobre este venue
  const { data: staffUser } = await supabase
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser || staffUser.venue_id !== payload.venue_id) {
    return NextResponse.json({ error: 'Sin permisos para este venue' }, { status: 403 })
  }

  // Obtener la reserva
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, table_id, status, users(name), time_slot')
    .eq('id', payload.reservation_id)
    .eq('venue_id', payload.venue_id)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  if (reservation.status === 'checked_in') {
    return NextResponse.json({ ok: true, message: 'Ya hizo check-in', already: true })
  }

  if (reservation.status !== 'confirmed') {
    return NextResponse.json({ error: 'La reserva no está confirmada' }, { status: 400 })
  }

  // Hacer el check-in
  await Promise.all([
    supabase
      .from('reservations')
      .update({ status: 'checked_in' })
      .eq('id', reservation.id),
    supabase
      .from('tables')
      .update({ is_occupied: true })
      .eq('id', reservation.table_id),
  ])

  const r = reservation as unknown as { id: string; users: { name: string } | null; time_slot: string }
  return NextResponse.json({
    ok: true,
    guest_name: r.users?.name ?? 'Cliente',
    time_slot: r.time_slot,
  })
}
