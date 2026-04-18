import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { enqueueCancelledByVenue } from '@/lib/notifications/enqueue'
import { logReservationEvent, diffFields } from '@/lib/audit/logReservationEvent'
import type { ReservationEventType } from '@/lib/audit/logReservationEvent'
import type { ReservationStatus } from '@/lib/shared'
import type { NotificationReservationCtx } from '@/lib/shared/utils/notification'

/** Carga el contexto para notifications a partir del id. */
async function loadNotificationCtx(
  admin: ReturnType<typeof createAdminClient>,
  reservation_id: string,
): Promise<{ ctx: NotificationReservationCtx; venue_id: string } | null> {
  const { data } = await admin
    .from('reservations')
    .select(`
      id, date, time_slot, party_size, venue_id,
      guest_name, guest_phone,
      users(name, phone),
      venues(name)
    `)
    .eq('id', reservation_id)
    .single() as {
      data: {
        id: string
        date: string
        time_slot: string
        party_size: number
        venue_id: string
        guest_name: string | null
        guest_phone: string | null
        users: { name: string | null; phone: string | null } | null
        venues: { name: string } | null
      } | null
    }

  if (!data || !data.venues) return null
  return {
    venue_id: data.venue_id,
    ctx: {
      id: data.id,
      date: data.date,
      time_slot: data.time_slot,
      party_size: data.party_size,
      user_name: data.users?.name ?? null,
      user_phone: data.users?.phone ?? null,
      guest_name: data.guest_name,
      guest_phone: data.guest_phone,
      venue_name: data.venues.name,
    },
  }
}

/**
 * PATCH /api/reservas/[id]
 * Permite al staff actualizar una reserva existente:
 *   - Transiciones de estado (check-in manual, cancelar, marcar no-show, revertir)
 *   - Editar mesa, horario, personas, notas, datos del guest
 *
 * Reglas:
 *   - Sólo se pueden mover reservas del venue del staff
 *   - Cambiar table_id o time_slot re-valida conflictos
 *   - party_size no puede exceder la capacidad de la mesa final
 *   - check-in pone la mesa en ocupada; cancelar la libera
 */

interface PatchBody {
  status?: ReservationStatus
  table_id?: string
  time_slot?: string
  date?: string
  party_size?: number
  notes?: string | null
  guest_name?: string
  guest_phone?: string | null
  duration_minutes?: number
}

const VALID_STATUSES: ReservationStatus[] = [
  'pending_payment',
  'confirmed',
  'checked_in',
  'cancelled',
  'no_show',
]

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  // Cargar reserva actual
  const { data: current } = await admin
    .from('reservations')
    .select('id, venue_id, table_id, date, time_slot, party_size, status')
    .eq('id', id)
    .single()

  if (!current || current.venue_id !== staffUser.venue_id) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  if (body.duration_minutes !== undefined) {
    if (
      !Number.isInteger(body.duration_minutes)
      || body.duration_minutes < 15
      || body.duration_minutes > 480
    ) {
      return NextResponse.json(
        { error: 'Duración inválida (debe estar entre 15 y 480 minutos)' },
        { status: 400 },
      )
    }
  }

  const next = {
    table_id:   body.table_id   ?? current.table_id,
    date:       body.date       ?? current.date,
    time_slot:  body.time_slot  ?? current.time_slot,
    party_size: body.party_size ?? current.party_size,
  }

  const tableChanged = next.table_id !== current.table_id
  const slotChanged  = next.time_slot !== current.time_slot || next.date !== current.date
  const sizeChanged  = next.party_size !== current.party_size

  // Validar capacidad si cambia mesa o personas
  if (tableChanged || sizeChanged) {
    const { data: table } = await admin
      .from('tables')
      .select('id, venue_id, capacity, is_active')
      .eq('id', next.table_id)
      .single()

    if (!table || table.venue_id !== staffUser.venue_id) {
      return NextResponse.json({ error: 'Mesa inexistente' }, { status: 404 })
    }
    if (!table.is_active) {
      return NextResponse.json({ error: 'Mesa inactiva' }, { status: 400 })
    }
    if (next.party_size > table.capacity) {
      return NextResponse.json(
        { error: `La mesa acepta hasta ${table.capacity} personas` },
        { status: 400 },
      )
    }
  }

  // Re-verificar conflicto si cambia mesa/fecha/horario
  if (tableChanged || slotChanged) {
    const { data: conflict } = await admin
      .from('reservations')
      .select('id')
      .eq('table_id', next.table_id)
      .eq('date', next.date)
      .eq('time_slot', next.time_slot)
      .in('status', ['confirmed', 'checked_in', 'pending_payment'])
      .neq('id', id)
      .maybeSingle()

    if (conflict) {
      return NextResponse.json(
        { error: 'Ya existe una reserva en esa mesa y horario' },
        { status: 409 },
      )
    }
  }

  // Construir update
  const update: Record<string, unknown> = {}
  if (body.status)                       update.status      = body.status
  if (body.table_id)                     update.table_id    = body.table_id
  if (body.date)                         update.date        = body.date
  if (body.time_slot)                    update.time_slot   = body.time_slot
  if (body.party_size !== undefined)     update.party_size  = body.party_size
  if (body.notes !== undefined)          update.notes       = body.notes
  if (body.guest_name)                   update.guest_name  = body.guest_name.trim()
  if (body.guest_phone !== undefined)    update.guest_phone = body.guest_phone?.trim() || null
  if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes

  // Si la transición es a 'cancelled' desde el panel, marcar como unilateral.
  // Esta es la señal que alimenta el % público de cancelaciones del venue.
  if (body.status === 'cancelled') update.cancelled_by = 'venue'

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await admin
    .from('reservations')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Side-effects sobre la mesa según el nuevo estado
  if (body.status === 'checked_in') {
    await admin.from('tables').update({ is_occupied: true }).eq('id', next.table_id)
  } else if (body.status === 'cancelled' || body.status === 'no_show') {
    // Liberar mesa si estaba ocupada por esta reserva (si el check-in ya había ocurrido)
    if (current.status === 'checked_in') {
      await admin.from('tables').update({ is_occupied: false }).eq('id', current.table_id)
    }
  }

  // Notificar cancelación unilateral al cliente (WhatsApp)
  if (body.status === 'cancelled' && current.status !== 'cancelled') {
    const notifCtx = await loadNotificationCtx(admin, id)
    if (notifCtx) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const reviewLink = `${appUrl}/mis-reservas?rate=${id}`
      enqueueCancelledByVenue(admin, notifCtx.venue_id, notifCtx.ctx, reviewLink).catch(() => {})
    }
  }

  // ─── Audit trail ───────────────────────────────────────────────────────
  const stateChanged = body.status && body.status !== current.status

  if (stateChanged) {
    // Map status → event_type
    const eventMap: Record<string, ReservationEventType | null> = {
      checked_in: 'checked_in',
      cancelled:  'cancelled',
      no_show:    'no_show',
      confirmed:  'reverted',
      pending_payment: null,
    }
    const evt = eventMap[body.status!]
    if (evt) {
      logReservationEvent(admin, {
        reservation_id: id,
        venue_id: current.venue_id,
        event_type: evt,
        actor_user_id: user.id,
        actor_role: 'staff',
      })
    }
  }

  // Eventos 'edited' cuando cambia mesa/fecha/horario/personas sin cambio de estado
  const editedFields = diffFields(
    {
      table_id:   current.table_id,
      date:       current.date,
      time_slot:  current.time_slot,
      party_size: current.party_size,
    },
    {
      table_id:   body.table_id,
      date:       body.date,
      time_slot:  body.time_slot,
      party_size: body.party_size,
    },
  )
  if (Object.keys(editedFields.to).length > 0) {
    logReservationEvent(admin, {
      reservation_id: id,
      venue_id: current.venue_id,
      event_type: 'edited',
      actor_user_id: user.id,
      actor_role: 'staff',
      diff_json: editedFields,
    })
  }

  return NextResponse.json(updated)
}

/**
 * DELETE /api/reservas/[id]
 * Cancela la reserva (soft-cancel via status='cancelled'). No borra físicamente
 * para preservar el historial del CRM y las métricas.
 */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id')
    .eq('id', user.id)
    .single()

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const { data: current } = await admin
    .from('reservations')
    .select('id, venue_id, table_id, status')
    .eq('id', id)
    .single()

  if (!current || current.venue_id !== staffUser.venue_id) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  if (current.status === 'cancelled') {
    return NextResponse.json({ ok: true, already: true })
  }

  // DELETE desde el panel = cancelación unilateral del venue
  await admin
    .from('reservations')
    .update({ status: 'cancelled', cancelled_by: 'venue' })
    .eq('id', id)

  // Si estaba ocupando mesa, liberar
  if (current.status === 'checked_in') {
    await admin.from('tables').update({ is_occupied: false }).eq('id', current.table_id)
  }

  // Notificar al cliente por WhatsApp (+ link a reseña)
  const notifCtx = await loadNotificationCtx(admin, id)
  if (notifCtx) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const reviewLink = `${appUrl}/mis-reservas?rate=${id}`
    enqueueCancelledByVenue(admin, notifCtx.venue_id, notifCtx.ctx, reviewLink).catch(() => {})
  }

  // Audit trail
  logReservationEvent(admin, {
    reservation_id: id,
    venue_id: current.venue_id,
    event_type: 'cancelled',
    actor_user_id: user.id,
    actor_role: 'staff',
    notes: 'Cancelación unilateral del venue',
  })

  return NextResponse.json({ ok: true })
}
