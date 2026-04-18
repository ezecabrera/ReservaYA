'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GuestTag } from '@/lib/shared'
import { ServiceHeader } from '@/components/ui/ServiceHeader'
import { NumericText } from '@/components/ui/NumericText'
import { TableTile } from './TableTile'
import { ReservationQueueItem } from './ReservationQueueItem'
import { TimelineView } from './TimelineView'
import { RightActionPanel } from './RightActionPanel'
import {
  ReservationActionSheet,
  type ReservationRow,
} from '@/components/reservas/ReservationActionSheet'
import { EditReservationSheet } from '@/components/reservas/EditReservationSheet'
import { RateGuestSheet } from '@/components/reservas/RateGuestSheet'
import { mutateFetch } from '@/lib/panelFetch'

/** Datos del preview card que flota con el cursor durante el drag. */
interface DragPreview {
  name: string
  time: string
  party: string
}

export interface SplitTable {
  id: string
  label: string
  capacity: number
  is_occupied: boolean
  zone_id: string | null
  position_order: number
}

export interface SplitZone {
  id: string
  name: string
  prefix: string
}

export interface SplitReservation {
  id: string
  status: 'pending_payment' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show'
  time_slot: string
  party_size: number
  table_id: string
  guest_name: string | null
  guest_phone: string | null
  notes: string | null
  /** Duración estimada en minutos — controla el ancho del bloque en Timeline. */
  duration_minutes: number
  guest_tag: GuestTag | null
  user_name: string | null
}

interface Props {
  venueName: string
  date: string
  mode: 'pre_service' | 'active_service' | 'closed'
  shiftLabel: string | null
  zones: SplitZone[]
  tables: SplitTable[]
  reservations: SplitReservation[]
}

type SlotBucket = { key: string; items: SplitReservation[] }

/**
 * Dashboard operativo — split view editorial.
 *
 *   Sidebar izquierdo (360px fijo en desktop):
 *     - Search por nombre/teléfono
 *     - Cola agrupada por turno ordenada por hora
 *     - Tags de estado
 *
 *   Canvas derecho (fluid):
 *     - Zones tabs (Salón / Terraza / Patio)
 *     - Grid de mesas con drag-drop targets
 *     - Cada mesa es un TableTile
 *
 * Drag: el staff agarra una reserva del sidebar y la suelta sobre una mesa
 * del canvas. Dispara PATCH /api/reservas/[id] con el nuevo table_id.
 */
export function SplitDashboard({
  venueName,
  date,
  mode,
  shiftLabel,
  zones,
  tables,
  reservations: initialReservations,
}: Props) {
  const [reservations, setReservations] = useState(initialReservations)
  const [localTables, setLocalTables] = useState(tables)
  const [search, setSearch] = useState('')
  const [activeZone, setActiveZone] = useState<string | null>(
    zones.length > 0 ? zones[0].id : null,
  )
  /** Vista del canvas principal: 'floor' (grid espacial) | 'timeline' (matriz mesa × hora) */
  const [view, setView] = useState<'floor' | 'timeline'>('floor')
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)

  // Selección de reserva — alimenta el RightActionPanel (desktop) o el
  // ReservationActionSheet (mobile/tablet). Un único state sirve a ambos.
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null)
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null)
  const [ratingReservationId, setRatingReservationId] = useState<string | null>(null)
  const dragPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const previewElRef = useRef<HTMLDivElement | null>(null)

  // Tracker global de cursor mientras hay un drag activo.
  // Posicionamos el preview via transform para que responda fluido (no repinta).
  useEffect(() => {
    if (!dragPreview) return

    const handleMove = (e: DragEvent) => {
      dragPosRef.current = { x: e.clientX, y: e.clientY }
      if (previewElRef.current) {
        previewElRef.current.style.transform =
          `translate3d(${e.clientX + 16}px, ${e.clientY - 30}px, 0) rotate(-4deg)`
      }
    }
    const handleEnd = () => {
      setDragPreview(null)
      setDropTargetId(null)
    }

    window.addEventListener('dragover', handleMove)
    window.addEventListener('dragend', handleEnd)
    window.addEventListener('drop', handleEnd)
    return () => {
      window.removeEventListener('dragover', handleMove)
      window.removeEventListener('dragend', handleEnd)
      window.removeEventListener('drop', handleEnd)
    }
  }, [dragPreview])

  const router = useRouter()

  // Evento global: cuando se crea una reserva desde NewReservationTrigger,
  // refrescamos el server component para traer datos nuevos.
  useEffect(() => {
    const handler = () => router.refresh()
    window.addEventListener('reservation:created', handler)
    return () => window.removeEventListener('reservation:created', handler)
  }, [router])

  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  // Derivar nombre para display — prioridad: user_name > guest_name > "Sin nombre"
  const displayName = (r: SplitReservation) =>
    r.user_name ?? r.guest_name ?? 'Sin nombre'

  // Mapa table_id -> reserva activa (para mostrar en TableTile)
  const reservationByTable = useMemo(() => {
    const m = new Map<string, SplitReservation>()
    for (const r of reservations) {
      if (r.status === 'confirmed' || r.status === 'checked_in') {
        const existing = m.get(r.table_id)
        if (!existing || r.status === 'checked_in') m.set(r.table_id, r)
      }
    }
    return m
  }, [reservations])

  // Filtrado cola por búsqueda + agrupamiento por slot
  const queueBuckets: SlotBucket[] = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = reservations.filter((r) => {
      if (r.status === 'cancelled' || r.status === 'no_show') return false
      if (!q) return true
      const name = displayName(r).toLowerCase()
      const phone = (r.guest_phone ?? '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })

    // Agrupar por rango de 2hs: 12-14, 14-16, 16-18, 20-22, 22-00
    const ranges = [
      { key: '12:00-14:00hs', match: (t: string) => t >= '12:00' && t < '14:00' },
      { key: '14:00-16:00hs', match: (t: string) => t >= '14:00' && t < '16:00' },
      { key: '16:00-18:00hs', match: (t: string) => t >= '16:00' && t < '18:00' },
      { key: '18:00-20:00hs', match: (t: string) => t >= '18:00' && t < '20:00' },
      { key: '20:00-22:00hs', match: (t: string) => t >= '20:00' && t < '22:00' },
      { key: '22:00-00:00hs', match: (t: string) => t >= '22:00' },
    ]
    const buckets: SlotBucket[] = []
    for (const range of ranges) {
      const items = filtered.filter((r) => range.match(r.time_slot))
      if (items.length > 0) {
        items.sort((a, b) => a.time_slot.localeCompare(b.time_slot))
        buckets.push({ key: range.key, items })
      }
    }
    return buckets
  }, [reservations, search])

  // Tables filtradas por zona activa
  const visibleTables = useMemo(() => {
    if (!activeZone) return localTables
    return localTables.filter((t) => t.zone_id === activeZone)
  }, [localTables, activeZone])

  // Counters para stats arriba del sidebar
  const stats = useMemo(() => {
    const confirmed = reservations.filter(
      (r) => r.status === 'confirmed' || r.status === 'checked_in',
    ).length
    const checkedIn = reservations.filter((r) => r.status === 'checked_in').length
    const totalGuests = reservations
      .filter((r) => r.status === 'confirmed' || r.status === 'checked_in')
      .reduce((acc, r) => acc + r.party_size, 0)
    return { confirmed, checkedIn, totalGuests }
  }, [reservations])

  // Handler drag-drop: asignar reserva a otra mesa (y opcionalmente a otra hora
  // si el drop viene del Timeline view, donde el eje X es tiempo).
  const handleDrop = useCallback(
    async (
      reservationId: string,
      newTableId: string,
      newTimeSlot: string | null = null,
    ) => {
      setDropTargetId(null)
      const reservation = reservations.find((r) => r.id === reservationId)
      if (!reservation) return

      const tableChanged = reservation.table_id !== newTableId
      const slotChanged =
        newTimeSlot !== null && newTimeSlot !== reservation.time_slot.slice(0, 5)
      if (!tableChanged && !slotChanged) return

      // Optimistic update
      const prevTableId = reservation.table_id
      const prevTimeSlot = reservation.time_slot
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                table_id: newTableId,
                time_slot: newTimeSlot ? `${newTimeSlot}:00` : r.time_slot,
              }
            : r,
        ),
      )

      const payload: Record<string, unknown> = {}
      if (tableChanged) payload.table_id = newTableId
      if (slotChanged && newTimeSlot) payload.time_slot = newTimeSlot

      const res = await mutateFetch(`/api/reservas/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        // Rollback
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? { ...r, table_id: prevTableId, time_slot: prevTimeSlot }
              : r,
          ),
        )
        setToast({ tone: 'error', text: body.error ?? 'No se pudo reasignar' })
        setTimeout(() => setToast(null), 2800)
        return
      }

      const msg = slotChanged && tableChanged
        ? 'Reserva reprogramada'
        : slotChanged
          ? `Movida a ${newTimeSlot}`
          : 'Mesa reasignada'
      setToast({ tone: 'ok', text: msg })
      setTimeout(() => setToast(null), 2000)
    },
    [reservations],
  )

  const getTableStatus = (t: SplitTable): 'available' | 'reserved' | 'occupied' => {
    if (t.is_occupied) return 'occupied'
    const res = reservationByTable.get(t.id)
    if (res?.status === 'checked_in') return 'occupied'
    if (res) return 'reserved'
    return 'available'
  }

  const activeReservation = useMemo(
    () => reservations.find((r) => r.id === activeReservationId) ?? null,
    [reservations, activeReservationId],
  )
  const editingReservation = useMemo(
    () => reservations.find((r) => r.id === editingReservationId) ?? null,
    [reservations, editingReservationId],
  )
  const ratingReservation = useMemo(
    () => reservations.find((r) => r.id === ratingReservationId) ?? null,
    [reservations, ratingReservationId],
  )

  const activeTable = activeReservation
    ? localTables.find((t) => t.id === activeReservation.table_id) ?? null
    : null
  const activeZoneObj = activeTable?.zone_id
    ? zones.find((z) => z.id === activeTable.zone_id) ?? null
    : null

  /** Adapta una SplitReservation al contract de ReservationRow/EditReservationSheet. */
  const toReservationRow = useCallback(
    (r: SplitReservation): ReservationRow & { date: string; table_id: string } => {
      const table = localTables.find((t) => t.id === r.table_id)
      return {
        id: r.id,
        status: r.status,
        date,
        time_slot: r.time_slot,
        party_size: r.party_size,
        guest_name: r.guest_name,
        guest_phone: r.guest_phone,
        notes: r.notes,
        guest_tag: r.guest_tag,
        table_id: r.table_id,
        tables: table ? { label: table.label } : null,
        users: r.user_name ? { name: r.user_name } : null,
      }
    },
    [localTables, date],
  )

  const refreshAfterAction = useCallback(() => {
    setActiveReservationId(null)
    setEditingReservationId(null)
    setRatingReservationId(null)
    router.refresh()
  }, [router])

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <ServiceHeader
        date={date}
        mode={mode}
        shiftLabel={shiftLabel}
        venueName={venueName}
      />

      {/* Grid principal desktop — sidebar fijo + canvas fluid */}
      <div className="flex-1 flex overflow-hidden">

        {/* ────────────────────── SIDEBAR COLA ──────────────────────
            Visible en md+ (tablet/desktop). En mobile usamos /dashboard/reservas
            como vista dedicada para la cola (bottom nav "Reservas"). */}
        <aside
          className="hidden md:flex w-[280px] lg:w-[340px] xl:w-[360px]
                     flex-shrink-0 border-r border-ink-line
                     bg-ink flex-col overflow-hidden"
        >
          {/* Stats compacto arriba */}
          <div className="px-5 py-4 border-b border-ink-line space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <StatMini label="Reservas" value={stats.confirmed} tone="default" />
              <StatMini label="Check-in" value={stats.checkedIn} tone="olive" />
              <StatMini label="Cubiertos" value={stats.totalGuests} tone="wine" />
            </div>

            {/* Search */}
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-text-3"
                aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar reserva…"
                className="w-full rounded-lg bg-ink-2 border border-ink-line-2 pl-9 pr-3 py-2
                           text-[12.5px] text-ink-text placeholder:text-ink-text-3 outline-none
                           focus:border-wine-soft/50 transition-colors"
              />
            </div>
          </div>

          {/* Cola scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {queueBuckets.length === 0 ? (
              <div className="text-center py-12">
                <p className="font-display text-[15px] text-ink-text-2">
                  {search ? 'Sin resultados' : 'Servicio sin reservas'}
                </p>
                <p className="text-[12px] text-ink-text-3 mt-1">
                  {search ? 'Probá otro nombre' : 'Arrancás con el salón limpio'}
                </p>
              </div>
            ) : (
              queueBuckets.map((bucket) => (
                <section key={bucket.key}>
                  <header className="flex items-baseline justify-between mb-2 px-1">
                    <NumericText label tone="muted">
                      {bucket.key}
                    </NumericText>
                    <span className="text-[10.5px] text-ink-text-3">
                      <NumericText>{bucket.items.length}</NumericText>
                    </span>
                  </header>
                  <div className="space-y-2">
                    {bucket.items.map((r) => (
                      <ReservationQueueItem
                        key={r.id}
                        id={r.id}
                        name={displayName(r)}
                        time={r.time_slot.slice(0, 5)}
                        partySize={r.party_size}
                        tableLabel={localTables.find((t) => t.id === r.table_id)?.label ?? null}
                        zoneLabel={
                          zones.find(
                            (z) =>
                              z.id === localTables.find((t) => t.id === r.table_id)?.zone_id,
                          )?.name ?? null
                        }
                        status={r.status}
                        guestTag={r.guest_tag}
                        notes={r.notes}
                        onClick={() => setActiveReservationId(r.id)}
                        onDragBegin={(preview) => setDragPreview(preview)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </aside>

        {/* ────────────────────── CANVAS ────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Toolbar: view toggle + zones tabs */}
          <div className="px-5 lg:px-7 py-3 border-b border-ink-line flex items-center
                          gap-4 flex-wrap">

            {/* View toggle Floor / Timeline */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-ink-2 border border-ink-line">
              <button
                type="button"
                onClick={() => setView('floor')}
                className={`h-8 px-3 rounded-md text-[11.5px] font-bold uppercase
                            tracking-[0.08em] transition-colors
                            ${view === 'floor'
                              ? 'bg-ink-3 text-ink-text'
                              : 'text-ink-text-3 hover:text-ink-text-2'}`}
              >
                Piso
              </button>
              <button
                type="button"
                onClick={() => setView('timeline')}
                className={`h-8 px-3 rounded-md text-[11.5px] font-bold uppercase
                            tracking-[0.08em] transition-colors
                            ${view === 'timeline'
                              ? 'bg-ink-3 text-ink-text'
                              : 'text-ink-text-3 hover:text-ink-text-2'}`}
              >
                Timeline
              </button>
            </div>

            {/* Zones tabs — solo visible en floor view */}
            {view === 'floor' && zones.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <NumericText label tone="muted" className="mr-1">
                  Sectores
                </NumericText>
                <div className="flex items-center gap-1">
                  {zones.map((z) => {
                    const isActive = activeZone === z.id
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setActiveZone(z.id)}
                        className={`px-3 h-8 rounded-md text-[12px] font-semibold
                                    transition-colors
                                    ${isActive
                                      ? 'bg-wine/20 text-wine-soft border border-wine/35'
                                      : 'text-ink-text-2 hover:text-ink-text border border-transparent'}`}
                      >
                        {z.name}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setActiveZone(null)}
                    className={`px-3 h-8 rounded-md text-[12px] font-semibold
                                transition-colors
                                ${activeZone === null
                                  ? 'bg-wine/20 text-wine-soft border border-wine/35'
                                  : 'text-ink-text-2 hover:text-ink-text border border-transparent'}`}
                  >
                    Todo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contenido según view */}
          {view === 'floor' ? (
            <div className="flex-1 overflow-y-auto px-5 lg:px-7 py-5">
              {visibleTables.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-ink-text-3 text-[13px]">Sin mesas en este sector</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {visibleTables.map((t) => {
                    const status = getTableStatus(t)
                    const res = reservationByTable.get(t.id)
                    return (
                      <TableTile
                        key={t.id}
                        label={t.label}
                        capacity={t.capacity}
                        status={status}
                        reservationHolder={res ? displayName(res) : null}
                        reservationTime={res?.time_slot.slice(0, 5) ?? null}
                        partySize={res?.party_size}
                        isDropTarget={dropTargetId === t.id}
                        onDragOver={() => setDropTargetId(t.id)}
                        onDrop={(reservationId) => handleDrop(reservationId, t.id)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-hidden p-4">
              <TimelineView
                tables={localTables}
                zones={zones}
                reservations={reservations}
                displayName={displayName}
                onReassign={(rid, tid, slot) => handleDrop(rid, tid, slot)}
                onDragBegin={(preview) => setDragPreview(preview)}
                onReservationClick={(rid) => setActiveReservationId(rid)}
                onEmptyCellClick={(tid, slot) => {
                  // El NewReservationTrigger (global en el layout) escucha este
                  // evento y abre el sheet con mesa + hora prefilled.
                  window.dispatchEvent(new CustomEvent('open:new-reservation', {
                    detail: { table_id: tid, time_slot: slot, date },
                  }))
                }}
              />
            </div>
          )}
        </main>

        {/* ────────────────────── RIGHT ACTION PANEL ──────────────────────
            Desktop (lg+): 3ra columna que muestra detalle + CTAs de la reserva
            seleccionada. En mobile/tablet, la interacción se resuelve con el
            ReservationActionSheet bottom sheet (render más abajo). */}
        {activeReservation && (
          <RightActionPanel
            reservation={activeReservation}
            table={activeTable}
            zone={activeZoneObj}
            displayName={displayName}
            onClose={() => setActiveReservationId(null)}
            onEdit={() => setEditingReservationId(activeReservation.id)}
            onRateGuest={() => setRatingReservationId(activeReservation.id)}
            onUpdated={refreshAfterAction}
          />
        )}
      </div>

      {/* ────────────────────── MOBILE / TABLET SHEETS ──────────────────────
          Visibles solo bajo lg — desktop ya tiene el RightActionPanel. */}
      <div className="lg:hidden">
        {activeReservation
          && !editingReservation
          && !ratingReservation && (
            <ReservationActionSheet
              reservation={toReservationRow(activeReservation)}
              onClose={() => setActiveReservationId(null)}
              onUpdated={refreshAfterAction}
              onEdit={() => setEditingReservationId(activeReservation.id)}
              onRateGuest={() => setRatingReservationId(activeReservation.id)}
            />
          )}
      </div>

      {/* Edit + Rate sheets — cross-breakpoint, siempre bottom sheet */}
      {editingReservation && (
        <EditReservationSheet
          reservation={toReservationRow(editingReservation)}
          onClose={() => setEditingReservationId(null)}
          onUpdated={refreshAfterAction}
        />
      )}
      {ratingReservation && (
        <RateGuestSheet
          reservationId={ratingReservation.id}
          guestName={displayName(ratingReservation)}
          onClose={() => setRatingReservationId(null)}
          onRated={refreshAfterAction}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2.5
                      border text-[12.5px] font-semibold z-50
                      animate-[fadeUp_0.25s_ease-out]
                      ${toast.tone === 'ok'
                        ? 'bg-olive/20 text-ink-text border-olive/40'
                        : 'bg-wine/25 text-ink-text border-wine/45'}`}
        >
          {toast.text}
        </div>
      )}

      {/* Drag preview card — flota con el cursor mientras se arrastra una reserva.
          Aparece rotada -4deg como en el reference, con shadow pronunciada. */}
      {dragPreview && (
        <div
          ref={previewElRef}
          className="fixed top-0 left-0 z-[60] pointer-events-none
                     bg-olive text-white rounded-xl px-3.5 py-2.5
                     shadow-[0_16px_38px_-8px_rgba(0,0,0,0.55)]
                     min-w-[190px] origin-top-left"
          style={{
            transform: `translate3d(${dragPosRef.current.x + 16}px, ${dragPosRef.current.y - 30}px, 0) rotate(-4deg)`,
          }}
        >
          <p className="font-display font-semibold text-[14px] leading-tight truncate">
            {dragPreview.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-white/85 text-[11px] font-mono">
            <span>{dragPreview.time}</span>
            <span className="text-white/55">·</span>
            <span>{dragPreview.party}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function StatMini({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'default' | 'olive' | 'wine'
}) {
  const cls = tone === 'olive' ? 'text-olive' : tone === 'wine' ? 'text-wine-soft' : 'text-ink-text'
  return (
    <div className="rounded-lg bg-ink-2 border border-ink-line px-3 py-2.5">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-text-3 mb-1">
        {label}
      </p>
      <NumericText large className={`text-[22px] ${cls} leading-none`}>
        {value}
      </NumericText>
    </div>
  )
}
