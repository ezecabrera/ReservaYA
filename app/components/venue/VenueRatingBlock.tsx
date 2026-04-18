import type { VenueRatingStats } from '@/lib/shared'

interface VenueRatingBlockProps {
  stats: VenueRatingStats
}

/**
 * Bloque público en el detalle del venue que muestra:
 *   - Promedio de estrellas con conteo de reviews
 *   - % de cancelaciones unilaterales del venue (último 180 días)
 *
 * La métrica de cancelaciones es diferenciador del producto: ningún
 * competidor local la muestra. Genera confianza y disciplina simultánea.
 */
export function VenueRatingBlock({ stats }: VenueRatingBlockProps) {
  const hasRatings = stats.avg_stars !== null
  const hasCancelData = stats.unilateral_cancel_pct !== null

  if (!hasRatings && !hasCancelData) return null

  const starsFloor = stats.avg_stars !== null ? Math.round(stats.avg_stars) : 0

  return (
    <div className="rounded-2xl border border-[var(--br)] bg-white p-4 space-y-3">
      {hasRatings && (
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-[28px] font-bold leading-none text-tx">
              {stats.avg_stars!.toFixed(1)}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= starsFloor
                return (
                  <svg key={n} width="13" height="13" viewBox="0 0 24 24"
                    fill={filled ? '#E8B51A' : 'rgba(0,0,0,0.12)'}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )
              })}
            </div>
          </div>
          <p className="text-tx2 text-[13px]">
            {stats.total_ratings} reseña{stats.total_ratings !== 1 ? 's' : ''} de clientes
          </p>
        </div>
      )}

      {hasCancelData && (
        <div className={`${hasRatings ? 'pt-3 border-t border-[var(--br)]' : ''}`}>
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] text-tx2 leading-tight">
              Cancelaciones del local <br />
              <span className="text-tx3 text-[11px]">últ. 180 días</span>
            </span>
            <span className={`font-display font-bold text-[18px] ${
              stats.unilateral_cancel_pct! >= 5
                ? 'text-c1'
                : stats.unilateral_cancel_pct! >= 2
                  ? 'text-c3'
                  : 'text-c2'
            }`}>
              {stats.unilateral_cancel_pct!.toFixed(1)}%
            </span>
          </div>
          {stats.unilateral_cancel_pct! < 2 && (
            <p className="text-[11px] text-tx3 mt-1.5">
              El local mantiene sus reservas.
            </p>
          )}
          {stats.unilateral_cancel_pct! >= 5 && (
            <p className="text-[11px] text-c1 mt-1.5">
              Cancela sus reservas con frecuencia — tenelo en cuenta.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
