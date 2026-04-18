export type WaitlistStatus =
  | 'waiting'   // activo, esperando mesa
  | 'notified'  // se le avisó, timer manual del host
  | 'seated'    // sentado (resolved)
  | 'left'      // se fue sin esperar
  | 'expired'   // no se presentó tras la notificación

export interface WaitlistEntry {
  id: string
  venue_id: string
  guest_name: string
  guest_phone: string | null
  party_size: number
  /** YYYY-MM-DD — opcional si pidió un slot futuro específico */
  requested_date: string | null
  /** HH:MM — opcional */
  requested_time: string | null
  status: WaitlistStatus
  notes: string | null
  notified_at: string | null
  seated_at: string | null
  created_at: string
}

/** Payload aceptado por POST /api/waitlist del panel. */
export interface WaitlistInput {
  guest_name: string
  party_size: number
  guest_phone?: string
  notes?: string
  /** Opcionales — si se omiten, es walk-in inmediato. */
  requested_date?: string
  requested_time?: string
}
