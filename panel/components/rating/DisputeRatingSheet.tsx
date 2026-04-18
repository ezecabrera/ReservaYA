'use client'

import { useState } from 'react'
import { mutateFetch } from '@/lib/panelFetch'

interface Props {
  ratingId: string
  stars: number
  comment: string | null
  /** Cuántas horas pasaron desde que se dejó la rating. Sirve para mostrar ventana restante. */
  ageHours: number
  onClose: () => void
  onDisputed: () => void
}

/**
 * Sheet de apelación de rating.
 *
 * Diseño minimalista — una sola acción (apelar) con motivo obligatorio.
 * La upload de evidencia (foto/captura) queda para V2 cuando haya Storage
 * configurado. Por ahora la URL se acepta pero opcional.
 */
export function DisputeRatingSheet({
  ratingId,
  stars,
  comment,
  ageHours,
  onClose,
  onDisputed,
}: Props) {
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hoursLeft = Math.max(0, Math.floor(72 - ageHours))
  const isLate = hoursLeft === 0

  async function handleSubmit() {
    if (reason.trim().length < 10 || submitting) return
    setError(null)
    setSubmitting(true)
    const res = await mutateFetch(`/api/ratings/${ratingId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim(), evidence: evidence.trim() || undefined }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo apelar')
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    onDisputed()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full bg-white rounded-t-3xl max-h-[92vh] flex flex-col
                   animate-[slideUp_0.28s_cubic-bezier(0.34,1.2,0.64,1)]"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <div className="w-10 h-1 bg-sf2 rounded-full mx-auto mt-3 mb-4" />

        <div className="px-6 pb-2">
          <p className="font-display font-bold text-[19px] text-tx">Apelar reseña</p>
          <p className="text-tx2 text-[12.5px]">
            {isLate
              ? 'La ventana de 72hs para apelar venció.'
              : `Te quedan ${hoursLeft}h para apelar · nuestro equipo revisa cada caso`}
          </p>
        </div>

        {/* Rating bajo disputa */}
        <div className="mx-6 mt-3 rounded-xl bg-sf border border-[var(--br)] p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <svg key={n} width="13" height="13" viewBox="0 0 24 24"
                  fill={n <= stars ? '#E8B51A' : 'rgba(0,0,0,0.12)'}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-[11px] text-tx3">de un cliente</span>
          </div>
          {comment && (
            <p className="text-tx2 text-[13px] mt-1.5 leading-snug italic">
              &ldquo;{comment}&rdquo;
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <label className="block">
            <span className="text-[12px] text-tx2 mb-1 block">
              Motivo de la apelación <span className="text-[#C0313E]">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLate}
              placeholder="Ej: El cliente nunca vino, no tiene información real sobre la experiencia. La reserva figura como no-show."
              rows={4}
              className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                         text-[14px] text-tx outline-none focus:border-olive/55 resize-none
                         disabled:opacity-50"
            />
            <p className="text-[10.5px] text-tx3 mt-1">
              {reason.length < 10 ? `${10 - reason.length} caracteres más para enviar` : `${reason.length} caracteres`}
            </p>
          </label>

          <label className="block">
            <span className="text-[12px] text-tx2 mb-1 block">
              Evidencia <span className="text-tx3">(link opcional a imagen o screenshot)</span>
            </span>
            <input
              type="url"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              disabled={isLate}
              placeholder="https://…"
              className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                         text-[13px] text-tx outline-none focus:border-olive/55
                         disabled:opacity-50"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-wine/10 border border-wine/28 px-4 py-3
                            text-[13px] text-wine">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pt-3 pb-2 border-t border-[var(--br)] space-y-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={reason.trim().length < 10 || isLate || submitting}
            className="w-full rounded-xl bg-tx text-white font-bold text-[15px]
                       disabled:opacity-45 transition-opacity"
            style={{ height: '52px' }}
          >
            {submitting ? 'Enviando…' : 'Apelar reseña'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl text-tx2 text-[13.5px] font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
