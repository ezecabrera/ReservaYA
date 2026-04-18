import type { VenueRatingStats } from '../types/rating'

/** Ventana de tiempo usada para calcular el % de cancelaciones unilaterales. */
const CANCEL_WINDOW_DAYS = 180

export interface RatingRow {
  stars: number
  hidden?: boolean
}

export interface CancelSampleRow {
  status: string
  cancelled_by: string | null
  /** ISO date YYYY-MM-DD */
  date: string
}

/**
 * Computa el agregado público de ratings + cancelaciones unilaterales
 * a partir de rows de DB ya filtradas por venue.
 *
 * La métrica que pesa: `unilateral_cancel_pct` = cancelaciones con
 * cancelled_by='venue' / (reservas con estado final) en los últimos 180 días.
 */
export function computeVenueRatingStats(
  ratings: RatingRow[],
  recentReservations: CancelSampleRow[],
  now: Date = new Date(),
): VenueRatingStats {
  const visibleRatings = ratings.filter((r) => r.hidden !== true)

  const avg =
    visibleRatings.length === 0
      ? null
      : visibleRatings.reduce((acc, r) => acc + r.stars, 0) / visibleRatings.length

  // Reservas con "estado final" dentro de la ventana: checked_in, cancelled, no_show
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - CANCEL_WINDOW_DAYS)
  const cutoffIso = cutoff.toISOString().slice(0, 10)

  const sample = recentReservations.filter((r) => {
    if (r.date < cutoffIso) return false
    return r.status === 'checked_in' || r.status === 'cancelled' || r.status === 'no_show'
  })

  const unilateralCancels = sample.filter(
    (r) => r.status === 'cancelled' && r.cancelled_by === 'venue',
  ).length

  const pct = sample.length === 0
    ? null
    : Math.round((unilateralCancels / sample.length) * 1000) / 10 // 1 decimal

  return {
    avg_stars: avg === null ? null : Math.round(avg * 10) / 10,
    total_ratings: visibleRatings.length,
    unilateral_cancel_pct: pct,
    cancel_sample_size: sample.length,
  }
}
