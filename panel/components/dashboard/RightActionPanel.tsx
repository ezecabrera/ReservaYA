'use client'

import { useState } from 'react'
import type { ReservationStatus } from '@/lib/shared'
import { mutateFetch } from '@/lib/panelFetch'
import { NumericText } from '@/components/ui/NumericText'
import { GuestTagChip } from '@/components/crm/GuestTagChip'
import type { SplitReservation, SplitTable, SplitZone } from './SplitDashboard'

/**
 * Panel contextual derecho del dashboard — se monta como 3ra columna en desktop
 * cuando el staff selecciona una reserva (click en queue item o timeline block).
 *
 * En mobile/tablet no se renderiza; la interacción sigue siendo por ReservationActionSheet
 * bottom sheet (ya existente). Mantenemos ambos patrones coexistiendo para respetar
 * la ergonomía de cada breakpoint.
 *
 * Las CTAs disponibles dependen del estado actual de la reserva:
 *   - Check-in manual (confirmed → checked_in)
 *   - Calificar comensal (post contacto real — checked_in / no_show)
 *   - Editar (todos salvo cancelled)
 *   - Marcar no-show (confirmed)
 *   - Revertir (no_show / cancelled → confirmed)
 *   - Cancelar (todos salvo cancelled / no_show)
 */

interface Props {
  reservation: SplitReservation
  table: SplitTable | null
  zone: SplitZone | null
  displayName: (r: SplitReservation) => string
  onClose: () => void
  onEdit: () => void
  onRateGuest: () => void
  /** Refresh del padre después de cambios de estado */
  onUpdated: () => void
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending_payment: 'Pago pendiente',
  confirmed:       'Confirmada',
  checked_in:      'En mesa',
  cancelled:       'Cancelada',
  no_show:         'No-show',
}

const STATUS_ACCENT: Record<ReservationStatus, string> = {
  pending_payment: 'bg-gold',
  confirmed:       'bg-[#9AAEE0]',
  checked_in:      'bg-olive',
  cancelled:       'bg-ink-text-3',
  no_show:         'bg-terracotta',
}

export function RightActionPanel({
  reservation: r,
  table,
  zone,
  displayName,
  onClose,
  onEdit,
  onRateGuest,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const phone = r.guest_phone

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

  const canCheckIn   = r.status === 'confirmed'
  const canMarkNoShow = r.status === 'confirmed'
  const canCancel    = r.status !== 'cancelled' && r.status !== 'no_show'
  const canRevert    = r.status === 'no_show' || r.status === 'cancelled'
  const canEdit      = r.status !== 'cancelled'
  const canRate      = r.status === 'checked_in' || r.status === 'no_show'

  const name = displayName(r)
  const timeDisplay = r.time_slot.slice(0, 5)

  return (
    <aside
      key={r.id}
      className="hidden lg:flex w-[340px] xl:w-[360px] flex-shrink-0
                 border-l border-ink-line bg-ink flex-col overflow-hidden
                 panel-enter"
      aria-label="Detalle de reserva"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-ink-line">
        <div className="flex items-start justify-between gap-3 mb-3">
          <NumericText label tone="muted">Reserva</NumericText>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="w-7 h-7 -mt-1 -mr-1 rounded-md text-ink-text-3
                       hover:text-ink-text hover:bg-ink-2
                       flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-ink-2 border border-ink-line-2
                          flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-[15px] text-ink-text">
              {table?.label ?? '—'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[19px] text-ink-text leading-tight truncate">
              {name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_ACCENT[r.status]}`} />
              <span className="text-[11px] uppercase tracking-[0.08em] font-bold text-ink-text-2">
                {STATUS_LABEL[r.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MetaBlock label="Hora" value={timeDisplay} />
          <MetaBlock label="Personas" value={String(r.party_size)} />
          <MetaBlock label="Duración" value={`${r.duration_minutes || 90}m`} />
        </div>

        {(zone || phone) && (
          <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-text-3">
            {zone && (
              <span className="flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2l8 4v8c0 5-4 8-8 8s-8-3-8-8V6l8-4z"
                        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                {zone.name}
              </span>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="ml-auto flex items-center gap-1 hover:text-ink-text
                           transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M22 16.9v3a2 2 0 01-2.2 2A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.7.6 2.5a2 2 0 01-.5 2.1L8 9.5a16 16 0 006.5 6.5l1.2-1.2a2 2 0 012-.5c.8.3 1.6.5 2.5.6A2 2 0 0122 16.9z"
                        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <span className="font-mono">{phone}</span>
              </a>
            )}
          </div>
        )}

        {r.guest_tag && (
          <div className="mt-3">
            <GuestTagChip tag={r.guest_tag} />
          </div>
        )}
      </div>

      {/* Body scrollable: notes + error */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {r.notes && (
          <section>
            <NumericText label tone="muted" className="mb-1.5">Notas del host</NumericText>
            <p className="text-[13px] text-ink-text-2 leading-relaxed
                          bg-ink-2 border border-ink-line rounded-lg px-3.5 py-3">
              {r.notes}
            </p>
          </section>
        )}

        {error && (
          <div className="rounded-lg bg-wine/15 border border-wine/35 px-3.5 py-2.5
                          text-[12.5px] text-ink-text">
            {error}
          </div>
        )}

        {!r.notes && !error && (
          <p className="text-[12px] text-ink-text-3 italic">
            Sin notas para esta reserva.
          </p>
        )}
      </div>

      {/* CTAs sticky abajo */}
      <div className="px-4 pt-3 pb-4 border-t border-ink-line bg-ink space-y-2">
        {canCheckIn && (
          <ActionButton
            tone="primary"
            loading={loading === 'checkin'}
            disabled={loading !== null}
            onClick={() => patch({ status: 'checked_in' }, 'checkin')}
          >
            Hacer check-in
          </ActionButton>
        )}

        {canRate && (
          <ActionButton
            tone="accent"
            disabled={loading !== null}
            onClick={onRateGuest}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Calificar comensal
          </ActionButton>
        )}

        {canEdit && (
          <ActionButton tone="ghost" disabled={loading !== null} onClick={onEdit}>
            Editar reserva
          </ActionButton>
        )}

        {canMarkNoShow && (
          <ActionButton
            tone="ghost"
            loading={loading === 'noshow'}
            disabled={loading !== null}
            onClick={() => patch({ status: 'no_show' }, 'noshow')}
          >
            Marcar no-show
          </ActionButton>
        )}

        {canRevert && (
          <ActionButton
            tone="ghost"
            loading={loading === 'revert'}
            disabled={loading !== null}
            onClick={() => patch({ status: 'confirmed' }, 'revert')}
          >
            Revertir a confirmada
          </ActionButton>
        )}

        {canCancel && (
          <ActionButton
            tone="danger"
            loading={loading === 'cancel'}
            disabled={loading !== null}
            onClick={() => {
              if (confirm('¿Cancelar esta reserva? Se notificará al comensal.')) {
                patch({ status: 'cancelled' }, 'cancel')
              }
            }}
          >
            Cancelar reserva
          </ActionButton>
        )}
      </div>
    </aside>
  )
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-2 border border-ink-line px-2.5 py-2">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-text-3 mb-1">
        {label}
      </p>
      <NumericText className="text-[15px] text-ink-text leading-none font-semibold">
        {value}
      </NumericText>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  loading,
  tone,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  tone: 'primary' | 'accent' | 'ghost' | 'danger'
}) {
  const toneCls =
    tone === 'primary'
      ? 'bg-olive text-white hover:brightness-110 border border-olive'
      : tone === 'accent'
        ? 'bg-gold/20 text-gold border border-gold/45 hover:bg-gold/28'
        : tone === 'danger'
          ? 'bg-wine/20 text-wine-soft border border-wine/45 hover:bg-wine/30'
          : 'bg-ink-2 text-ink-text border border-ink-line-2 hover:bg-ink-3'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-11 rounded-lg ${toneCls}
                  font-semibold text-[13px]
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-150 active:scale-[0.98]`}
    >
      {loading ? 'Procesando…' : children}
    </button>
  )
}
