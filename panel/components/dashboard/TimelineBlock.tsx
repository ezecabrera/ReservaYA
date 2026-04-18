'use client'

import { NumericText } from '@/components/ui/NumericText'

/**
 * Bloque de reserva en el Timeline view — posicionado absolute con left/width
 * calculados por el parent según (time_slot, duration).
 *
 * Estados visuales:
 *   - confirmed: bg wine-soft translúcido + borde wine
 *   - checked_in: bg olive saturado (sólido, "ya están acá")
 *   - pending_payment: bg gold translúcido (pago pendiente)
 *
 * Draggable: el staff agarra el bloque y lo suelta en otra mesa del timeline
 * (row) — usamos el mismo event `text/reservation-id` que el sidebar.
 */

interface Props {
  id: string
  name: string
  time: string
  partySize: number
  status: 'pending_payment' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show'
  /** Left offset absoluto en px (calculado por el parent) */
  left: number
  /** Ancho absoluto en px (duración × col width) */
  width: number
  /** Altura de la row — para matchear height del block */
  height?: number
  onClick?: () => void
  onDragBegin?: (preview: { name: string; time: string; party: string }) => void
}

const STYLES: Record<Props['status'], { bg: string; border: string; text: string }> = {
  confirmed: {
    bg:     'bg-[#4F8A5F]/25',
    border: 'border-olive/55',
    text:   'text-ink-text',
  },
  checked_in: {
    bg:     'bg-olive',
    border: 'border-olive',
    text:   'text-white',
  },
  pending_payment: {
    bg:     'bg-gold/22',
    border: 'border-gold/50',
    text:   'text-ink-text',
  },
  cancelled: {
    bg:     'bg-ink-3/60',
    border: 'border-ink-line-2',
    text:   'text-ink-text-3 line-through',
  },
  no_show: {
    bg:     'bg-terracotta/18',
    border: 'border-terracotta/40',
    text:   'text-ink-text-2 line-through',
  },
}

export function TimelineBlock({
  id,
  name,
  time,
  partySize,
  status,
  left,
  width,
  height = 52,
  onClick,
  onDragBegin,
}: Props) {
  const s = STYLES[status]
  const canDrag = status === 'confirmed' || status === 'pending_payment' || status === 'checked_in'

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
        // Ocultar ghost nativo — mostramos preview flotante custom
        const img = new Image()
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
        e.dataTransfer.setDragImage(img, 0, 0)
      }}
      className={`absolute rounded-md border ${s.bg} ${s.border}
                  ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                  hover:brightness-110 hover:z-10
                  transition-all duration-150 overflow-hidden
                  flex flex-col justify-center items-start text-left
                  px-2 py-1`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 60)}px`,
        height: `${height - 6}px`,
        top: 3,
      }}
      title={`${name} · ${time} · ${partySize}p`}
    >
      <p className={`font-semibold text-[11px] leading-tight truncate w-full ${s.text}`}>
        {name}
      </p>
      <div className={`flex items-center gap-1.5 mt-0.5 ${s.text === 'text-white' ? 'text-white/85' : 'text-ink-text-2'}`}>
        <NumericText className="text-[10px]">{time}</NumericText>
        <span className="text-[9px] opacity-70">·</span>
        <NumericText className="text-[10px]">{partySize}p</NumericText>
      </div>
    </button>
  )
}
