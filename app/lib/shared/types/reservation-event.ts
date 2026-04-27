/**
 * Reservation events: audit log inmutable de cambios en reservations.
 * Tabla: reservation_events. Migracion: 018.
 */

export type ReservationEventType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'table_changed'
  | 'time_changed'
  | 'party_size_changed'
  | 'tags_changed'
  | 'deleted'
  | 'check_in'
  | 'no_show'
  | 'cancelled'

export type ReservationEventActorType = 'customer' | 'staff' | 'system'

export interface ReservationEvent {
  id: string
  reservation_id: string
  venue_id: string
  actor_type: ReservationEventActorType
  actor_id: string | null
  actor_label: string
  event_type: ReservationEventType
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  created_at: string
}
