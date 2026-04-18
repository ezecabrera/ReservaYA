/**
 * Etiquetas automáticas calculadas desde el historial de reservas de un
 * comensal. Se muestran al host para que reconozca al cliente al llegar.
 *
 * Reglas (V1):
 *   - primera_vez:      sin reservas previas completadas
 *   - habitue:          3+ check-ins en total
 *   - vip:              6+ check-ins o party_size promedio >= 6
 *   - no_show_previo:   al menos 1 no-show en los últimos 90 días
 *   - regular_reciente: 2+ check-ins en los últimos 60 días
 */
export type GuestTag =
  | 'primera_vez'
  | 'habitue'
  | 'vip'
  | 'no_show_previo'
  | 'regular_reciente'

export interface GuestStats {
  /** Total de reservas en cualquier estado (incluye canceladas). */
  total_reservations: number
  /** Reservas que terminaron en check-in efectivo. */
  visits_completed: number
  /** Reservas que terminaron en no-show. */
  no_shows: number
  /** Reservas canceladas. */
  cancellations: number
  /** YYYY-MM-DD de la última visita completada, null si nunca visitó. */
  last_visit_date: string | null
  /** Promedio de personas por reserva (redondeado a 1 decimal). */
  avg_party_size: number
}

export interface GuestProfile {
  /** Clave estable: `user:<uuid>` o `phone:<+54..>` o `anon:<hash>`. */
  key: string
  /** user_id si el comensal tiene cuenta, null si es walk-in/llamada. */
  user_id: string | null
  name: string
  phone: string | null
  stats: GuestStats
  tags: GuestTag[]
  /** YYYY-MM-DD de la primera reserva registrada. */
  first_seen_date: string
}
