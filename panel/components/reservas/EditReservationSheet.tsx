'use client'

import { useEffect, useState } from 'react'
import type { ReservationRow } from './ReservationActionSheet'
import { mutateFetch } from '@/lib/panelFetch'

interface TableOption {
  id: string
  label: string
  capacity: number
}

interface EditReservationSheetProps {
  reservation: ReservationRow & { date: string; table_id?: string }
  onClose: () => void
  onUpdated: () => void
}

/**
 * Sheet de edición — permite al staff modificar los datos de una reserva ya
 * creada (walk-in, llamada, o reserva online que requiere ajuste).
 *
 * Qué puede editar: fecha, horario, mesa, personas, notas, teléfono.
 * Qué NO puede: el cliente registrado (user_id queda inmutable).
 */
export function EditReservationSheet({
  reservation: r,
  onClose,
  onUpdated,
}: EditReservationSheetProps) {
  const [date, setDate] = useState(r.date)
  const [timeSlot, setTimeSlot] = useState(r.time_slot)
  const [partySize, setPartySize] = useState(r.party_size)
  const [tableId, setTableId] = useState<string>('')
  const [notes, setNotes] = useState(r.notes ?? '')
  const [guestPhone, setGuestPhone] = useState(r.guest_phone ?? '')
  const [durationMinutes, setDurationMinutes] = useState<number>(r.duration_minutes ?? 90)

  const [slots, setSlots] = useState<string[]>([])
  const [tables, setTables] = useState<TableOption[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingTables, setLoadingTables] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar mesas y precargar la actual
  useEffect(() => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((d: TableOption[] | { error: string }) => {
        if (Array.isArray(d)) {
          setTables(d)
          // Intentar matchear la mesa actual por label si no tenemos id
          const current = d.find((t) => t.label === r.tables?.label)
          if (current) setTableId(current.id)
        }
      })
      .finally(() => setLoadingTables(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recargar slots cuando cambia la fecha
  useEffect(() => {
    setLoadingSlots(true)
    fetch(`/api/venue/slots?date=${date}`)
      .then((res) => res.json())
      .then((d: { slots: string[] } | { error: string }) => {
        if ('slots' in d) {
          // Incluir el slot actual aunque ya no esté en la lista (sin esto
          // el staff pierde la hora vigente tras cambiar una config)
          const combined = Array.from(new Set([...d.slots, timeSlot])).sort()
          setSlots(combined)
        }
      })
      .finally(() => setLoadingSlots(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const availableTables = tables.filter((t) => t.capacity >= partySize)

  const changed =
    date !== r.date ||
    timeSlot !== r.time_slot ||
    partySize !== r.party_size ||
    (notes ?? '') !== (r.notes ?? '') ||
    (guestPhone ?? '') !== (r.guest_phone ?? '') ||
    (tableId !== '' && tableId !== r.table_id) ||
    durationMinutes !== (r.duration_minutes ?? 90)

  async function handleSubmit() {
    if (!changed || submitting) return
    setError(null)
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      date,
      time_slot: timeSlot,
      party_size: partySize,
      notes: notes.trim() || null,
    }
    if (tableId) payload.table_id = tableId
    if (!r.users) payload.guest_phone = guestPhone.trim() || null
    if (durationMinutes !== (r.duration_minutes ?? 90)) {
      payload.duration_minutes = durationMinutes
    }

    const res = await mutateFetch(`/api/reservas/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo actualizar')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    onUpdated()
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
        {/* Header */}
        <div className="px-6 pt-3 pb-4 border-b border-[var(--br)]">
          <div className="w-10 h-1 bg-sf2 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-[19px] text-tx">Editar reserva</p>
              <p className="text-tx2 text-[12.5px]">
                {r.users?.name ?? r.guest_name ?? 'Reserva'}
              </p>
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

        {/* Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-tx3">Cuándo</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] text-tx2 mb-1 block">Fecha</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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

            <div>
              <span className="text-[12px] text-tx2 mb-1.5 block">Horario</span>
              {loadingSlots ? (
                <div className="h-12 bg-sf rounded-xl animate-pulse" />
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTimeSlot(s)}
                      className={`flex-shrink-0 px-4 h-12 rounded-xl text-[14px] font-semibold
                                  border transition-colors snap-start ${
                        timeSlot === s
                          ? 'bg-tx text-white border-tx'
                          : 'bg-sf text-tx border-[var(--br)]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duración — afecta el ancho del bloque en Timeline view */}
            <div>
              <span className="text-[12px] text-tx2 mb-1.5 block flex items-center gap-1.5">
                Duración
                <span className="text-tx3 text-[10.5px] font-normal">
                  (bloquea la mesa)
                </span>
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { min: 60, label: '1h' },
                  { min: 90, label: '1:30' },
                  { min: 120, label: '2h' },
                  { min: 150, label: '2:30' },
                  { min: 180, label: '3h' },
                ].map(({ min, label }) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDurationMinutes(min)}
                    className={`h-10 rounded-lg text-[12.5px] font-semibold font-mono
                                border transition-colors ${
                      durationMinutes === min
                        ? 'bg-tx text-white border-tx'
                        : 'bg-sf text-tx border-[var(--br)]'
                    }`}
                    aria-label={`${min} minutos`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-tx3">Mesa</p>
            {loadingTables ? (
              <div className="h-12 bg-sf rounded-xl animate-pulse" />
            ) : availableTables.length === 0 ? (
              <p className="text-[13px] text-tx3 bg-sf rounded-xl px-4 py-3">
                Sin mesas para {partySize} personas
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableTables.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTableId(t.id)}
                    className={`h-16 rounded-xl border text-left px-3 py-2 flex flex-col
                                justify-between transition-colors ${
                      tableId === t.id
                        ? 'bg-tx text-white border-tx'
                        : 'bg-sf text-tx border-[var(--br)]'
                    }`}
                  >
                    <span className="font-display font-bold text-[14px] leading-none">
                      {t.label}
                    </span>
                    <span className="text-[10.5px] opacity-70">
                      Hasta {t.capacity}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-tx3">Datos</p>

            {!r.users && (
              <label className="block">
                <span className="text-[12px] text-tx2 mb-1 block">Teléfono</span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                             text-[14px] text-tx outline-none focus:border-olive/55"
                />
              </label>
            )}

            <label className="block">
              <span className="text-[12px] text-tx2 mb-1 block">Notas del host</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cumpleaños, celíaco, prefiere ventana…"
                rows={2}
                className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                           text-[14px] text-tx outline-none focus:border-olive/55 resize-none"
              />
            </label>
          </section>

          {error && (
            <div className="rounded-xl bg-wine/10 border border-wine/28 px-4 py-3
                            text-[13px] text-wine">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 pt-4 pb-2 border-t border-[var(--br)] bg-white">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!changed || submitting}
            className="w-full rounded-xl bg-tx text-white font-bold text-[15px]
                       disabled:opacity-45 transition-opacity"
            style={{ height: '52px' }}
          >
            {submitting ? 'Guardando…' : changed ? 'Guardar cambios' : 'Sin cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
