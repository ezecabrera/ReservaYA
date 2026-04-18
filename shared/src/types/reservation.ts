export type ReservationStatus =
  | 'pending_payment'  // seña pendiente (timer 10 min activo)
  | 'confirmed'        // seña cobrada, reserva activa
  | 'checked_in'       // cliente llegó al local
  | 'cancelled'        // cancelada por el usuario
  | 'no_show'          // no llegó (15 min después de la hora)

/** Canal de origen. Las reservas cargadas desde el panel omiten el flujo de pago. */
export type ReservationSource = 'app' | 'panel' | 'walkin' | 'phone'

export interface Reservation {
  id: string
  venue_id: string
  table_id: string
  /** Null para walk-ins y llamadas cargadas a mano desde el panel. */
  user_id: string | null
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  time_slot: string
  party_size: number
  status: ReservationStatus
  /** JWT firmado con { reservation_id, venue_id, exp } */
  qr_token: string
  group_room_id: string | null
  source: ReservationSource
  /** Nombre visible cuando user_id es null. */
  guest_name: string | null
  guest_phone: string | null
  notes: string | null
  /** Quién canceló (si status = 'cancelled'). `venue` es unilateral. */
  cancelled_by: 'user' | 'venue' | 'system' | null
  /** Duración estimada en minutos — alimenta el ancho del bloque en Timeline view. */
  duration_minutes: number
  created_at: string
}

/** Payload aceptado por POST /api/reservas del panel. */
export interface ManualReservationInput {
  table_id: string
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  time_slot: string
  party_size: number
  guest_name: string
  guest_phone?: string
  notes?: string
  source?: Extract<ReservationSource, 'panel' | 'walkin' | 'phone'>
  /** Duración estimada en minutos. Default 90 si se omite. Rango válido: 15-480. */
  duration_minutes?: number
}

/** Payload del QR JWT — verificable sin DB, funciona offline */
export interface QRTokenPayload {
  reservation_id: string
  venue_id: string
  /** Unix timestamp — hora de reserva + 4 horas */
  exp: number
}

/** Reservation con datos relacionales para la UI */
export interface ReservationDetail extends Reservation {
  venue_name: string
  venue_address: string
  table_label: string
  user_name: string
  user_phone: string
}
