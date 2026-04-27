/* UnToque · Helper para setear el actor en triggers de auditoría
 * de reservation_events.
 *
 * Uso típico antes de UPDATE/INSERT en reservations desde un endpoint staff:
 *
 *   const admin = createAdminClient()
 *   await setReservationActor(admin, user.id, staffUser.full_name ?? user.email, 'staff')
 *   await admin.from('reservations').update(patch).eq('id', id)
 *
 * El trigger del lado SQL lee estas variables vía `set_app_actor` para
 * estampar `actor_id`, `actor_label`, `actor_type` en reservation_events.
 *
 * TODO(migration): la function SQL `set_app_actor(p_actor_id, p_actor_label,
 *   p_actor_type)` debe existir en la DB. Si todavía no fue creada (el agent de
 *   migrations la deja como 019_audit_helpers.sql), este helper es un no-op
 *   silencioso — el trigger por default loguea actor_type='system'.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ActorType = 'customer' | 'staff' | 'system'

export async function setReservationActor(
  client: SupabaseClient,
  actorId: string,
  actorLabel: string,
  actorType: ActorType = 'staff',
): Promise<void> {
  try {
    await client.rpc('set_app_actor', {
      p_actor_id: actorId,
      p_actor_label: actorLabel,
      p_actor_type: actorType,
    })
  } catch {
    // Si la function no existe todavía, fallamos silenciosamente.
    // El trigger usa 'system' como fallback aceptable para v1.
  }
}
