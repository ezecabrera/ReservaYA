import { createAdminClient } from '@/lib/supabase/server-admin'
import {
  buildCancelledByVenueRow,
  buildReservationLifecycle,
} from '@/lib/shared'
import type {
  EnqueueRow,
  NotificationReservationCtx,
} from '@/lib/shared/utils/notification'

/**
 * Lado "escritor" del outbox pattern: inserta filas pending en notifications.
 * Todo lo que llama a estas funciones NO bloquea — si falla la inserción,
 * solo logueamos. Nunca rompemos el flujo principal por un outbox caído.
 */

type AdminClient = ReturnType<typeof createAdminClient>

async function safeInsert(admin: AdminClient, rows: EnqueueRow[]) {
  if (rows.length === 0) return
  const { error } = await admin.from('notifications').insert(
    rows.map((r) => ({
      reservation_id: r.reservation_id,
      venue_id: r.venue_id,
      template_code: r.template_code,
      channel: r.channel,
      to_phone: r.to_phone,
      to_email: r.to_email,
      payload_json: r.payload_json,
      scheduled_at: r.scheduled_at,
      status: 'pending',
    })),
  )
  if (error) {
    // 23505 = unique_violation → la reserva ya tenía ese template encolado.
    // Es el camino feliz cuando un admin hace PATCH re-confirmando: ignoramos.
    const code = (error as { code?: string }).code
    if (code === '23505') return
    // eslint-disable-next-line no-console
    console.warn('[notifications:enqueue] insert failed:', error.message)
  }
}

export async function enqueueReservationLifecycle(
  admin: AdminClient,
  venue_id: string,
  ctx: NotificationReservationCtx,
) {
  await safeInsert(admin, buildReservationLifecycle(venue_id, ctx))
}

export async function enqueueCancelledByVenue(
  admin: AdminClient,
  venue_id: string,
  ctx: NotificationReservationCtx,
  reviewLink: string,
) {
  await safeInsert(admin, [buildCancelledByVenueRow(venue_id, ctx, reviewLink)])
}

/**
 * Helper de conveniencia: dado un reservation_id, arma el context y encola el
 * lifecycle. Se usa cuando el caller no tiene el venue_name cacheado.
 */
export async function enqueueLifecycleById(reservation_id: string) {
  const admin = createAdminClient()
  const { data: r } = await admin
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

  if (!r || !r.venues) return

  await enqueueReservationLifecycle(admin, r.venue_id, {
    id: r.id,
    date: r.date,
    time_slot: r.time_slot,
    party_size: r.party_size,
    user_name: r.users?.name ?? null,
    user_phone: r.users?.phone ?? null,
    guest_name: r.guest_name,
    guest_phone: r.guest_phone,
    venue_name: r.venues.name,
  })
}
