'use client'

import { useState } from 'react'
import type { ReservationStatus, GuestTag } from '@/lib/shared'
import { mutateFetch } from '@/lib/panelFetch'
import { GuestTagChip } from '@/components/crm/GuestTagChip'

export interface ReservationRow {
  id: string
  status: ReservationStatus
  date: string
  time_slot: string
  party_size: number
  source?: 'app' | 'panel' | 'walkin' | 'phone'
  guest_name?: string | null
  guest_phone?: string | null
  notes?: string | null
  guest_tag?: GuestTag | null
  tables: { label: string } | null
  users: { name: string; phone?: string | null } | null
}

interface ReservationActionSheetProps {
  reservation: ReservationRow
  onClose: () => void
  onUpdated: () => void
  onEdit: () => void
  onRateGuest: () => void
}

function displayName(r: ReservationRow) {
  return r.users?.name ?? r.guest_name ?? 'Sin nombre'
}

function displayPhone(r: ReservationRow) {
  return r.users?.phone ?? r.guest_phone ?? null
}

/**
 * Sheet que se abre al tocar una reserva en la lista.
 * Muestra detalles + acciones disponibles según el estado actual.
 */
export function ReservationActionSheet({
  reservation: r,
  onClose,
  onUpdated,
  onEdit,
  onRateGuest,
}: ReservationActionSheetProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function patch(update: { status: ReservationStatus }, actionKey: string) {
    if (loading) return
    setError(null)
    setLoading(actionKey)
    const res = await mutateFetch(`/api/reservas/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo actualizar')
      setLoading(null)
      return
    }
    setLoading(null)
    onUpdated()
  }

  const canCheckIn = r.status === 'confirmed'
  const canMarkNoShow = r.status === 'confirmed'
  const canCancel = r.status !== 'cancelled' && r.status !== 'no_show'
  const canRevert = r.status === 'no_show' || r.status === 'cancelled'
  const canEdit = r.status !== 'cancelled'
  // Solo podemos calificar al comensal una vez que tuvimos contacto real
  const canRate = r.status === 'checked_in' || r.status === 'no_show'

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

        {/* Detalle */}
        <div className="px-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-sf flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-[16px] text-tx">
                {r.tables?.label ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold text-[17px] text-tx truncate">
                  {displayName(r)}
                </p>
                {r.guest_tag && <GuestTagChip tag={r.guest_tag} theme="light" />}
              </div>
              <p className="text-tx2 text-[13px]">
                {r.time_slot} hs · {r.party_size} persona{r.party_size !== 1 ? 's' : ''}
              </p>
              {displayPhone(r) && (
                <p className="text-tx3 text-[12px] mt-0.5">{displayPhone(r)}</p>
              )}
            </div>
          </div>

          {r.notes && (
            <div className="mt-4 rounded-xl bg-sf px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-tx3 mb-1">
                Notas del host
              </p>
              <p className="text-[13.5px] text-tx leading-snug">{r.notes}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-c1l border border-c1/30 px-4 py-3
                          text-[13px] text-[#C0313E]">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="px-6 pt-5 pb-2 space-y-2">
          {canCheckIn && (
            <button
              type="button"
              onClick={() => patch({ status: 'checked_in' }, 'checkin')}
              disabled={loading !== null}
              className="w-full h-13 rounded-xl bg-c2l border border-c2/30 text-[#0A9A72]
                         font-bold text-[14px] disabled:opacity-60"
              style={{ height: '50px' }}
            >
              {loading === 'checkin' ? 'Procesando…' : 'Hacer check-in manual'}
            </button>
          )}

          {canRate && (
            <button
              type="button"
              onClick={onRateGuest}
              disabled={loading !== null}
              className="w-full h-13 rounded-xl bg-c3l border border-c3/35 text-[#A66400]
                         font-bold text-[14px] disabled:opacity-60 flex items-center
                         justify-center gap-2"
              style={{ height: '50px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Calificar comensal
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={loading !== null}
              className="w-full h-13 rounded-xl bg-sf border border-[var(--br)] text-tx
                         font-semibold text-[14px] disabled:opacity-60"
              style={{ height: '50px' }}
            >
              Editar reserva
            </button>
          )}

          {canMarkNoShow && (
            <button
              type="button"
              onClick={() => patch({ status: 'no_show' }, 'noshow')}
              disabled={loading !== null}
              className="w-full h-13 rounded-xl bg-sf border border-[var(--br)] text-tx2
                         font-semibold text-[14px] disabled:opacity-60"
              style={{ height: '50px' }}
            >
              {loading === 'noshow' ? 'Procesando…' : 'Marcar como no-show'}
            </button>
          )}

          {canRevert && (
            <button
              type="button"
              onClick={() => patch({ status: 'confirmed' }, 'revert')}
              disabled={loading !== null}
              className="w-full h-13 rounded-xl bg-sf border border-[var(--br)] text-tx
                         font-semibold text-[14px] disabled:opacity-60"
              style={{ height: '50px' }}
            >
              {loading === 'revert' ? 'Procesando…' : 'Revertir a confirmada'}
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Cancelar esta reserva?')) {
                  patch({ status: 'cancelled' }, 'cancel')
                }
              }}
              disabled={loading !== null}
              className="w-full h-13 rounded-xl bg-c1l border border-c1/25 text-[#C0313E]
                         font-bold text-[14px] disabled:opacity-60"
              style={{ height: '50px' }}
            >
              {loading === 'cancel' ? 'Procesando…' : 'Cancelar reserva'}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl text-tx2 text-[14px] font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
