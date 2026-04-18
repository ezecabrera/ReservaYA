'use client'

import { NumericText } from '@/components/ui/NumericText'

/**
 * Mesa como tile en el floor plan — v3 con left border stripe.
 *
 * Inspiración: CosyPOS reference (image 2). El borde vertical izquierdo de
 * 4px comunica el estado sin saturar el fill del card. Más elegante que
 * fills enteros coloreados.
 *
 * Estados:
 *  - available: fill ink-2 + sin stripe (transparente/muted)
 *  - reserved:  fill ink-2 + stripe olive-verde
 *  - occupied:  fill ink-2 + stripe gold-amarillo (checked-in)
 *
 * Esta aproximación permite ver 20+ mesas a la vez sin que el ojo se canse
 * de fills saturados como el v2.
 */

interface Props {
  label: string
  capacity: number
  status: 'available' | 'reserved' | 'occupied'
  reservationHolder?: string | null
  reservationTime?: string | null
  partySize?: number
  isDropTarget?: boolean
  /** Hay un drag activo en el dashboard y esta mesa está libre — pulse invitante */
  isDropInvite?: boolean
  onClick?: () => void
  onDrop?: (reservationId: string) => void
  onDragOver?: (e: React.DragEvent) => void
}

const STRIPE: Record<Props['status'], string> = {
  available: 'bg-transparent',
  reserved:  'bg-olive',
  occupied:  'bg-gold',
}

const STATUS_LABEL: Record<Props['status'], string> = {
  available: 'Libre',
  reserved:  'Reservada',
  occupied:  'Check-in',
}

export function TableTile({
  label,
  capacity,
  status,
  reservationHolder,
  reservationTime,
  partySize,
  isDropTarget,
  isDropInvite,
  onClick,
  onDrop,
  onDragOver,
}: Props) {
  const dropRing = isDropTarget
    ? 'ring-2 ring-wine-soft ring-offset-2 ring-offset-ink scale-[1.03] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.55)]'
    : ''

  // Pulse invitante sólo en mesas libres durante un drag activo, sin pisar
  // el estado "drop target" (que ya pulsa con ring hard).
  const inviteCls = isDropInvite && !isDropTarget ? 'drop-pulse' : ''

  const commonHandlers = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); onDragOver?.(e) },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      const id = e.dataTransfer.getData('text/reservation-id')
      if (id) onDrop?.(id)
    },
  }

  const hasReservation = (status === 'reserved' || status === 'occupied') && reservationHolder

  return (
    <button
      type="button"
      onClick={onClick}
      {...commonHandlers}
      className={`relative w-full aspect-[5/3] min-h-[100px] rounded-xl
                  bg-ink-2 border border-ink-line
                  flex flex-col justify-between p-3 text-left
                  hover:bg-ink-3 hover:border-ink-line-2
                  transition-all duration-200 active:scale-[0.98]
                  overflow-hidden ${dropRing} ${inviteCls}`}
    >
      {/* Border stripe izquierdo — 4px */}
      <span
        aria-hidden
        className={`absolute top-0 left-0 bottom-0 w-[4px] rounded-l-xl ${STRIPE[status]}`}
      />

      {/* Línea superior: mesa label + capacidad */}
      <div className="flex items-baseline justify-between gap-2 pl-1">
        <span className="font-display font-bold text-[16px] text-ink-text tracking-tight leading-none">
          {label}
        </span>
        <NumericText className="text-[10px] text-ink-text-3 font-bold uppercase tracking-wider">
          {capacity}p
        </NumericText>
      </div>

      {/* Contenido central según estado */}
      <div className="pl-1 min-w-0">
        {hasReservation ? (
          <div>
            <p className="text-[12.5px] font-semibold text-ink-text truncate leading-tight">
              {reservationHolder}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <NumericText className="text-[11px] text-ink-text-2">
                {reservationTime ?? '—'}
              </NumericText>
              {partySize !== undefined && (
                <>
                  <span className="text-ink-text-3 text-[10px]">·</span>
                  <span className="text-[11px] text-ink-text-2">
                    <NumericText>{partySize}</NumericText>p
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className={`text-[10.5px] font-bold uppercase tracking-[0.12em] ${
            status === 'available' ? 'text-olive' :
            status === 'reserved'  ? 'text-olive' :
            'text-gold'
          }`}>
            {STATUS_LABEL[status]}
          </p>
        )}
      </div>
    </button>
  )
}
