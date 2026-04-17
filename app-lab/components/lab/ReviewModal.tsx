'use client'

import { useState } from 'react'

/**
 * Modal para dejar reseña post-visita.
 *
 * SCAFFOLDING: por ahora guarda la reseña en localStorage + muestra
 * feedback. Próximo paso: crear tabla `reviews` en Supabase con
 * { reservation_id, user_id, venue_id, score, comment, photos[], created_at }
 * + endpoint POST /api/reviews + RLS permitir sólo si user_id matcheó
 * reservation.user_id y reservation.status === 'checked_in'.
 */

interface Props {
  open: boolean
  onClose: () => void
  reservation: {
    id: string
    venueName: string
    date: string
  }
  onSubmitted?: () => void
}

export function ReviewModal({ open, onClose, reservation, onSubmitted }: Props) {
  const [score, setScore] = useState(0)
  const [hoverScore, setHoverScore] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  async function handleSubmit() {
    if (score === 0) return
    setSubmitting(true)
    try {
      // Guardar en localStorage mientras no haya backend real
      const key = 'reservaya-reviews'
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]')
      existing.push({
        reservation_id: reservation.id,
        venue_name: reservation.venueName,
        score,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      })
      localStorage.setItem(key, JSON.stringify(existing))
      setDone(true)
      setTimeout(() => {
        onSubmitted?.()
        onClose()
        // Reset
        setScore(0); setComment(''); setDone(false); setSubmitting(false)
      }, 1500)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative bg-bg rounded-2xl w-full max-w-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-c2l flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="var(--c2)" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-display text-[20px] font-bold text-tx">¡Gracias por tu reseña!</p>
            <p className="text-[13px] text-tx2 mt-1">Ayudás a otros a elegir mejor.</p>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-sf flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M6 18L18 6" stroke="var(--tx2)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
              Dejá tu reseña
            </p>
            <h3 className="font-display text-[20px] font-bold text-tx mt-0.5 leading-tight">
              {reservation.venueName}
            </h3>
            <p className="text-[12px] text-tx2 mt-0.5">
              {new Date(reservation.date + 'T12:00:00').toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>

            {/* Estrellas */}
            <div className="mt-5 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hoverScore || score) >= n
                return (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    onMouseEnter={() => setHoverScore(n)}
                    onMouseLeave={() => setHoverScore(0)}
                    aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                    className="p-1 active:scale-90 transition-transform"
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24"
                         fill={active ? 'var(--c3)' : 'none'}
                         stroke={active ? 'var(--c3)' : 'var(--tx3)'}
                         strokeWidth="2" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                )
              })}
            </div>
            <p className="text-center text-[12px] text-tx3 mt-1 h-4">
              {(hoverScore || score) === 0 && 'Tocá las estrellas para calificar'}
              {(hoverScore || score) === 1 && 'No me gustó'}
              {(hoverScore || score) === 2 && 'Regular'}
              {(hoverScore || score) === 3 && 'Bueno'}
              {(hoverScore || score) === 4 && 'Muy bueno'}
              {(hoverScore || score) === 5 && '¡Excelente!'}
            </p>

            {/* Comment */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-tx3 uppercase tracking-wider mb-1.5">
                Contanos cómo fue (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="La comida, el servicio, el ambiente…"
                rows={3}
                maxLength={500}
                className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf px-3 py-2.5
                           text-[14px] text-tx outline-none resize-none
                           focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20"
              />
              <p className="text-[11px] text-tx3 text-right mt-1">{comment.length}/500</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={score === 0 || submitting}
              className="btn-primary mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Publicando…' : 'Publicar reseña'}
            </button>

            <p className="text-center text-[11px] text-tx3 mt-3">
              Solo podés reseñar lugares donde ya reservaste.
              Tu reseña se modera antes de publicarse.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
