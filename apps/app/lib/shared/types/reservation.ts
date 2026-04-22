export type ReservationStatus =
  | 'pending_payment'  // seña pendiente (timer 10 min activo)
  | 'confirmed'        // seña cobrada, reserva activa
  | 'checked_in'       // cliente llegó al local
  | 'cancelled'        // cancelada por el usuario
  | 'no_show'          // no llegó (15 min después de la hora)

export interface Reservation {
  id: string
  venue_id: string
  table_id: string
  user_id: string
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  time_slot: string
  party_size: number
  status: ReservationStatus
  /** JWT firmado con { reservation_id, venue_id, exp } */
  qr_token: string
  group_room_id: string | null
  created_at: string
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
