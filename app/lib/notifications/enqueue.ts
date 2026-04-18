import { createAdminClient } from '@/lib/supabase/server-admin'
import { buildReservationLifecycle } from '@/lib/shared'
import type { EnqueueRow, NotificationReservationCtx } from '@/lib/shared/utils/notification'

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
    const code = (error as { code?: string }).code
    if (code === '23505') return  // duplicado — ya estaba encolado
    // eslint-disable-next-line no-console
    console.warn('[notifications:enqueue]', error.message)
  }
}

/**
 * Encola el lifecycle de notificaciones para una reserva recién confirmada.
 * No bloquea: si falla la inserción, el flujo principal sigue.
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

  const ctx: NotificationReservationCtx = {
    id: r.id,
    date: r.date,
    time_slot: r.time_slot,
    party_size: r.party_size,
    user_name: r.users?.name ?? null,
    user_phone: r.users?.phone ?? null,
    guest_name: r.guest_name,
    guest_phone: r.guest_phone,
    venue_name: r.venues.name,
  }

  await safeInsert(admin, buildReservationLifecycle(r.venue_id, ctx))
}
