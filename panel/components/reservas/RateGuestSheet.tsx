'use client'

import { useState } from 'react'
import { mutateFetch } from '@/lib/panelFetch'
import type { RatingInput } from '@/lib/shared'

interface RateGuestSheetProps {
  reservationId: string
  guestName: string
  onClose: () => void
  onRated: () => void
}

/**
 * Sheet interno del panel para calificar al comensal post check-in.
 * Privacidad: este rating NO es público. Alimenta el CRM del venue.
 * Diseño: 5 estrellas táctiles + comentario opcional. 10 segundos de uso.
 */
export function RateGuestSheet({
  reservationId,
  guestName,
  onClose,
  onRated,
}: RateGuestSheetProps) {
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
      direction: 'venue_to_user',
      stars,
      comment: comment.trim() || undefined,
    }

    const res = await mutateFetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo calificar')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onRated()
  }

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

        <div className="px-6 pb-2">
          <p className="font-display font-bold text-[19px] text-tx">
            Calificar al comensal
          </p>
          <p className="text-tx2 text-[12.5px]">
            {guestName} · solo vos vas a ver esto en el CRM
          </p>
        </div>

        {/* Stars */}
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
                  strokeWidth="2"
                  strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )
          })}
        </div>

        <div className="px-6">
          <label className="block">
            <span className="text-[12px] text-tx2 mb-1 block">
              Notas internas <span className="text-tx3">(opcional)</span>
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Gran cliente, habitual viernes. Tarda en llegar…"
              rows={3}
              className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                         text-[14px] text-tx outline-none focus:border-olive/55 resize-none"
            />
          </label>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-wine/10 border border-wine/28 px-4 py-3
                          text-[13px] text-wine">
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
            {submitting ? 'Guardando…' : stars === 0 ? 'Elegí una cantidad de estrellas' : 'Guardar calificación'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl text-tx2 text-[14px] font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
