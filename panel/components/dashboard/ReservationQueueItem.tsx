'use client'

import { NumericText } from '@/components/ui/NumericText'
import { GuestTagChip } from '@/components/crm/GuestTagChip'
import type { GuestTag } from '@/lib/shared'

/**
 * Card de una reserva en la cola lateral del dashboard.
 *
 * Diseño editorial:
 *  - Nombre en Fraunces serif (no bold cuadrado)
 *  - Hora en mono a la derecha
 *  - 1 línea secundaria: personas · mesa · zone
 *  - 1 chip de tag si corresponde
 *  - Draggable: el usuario agarra y arrastra a una mesa del canvas
 */

interface Props {
  id: string
  name: string
  time: string
  partySize: number
  tableLabel: string | null
  zoneLabel?: string | null
  status: 'pending_payment' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show'
  guestTag?: GuestTag | null
  notes?: string | null
  onClick?: () => void
  /** Notifica al padre que el drag arrancó — se usa para el preview flotante */
  onDragBegin?: (preview: { name: string; time: string; party: string }) => void
}

const STATUS_DOT: Record<Props['status'], string> = {
  pending_payment: 'bg-gold',
  confirmed:       'bg-[#9AAEE0]',
  checked_in:      'bg-olive',
  cancelled:       'bg-ink-text-3',
  no_show:         'bg-terracotta',
}

const STATUS_LABEL: Record<Props['status'], string> = {
  pending_payment: 'Pendiente',
  confirmed:       'Confirmada',
  checked_in:      'Check-in',
  cancelled:       'Cancelada',
  no_show:         'No-show',
}

export function ReservationQueueItem({
  id,
  name,
  onDragBegin,
  time,
  partySize,
  tableLabel,
  zoneLabel,
  status,
  guestTag,
  notes,
  onClick,
}: Props) {
  const canDrag = status === 'confirmed' || status === 'pending_payment'

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={canDrag}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/reservation-id', id)
        e.dataTransfer.setData('text/reservation-name', name)
        e.dataTransfer.setData('text/reservation-time', time)
        e.dataTransfer.setData('text/reservation-party', String(partySize))
        e.dataTransfer.effectAllowed = 'move'
        onDragBegin?.({ name, time, party: `${partySize}p` })
        // Ocultamos el ghost nativo — dibujamos un custom preview con cursor tracker
        const img = new Image()
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        e.dataTransfer.setDragImage(img, 0, 0)
      }}
      className={`group w-full text-left bg-ink-2 border border-ink-line rounded-xl
                  px-3.5 py-3 hover:border-ink-line-2 hover:bg-ink-3
                  transition-all duration-200
                  ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Línea principal: nombre + hora */}
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
          <p className="font-display text-[15px] text-ink-text leading-tight truncate">
            {name}
          </p>
        </div>
        <NumericText className="text-[12.5px] text-ink-text-2 flex-shrink-0">
          {time}
        </NumericText>
      </div>

      {/* Línea secundaria: meta info */}
      <div className="flex items-center gap-1.5 text-[11.5px] text-ink-text-3 ml-3.5">
        <span>
          <NumericText className="text-ink-text-2">{partySize}</NumericText>p
        </span>
        {tableLabel && (
          <>
            <span>·</span>
            <span>{tableLabel}</span>
          </>
        )}
        {zoneLabel && (
          <>
            <span>·</span>
            <span>{zoneLabel}</span>
          </>
        )}
        <span className="ml-auto text-[10.5px] uppercase tracking-[0.08em] font-bold">
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Tag + notes si hay */}
      {(guestTag || notes) && (
        <div className="mt-2 ml-3.5 flex items-center gap-2 flex-wrap">
          {guestTag && <GuestTagChip tag={guestTag} />}
          {notes && (
            <span className="text-[11px] text-ink-text-2 italic truncate">
              {notes}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
