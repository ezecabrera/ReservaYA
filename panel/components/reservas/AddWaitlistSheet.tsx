'use client'

import { useState } from 'react'
import type { WaitlistInput } from '@/lib/shared'
import { mutateFetch } from '@/lib/panelFetch'

interface AddWaitlistSheetProps {
  onClose: () => void
  onCreated: () => void
}

/**
 * Sheet rápido para agregar a la espera. Optimizado para la situación real:
 * la puerta está llena, el host tiene que cargar al grupo en 15 segundos.
 */
export function AddWaitlistSheet({ onClose, onCreated }: AddWaitlistSheetProps) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = guestName.trim().length > 0 && partySize > 0

  async function handleSubmit() {
    if (!isValid || submitting) return
    setError(null)
    setSubmitting(true)

    const payload: WaitlistInput = {
      guest_name: guestName.trim(),
      party_size: partySize,
      guest_phone: guestPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    const res = await mutateFetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo agregar')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onCreated()
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
        <div className="px-6 pt-3 pb-4 border-b border-[var(--br)]">
          <div className="w-10 h-1 bg-sf2 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-[19px] text-tx">Agregar a la espera</p>
              <p className="text-tx2 text-[12.5px]">Para cuando el salón está lleno</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-sf flex items-center justify-center text-tx2"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          <label className="block">
            <span className="text-[12px] text-tx2 mb-1 block">Nombre *</span>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              autoFocus
              placeholder="Ej: Pareja González"
              className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                         text-[14px] text-tx outline-none focus:border-olive/55"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] text-tx2 mb-1 block">Teléfono</span>
              <input
                type="tel"
                inputMode="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+54 9 11…"
                className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                           text-[14px] text-tx outline-none focus:border-olive/55"
              />
            </label>
            <label className="block">
              <span className="text-[12px] text-tx2 mb-1 block">Personas</span>
              <div className="flex items-center bg-sf border border-[var(--br)] rounded-xl">
                <button
                  type="button"
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-10 h-12 text-tx text-[20px] font-bold"
                >−</button>
                <span className="flex-1 text-center font-display font-bold text-[16px] text-tx">
                  {partySize}
                </span>
                <button
                  type="button"
                  onClick={() => setPartySize(Math.min(40, partySize + 1))}
                  className="w-10 h-12 text-tx text-[20px] font-bold"
                >+</button>
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-[12px] text-tx2 mb-1 block">Notas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prefiere afuera, celíaco, cumpleaños…"
              rows={2}
              className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                         text-[14px] text-tx outline-none focus:border-olive/55 resize-none"
            />
          </label>

          {error && (
            <div className="rounded-xl bg-wine/10 border border-wine/28 px-4 py-3
                            text-[13px] text-wine">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pt-2 pb-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full rounded-xl bg-tx text-white font-bold text-[15px]
                       disabled:opacity-45 transition-opacity"
            style={{ height: '52px' }}
          >
            {submitting ? 'Guardando…' : 'Agregar a la espera'}
          </button>
        </div>
      </div>
    </div>
  )
}
