'use client'

import { useState } from 'react'
import type { RatingInput } from '@/lib/shared'

interface RateVenueSheetProps {
  reservationId: string
  venueName: string
  /** Opcional: contexto (checked_in vs cancelación unilateral). */
  context?: 'visit' | 'unilateral_cancel'
  onClose: () => void
  onRated: () => void
}

/**
 * Sheet para que el comensal califique al restaurante después de la visita
 * o cuando el local canceló la reserva unilateralmente. Es PÚBLICO — entra
 * en el perfil del venue.
 */
export function RateVenueSheet({
  reservationId,
  venueName,
  context = 'visit',
  onClose,
  onRated,
}: RateVenueSheetProps) {
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (stars < 1 || submitting) return
    setError(null)
    setSubmitting(true)

    const payload: RatingInput = {
      reservation_id: reservationId,
      direction: 'user_to_venue',
      stars,
      comment: comment.trim() || undefined,
    }

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'No se pudo enviar')
        setSubmitting(false)
        return
      }
      setSubmitting(false)
      onRated()
    } catch {
      setError('Sin conexión — intentá más tarde')
      setSubmitting(false)
    }
  }

  const title = context === 'unilateral_cancel'
    ? 'Calificar tras la cancelación'
    : '¿Cómo estuvo tu visita?'
  const subtitle = context === 'unilateral_cancel'
    ? `${venueName} canceló tu reserva — tu opinión es pública`
    : `${venueName} · tu calificación es pública`

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full bg-white rounded-t-3xl
                   animate-[slideUp_0.28s_cubic-bezier(0.34,1.2,0.64,1)]"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-10 h-1 bg-sf2 rounded-full mx-auto mt-3 mb-4" />

        <div className="px-6 pb-1">
          <p className="font-display font-bold text-[19px] text-tx">{title}</p>
          <p className="text-tx2 text-[12.5px]">{subtitle}</p>
        </div>

        <div className="px-6 pt-6 pb-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover || stars) >= n
            return (
              <button
                key={n}
                type="button"
                aria-label={`${n} estrella${n !== 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setStars(n)}
                className="w-12 h-12 flex items-center justify-center
                           transition-transform active:scale-90"
              >
                <svg width="36" height="36" viewBox="0 0 24 24"
                  fill={filled ? '#E8B51A' : 'transparent'}
                  stroke={filled ? '#E8B51A' : 'rgba(0,0,0,0.25)'}
                  strokeWidth="2" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )
          })}
        </div>

        <div className="px-6">
          <label className="block">
            <span className="text-[12px] text-tx2 mb-1 block">
              Comentario <span className="text-tx3">(opcional, público)</span>
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={context === 'unilateral_cancel'
                ? 'Contá qué pasó con la cancelación…'
                : 'Qué te gustó, qué no, a quién se lo recomendarías…'}
              rows={3}
              className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                         text-[14px] text-tx outline-none focus:border-c2/60 resize-none"
            />
          </label>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-c1l border border-c1/30 px-4 py-3
                          text-[13px] text-[#C0313E]">
            {error}
          </div>
        )}

        <div className="px-6 pt-5 pb-2 space-y-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={stars === 0 || submitting}
            className="w-full rounded-xl bg-tx text-white font-bold text-[15px]
                       disabled:opacity-45 transition-opacity"
            style={{ height: '52px' }}
          >
            {submitting ? 'Enviando…' : stars === 0 ? 'Elegí una cantidad de estrellas' : 'Enviar calificación'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl text-tx2 text-[14px] font-semibold"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
