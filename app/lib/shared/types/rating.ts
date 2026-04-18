export type RatingDirection = 'user_to_venue' | 'venue_to_user'

/** Quién disparó la cancelación de una reserva. `venue` es UNILATERAL. */
export type CancelledBy = 'user' | 'venue' | 'system'

export type DisputeOutcome = 'upheld' | 'dismissed' | 'hidden'

export interface Rating {
  id: string
  reservation_id: string
  venue_id: string
  user_id: string | null
  guest_phone: string | null
  direction: RatingDirection
  stars: number
  comment: string | null
  disputed: boolean
  dispute_reason: string | null
  dispute_evidence: string | null
  dispute_created_at: string | null
  dispute_resolved_at: string | null
  dispute_outcome: DisputeOutcome | null
  hidden: boolean
  created_at: string
}

/** Payload aceptado por POST /api/ratings. */
export interface RatingInput {
  reservation_id: string
  direction: RatingDirection
  stars: number
  comment?: string
}

/** Agregado público visible en el perfil del venue. */
export interface VenueRatingStats {
  /** Promedio de estrellas (1.0-5.0) de ratings direction=user_to_venue. */
  avg_stars: number | null
  /** Cantidad total de ratings recibidos por el venue desde clientes. */
  total_ratings: number
  /**
   * Porcentaje de reservas canceladas unilateralmente por el venue en los
   * últimos 180 días sobre todas las reservas que fueron a algún estado
   * final (cancelled/no_show/checked_in) en ese mismo período.
   * Métrica pública — genera la disciplina del restaurante.
   */
  unilateral_cancel_pct: number | null
  /** Reservas contabilizadas en el cálculo anterior. */
  cancel_sample_size: number
}

/** Agregado que ve el restaurante sobre un comensal (CRM interno). */
export interface GuestRatingStats {
  avg_stars: number | null
  total_ratings: number
  recent_comments: Array<{
    stars: number
    comment: string | null
    date: string
    venue_id: string
  }>
}
