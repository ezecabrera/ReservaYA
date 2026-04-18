'use client'

import { useCallback, useMemo, useState } from 'react'
import { NumericText } from '@/components/ui/NumericText'
import { TimelineBlock } from './TimelineBlock'
import type { SplitReservation, SplitTable, SplitZone } from './SplitDashboard'

/**
 * Timeline view — matriz mesa (rows) × hora (cols) con bloques de reserva
 * posicionados absolute según (time_slot, duration).
 *
 * Inspiración: CosyPOS reference (image 1). Le da al staff la vista completa
 * del día: cuándo hay huecos, qué solapamientos, cuándo el salón se llena.
 *
 * Layout:
 *   - Sticky top: hour labels (00:30 slots entre OPEN_HOUR y CLOSE_HOUR)
 *   - Sticky left: table labels (Bar, A1, A2, ...)
 *   - Grid central scrollable horizontal
 *   - Reservations como TimelineBlock posicionados absolute
 *
 * Drag & drop:
 *   - Click empty cell → abrir new-reservation con table/time prefilled
 *   - Drag block → mover entre mesas (cambia row)
 */

// Constantes visuales
const ROW_HEIGHT = 54
const LABEL_WIDTH = 84
const HEADER_HEIGHT = 32
const COL_WIDTH = 60  // cada 30 min
const SLOT_MINUTES = 30
const FALLBACK_DURATION_MIN = 90 // para reservas legacy sin duration_minutes
const START_MIN = 12 * 60  // 12:00
const END_MIN = 24 * 60    // 00:00 (medianoche)

interface Props {
  tables: SplitTable[]
  zones: SplitZone[]
  reservations: SplitReservation[]
  displayName: (r: SplitReservation) => string
  /** Callback cuando se clickea una celda vacía — pasa mesa + hora prefilled */
  onEmptyCellClick?: (tableId: string, timeSlot: string) => void
  /**
   * Callback cuando se drag-drop una reserva.
   * `newTimeSlot` se pasa cuando el drop en Timeline también reprograma la hora
   * (cambio horizontal). Si sólo cambió la mesa, `newTimeSlot` es null.
   */
  onReassign?: (
    reservationId: string,
    newTableId: string,
    newTimeSlot: string | null,
  ) => void
  /** Notifica al padre que el drag arrancó — para el preview flotante */
  onDragBegin?: (preview: { name: string; time: string; party: string }) => void
  /** Click en un bloque existente — abre el detalle de la reserva */
  onReservationClick?: (reservationId: string) => void
  /** Hora actual — dibuja una línea vertical marker */
  now?: Date
}

function timeToMin(slot: string): number {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minToSlot(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function TimelineView({
  tables,
  zones,
  reservations,
  displayName,
  onEmptyCellClick,
  onReassign,
  onDragBegin,
  onReservationClick,
  now = new Date(),
}: Props) {
  const [hoveredCell, setHoveredCell] = useState<{ tableId: string; col: number } | null>(null)

  // Generar columnas (cada 30 min)
  const columns = useMemo(() => {
    const cols: { min: number; label: string; isHourStart: boolean }[] = []
    for (let m = START_MIN; m < END_MIN; m += SLOT_MINUTES) {
      cols.push({ min: m, label: minToSlot(m), isHourStart: m % 60 === 0 })
    }
    return cols
  }, [])

  const totalWidth = columns.length * COL_WIDTH
  const gridWidth = totalWidth + LABEL_WIDTH

  // Mapa table_id → { zone, index } para agrupar tables por zona
  const zoneById = useMemo(
    () => new Map(zones.map((z) => [z.id, z])),
    [zones],
  )

  // Ordenar tables: primero por zona, luego por position_order
  const orderedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const za = a.zone_id ?? ''
      const zb = b.zone_id ?? ''
      if (za !== zb) return za.localeCompare(zb)
      return a.position_order - b.position_order
    })
  }, [tables])

  // Reservas confirmadas/checked_in/pending del día, agrupadas por table_id
  const reservationsByTable = useMemo(() => {
    const map = new Map<string, SplitReservation[]>()
    for (const r of reservations) {
      if (r.status === 'cancelled' || r.status === 'no_show') continue
      const list = map.get(r.table_id) ?? []
      list.push(r)
      map.set(r.table_id, list)
    }
    return map
  }, [reservations])

  // Línea "ahora" — posición X según la hora actual
  const nowLineLeft = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes()
    if (nowMin < START_MIN || nowMin > END_MIN) return null
    return LABEL_WIDTH + ((nowMin - START_MIN) / SLOT_MINUTES) * COL_WIDTH
  }, [now])

  const handleCellClick = useCallback(
    (tableId: string, col: number) => {
      const timeMin = START_MIN + col * SLOT_MINUTES
      onEmptyCellClick?.(tableId, minToSlot(timeMin))
    },
    [onEmptyCellClick],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, tableId: string) => {
      e.preventDefault()
      const reservationId = e.dataTransfer.getData('text/reservation-id')
      if (!reservationId) return

      // Calcular el nuevo time_slot según la posición X del drop relativa a la
      // row. clientX - bounding.left da el offset dentro del área de celdas
      // (ya excluye el label sticky izquierdo). Snap a slot de 30 min.
      const bounding = e.currentTarget.getBoundingClientRect()
      const offsetX = e.clientX - bounding.left
      let newTimeSlot: string | null = null
      if (offsetX >= 0) {
        const rawCol = Math.floor(offsetX / COL_WIDTH)
        const clampedCol = Math.max(0, Math.min(rawCol, (END_MIN - START_MIN) / SLOT_MINUTES - 1))
        const newMin = START_MIN + clampedCol * SLOT_MINUTES
        newTimeSlot = minToSlot(newMin)
      }
      onReassign?.(reservationId, tableId, newTimeSlot)
    },
    [onReassign],
  )

  return (
    <div className="relative flex-1 overflow-auto bg-ink border border-ink-line rounded-xl">
      <div
        className="relative"
        style={{ width: `${gridWidth}px`, minHeight: `${HEADER_HEIGHT + orderedTables.length * ROW_HEIGHT}px` }}
      >
        {/* ───────────────────── HEADER (sticky top) ───────────────────── */}
        <div
          className="sticky top-0 z-20 bg-ink border-b border-ink-line flex"
          style={{ height: `${HEADER_HEIGHT}px` }}
        >
          {/* Esquina vacía (intersección sticky-top y sticky-left) */}
          <div
            className="sticky left-0 z-30 bg-ink border-r border-ink-line flex-shrink-0"
            style={{ width: `${LABEL_WIDTH}px` }}
          />
          {/* Hour labels */}
          {columns.map((col, i) => (
            <div
              key={col.min}
              className={`flex items-center border-r border-ink-line-2/50
                          ${col.isHourStart ? 'text-ink-text-2' : 'text-ink-text-3'}
                          ${i === 0 ? 'border-l-0' : ''}`}
              style={{ width: `${COL_WIDTH}px`, height: '100%' }}
            >
              {col.isHourStart && (
                <NumericText className="text-[11px] pl-1.5 font-medium">
                  {col.label}
                </NumericText>
              )}
            </div>
          ))}
        </div>

        {/* ───────────────────── ROWS (mesa × hora) ───────────────────── */}
        {orderedTables.map((table) => {
          const reservationsInRow = reservationsByTable.get(table.id) ?? []
          const zone = table.zone_id ? zoneById.get(table.zone_id) : null

          return (
            <div
              key={table.id}
              className="flex relative border-b border-ink-line"
              style={{ height: `${ROW_HEIGHT}px` }}
            >
              {/* Sticky left — table label */}
              <div
                className="sticky left-0 z-10 bg-ink border-r border-ink-line
                           flex flex-col justify-center px-3 flex-shrink-0"
                style={{ width: `${LABEL_WIDTH}px` }}
              >
                <span className="font-display font-bold text-[14px] text-ink-text leading-none">
                  {table.label}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <NumericText className="text-[10px] text-ink-text-3">
                    {table.capacity}p
                  </NumericText>
                  {zone && (
                    <span className="text-[10px] text-ink-text-3 truncate">
                      · {zone.prefix}
                    </span>
                  )}
                </div>
              </div>

              {/* Celdas (clickables para crear reserva + drop target) */}
              <div
                className="flex relative flex-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, table.id)}
              >
                {columns.map((col, i) => (
                  <button
                    type="button"
                    key={col.min}
                    onClick={() => handleCellClick(table.id, i)}
                    onMouseEnter={() => setHoveredCell({ tableId: table.id, col: i })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-full flex-shrink-0 transition-colors
                                hover:bg-wine/10
                                ${col.isHourStart ? 'border-r border-ink-line-2/60' : 'border-r border-ink-line'}
                                ${hoveredCell?.tableId === table.id && hoveredCell?.col === i
                                  ? 'bg-wine/12'
                                  : ''}`}
                    style={{ width: `${COL_WIDTH}px` }}
                    aria-label={`Crear reserva ${table.label} ${col.label}`}
                  />
                ))}

                {/* Reservation blocks posicionados absolute */}
                {reservationsInRow.map((r) => {
                  const startMin = timeToMin(r.time_slot)
                  if (startMin < START_MIN || startMin >= END_MIN) return null
                  const left = ((startMin - START_MIN) / SLOT_MINUTES) * COL_WIDTH
                  const widthMin = r.duration_minutes || FALLBACK_DURATION_MIN
                  const width = (widthMin / SLOT_MINUTES) * COL_WIDTH

                  return (
                    <TimelineBlock
                      key={r.id}
                      id={r.id}
                      name={displayName(r)}
                      time={r.time_slot.slice(0, 5)}
                      partySize={r.party_size}
                      status={r.status}
                      left={left}
                      width={width}
                      height={ROW_HEIGHT}
                      onDragBegin={onDragBegin}
                      onClick={onReservationClick ? () => onReservationClick(r.id) : undefined}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Línea "ahora" — marca roja vertical */}
        {nowLineLeft !== null && (
          <div
            aria-hidden
            className="absolute top-0 bottom-0 pointer-events-none z-[15]"
            style={{ left: `${nowLineLeft}px` }}
          >
            <div className="w-px h-full bg-wine-soft/80 shadow-[0_0_8px_rgba(161,49,67,0.6)]" />
            <div className="absolute -top-1 -left-[4px] w-2 h-2 rounded-full bg-wine-soft
                            shadow-[0_0_10px_rgba(161,49,67,0.8)]" />
          </div>
        )}
      </div>
    </div>
  )
}
