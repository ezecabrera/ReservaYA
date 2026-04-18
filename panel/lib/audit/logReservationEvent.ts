import type { createAdminClient } from '@/lib/supabase/server-admin'

export type ReservationEventType =
  | 'created'
  | 'confirmed'
  | 'checked_in'
  | 'cancelled'
  | 'no_show'
  | 'edited'
  | 'reverted'

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * Registra un evento de reserva en la tabla de audit trail.
 * Fire-and-forget: si falla, log warning pero nunca bloquea el flow principal.
 *
 * Graceful: si la tabla `reservation_events` no existe (migration 011 no
 * aplicada aún), silenciamos el error — la feature queda dark hasta aplicar.
 */
export async function logReservationEvent(
  admin: AdminClient,
  args: {
    reservation_id: string
    venue_id: string
    event_type: ReservationEventType
    actor_user_id?: string | null
    actor_role?: 'user' | 'staff' | 'system' | null
    diff_json?: unknown
    notes?: string | null
  },
): Promise<void> {
  try {
    const { error } = await admin.from('reservation_events').insert({
      reservation_id: args.reservation_id,
      venue_id: args.venue_id,
      event_type: args.event_type,
      actor_user_id: args.actor_user_id ?? null,
      actor_role: args.actor_role ?? null,
      diff_json: args.diff_json ?? null,
      notes: args.notes ?? null,
    })
    if (error && !error.message?.includes('does not exist')) {
      // eslint-disable-next-line no-console
      console.warn('[audit] logReservationEvent:', error.message)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[audit] logReservationEvent exception:', err)
  }
}

/** Utility: arma el diff_json entre dos objetos (claves superficiales). */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): { from: Partial<T>; to: Partial<T> } {
  const from: Partial<T> = {}
  const to: Partial<T> = {}
  for (const k of Object.keys(after) as (keyof T)[]) {
    if (after[k] !== undefined && after[k] !== before[k]) {
      ;(from as Record<string, unknown>)[k as string] = before[k]
      ;(to as Record<string, unknown>)[k as string] = after[k]
    }
  }
  return { from, to }
}
