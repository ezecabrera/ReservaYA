import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enqueueLifecycleById } from '@/lib/notifications/enqueue'

/**
 * POST /api/reserva/[id]/confirmar-pago
 *
 * Llamada desde la página de confirmación después del redirect de MP.
 * Body: { status: 'approved'|'rejected'|'pending', payment_id: string }
 *
 * Si status=approved:
 *   - Actualiza Payment → approved + external_id
 *   - Actualiza Reservation → confirmed
 *   - Genera y guarda el qr_token JWT
 *   - Libera el TableLock de tipo 'payment'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const reservationId = params.id
    const body = await request.json() as {
      status: 'approved' | 'rejected' | 'pending'
      payment_id?: string
    }

    // Verificar que la reserva pertenece al usuario
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, venue_id, table_id, date, time_slot, status')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single()

    if (!reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    // Si ya está confirmada (doble submit), devolver ok
    if (reservation.status === 'confirmed') {
      return NextResponse.json({ ok: true, status: 'confirmed' })
    }

    if (body.status !== 'approved') {
      // Pago rechazado o pendiente — dejar la reserva en pending_payment
      await supabase
        .from('payments')
        .update({ status: body.status })
        .eq('reservation_id', reservationId)
        .eq('status', 'pending')

      return NextResponse.json({ ok: true, status: body.status })
    }

    // Generar el QR JWT server-side
    const { SignJWT } = await import('jose')
    const secret = new TextEncoder().encode(process.env.QR_JWT_SECRET!)
    const [year, month, day] = (reservation.date as string).split('-').map(Number)
    const [hour, minute] = (reservation.time_slot as string).split(':').map(Number)
    const reservationTime = new Date(year, month - 1, day, hour, minute)
    const exp = Math.floor(reservationTime.getTime() / 1000) + 4 * 3600

    const qrToken = await new SignJWT({
      reservation_id: reservationId,
      venue_id: reservation.venue_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(exp)
      .sign(secret)

    // Actualizar Payment, Reservation y liberar lock en una transacción
    await Promise.all([
      supabase
        .from('payments')
        .update({
          status: 'approved',
          external_id: body.payment_id ?? null,
        })
        .eq('reservation_id', reservationId)
        .eq('status', 'pending'),

      supabase
        .from('reservations')
        .update({ status: 'confirmed', qr_token: qrToken })
        .eq('id', reservationId),

      supabase
        .from('table_locks')
        .delete()
        .eq('table_id', reservation.table_id)
        .eq('type', 'payment'),
    ])

    // Outbox de notificaciones (WhatsApp lifecycle). No bloquea la respuesta.
    enqueueLifecycleById(reservationId).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[confirmar-pago] enqueue fail', err)
    })

    return NextResponse.json({ ok: true, status: 'confirmed', qr_token: qrToken })
  } catch (error) {
    console.error('[confirmar-pago/route]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
