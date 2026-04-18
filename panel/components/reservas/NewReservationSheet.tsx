'use client'

import { useEffect, useState } from 'react'
import type { ManualReservationInput, ReservationSource } from '@/lib/shared'
import { mutateFetch } from '@/lib/panelFetch'

interface TableOption {
  id: string
  label: string
  capacity: number
}

interface NewReservationSheetProps {
  /** Fecha precargada en el form (YYYY-MM-DD). */
  defaultDate: string
  /** Mesa precargada (opcional) — viene del click en celda vacía del Timeline. */
  defaultTableId?: string
  /** Horario precargado (HH:MM) — también del Timeline. */
  defaultTimeSlot?: string
  onClose: () => void
  onCreated: () => void
}

type PanelSource = Extract<ReservationSource, 'panel' | 'walkin' | 'phone'>

const SOURCE_LABEL: Record<PanelSource, string> = {
  panel: 'Manual',
  walkin: 'Walk-in',
  phone: 'Teléfono',
}

/**
 * Sheet que permite al staff cargar una reserva sin que el cliente tenga cuenta.
 * Pasos (en la misma pantalla, sin wizard para que sea rápido):
 *   1. Datos del cliente (nombre, teléfono opcional, notas)
 *   2. Fecha + slot + personas
 *   3. Mesa (filtrada por capacidad)
 *   4. Origen (walk-in / teléfono / manual)
 */
export function NewReservationSheet({
  defaultDate,
  defaultTableId,
  defaultTimeSlot,
  onClose,
  onCreated,
}: NewReservationSheetProps) {
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [timeSlot, setTimeSlot] = useState(defaultTimeSlot ?? '')
  const [partySize, setPartySize] = useState(2)
  const [tableId, setTableId] = useState(defaultTableId ?? '')
  const [source, setSource] = useState<PanelSource>('phone')

  const [slots, setSlots] = useState<string[]>([])
  const [tables, setTables] = useState<TableOption[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingTables, setLoadingTables] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar mesas una sola vez
  useEffect(() => {
    fetch('/api/tables')
      .then((r) => r.json())
      .then((d: TableOption[] | { error: string }) => {
        if (Array.isArray(d)) setTables(d)
      })
      .finally(() => setLoadingTables(false))
  }, [])

  // Recargar slots cuando cambia la fecha
  useEffect(() => {
    setLoadingSlots(true)
    fetch(`/api/venue/slots?date=${date}`)
      .then((r) => r.json())
      .then((d: { slots: string[] } | { error: string }) => {
        if ('slots' in d) {
          setSlots(d.slots)
          // Si el slot actual ya no es válido, limpiar
          if (!d.slots.includes(timeSlot)) setTimeSlot('')
        }
      })
      .finally(() => setLoadingSlots(false))
    // timeSlot intencionalmente fuera: queremos reaccionar solo a date
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const availableTables = tables.filter((t) => t.capacity >= partySize)

  const isValid =
    guestName.trim().length > 0 &&
    tableId !== '' &&
    timeSlot !== '' &&
    partySize > 0

  async function handleSubmit() {
    if (!isValid || submitting) return
    setError(null)
    setSubmitting(true)

    const payload: ManualReservationInput = {
      table_id: tableId,
      date,
      time_slot: timeSlot,
      party_size: partySize,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      source,
    }

    const res = await mutateFetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo crear la reserva')
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
        className="relative w-full bg-white rounded-t-3xl max-h-[92vh] flex flex-col
                   animate-[slideUp_0.28s_cubic-bezier(0.34,1.2,0.64,1)]"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle + header */}
        <div className="px-6 pt-3 pb-4 border-b border-[var(--br)]">
          <div className="w-10 h-1 bg-sf2 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-[19px] text-tx">Nueva reserva</p>
              <p className="text-tx2 text-[12.5px]">Walk-in o llamada telefónica</p>
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

        {/* Form scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Cliente */}
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-tx3">Cliente</p>

            <label className="block">
              <span className="text-[12px] text-tx2 mb-1 block">Nombre *</span>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej: Marcela Díaz"
                className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                           text-[14px] text-tx outline-none focus:border-c2/60"
              />
            </label>

            <label className="block">
              <span className="text-[12px] text-tx2 mb-1 block">Teléfono</span>
              <input
                type="tel"
                inputMode="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+54 9 11 ..."
                className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                           text-[14px] text-tx outline-none focus:border-c2/60"
              />
            </label>

            <label className="block">
              <span className="text-[12px] text-tx2 mb-1 block">Notas del host</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cumpleaños, celíaco, prefiere ventana…"
                rows={2}
                className="w-full rounded-xl bg-sf border border-[var(--br)] px-4 py-3
                           text-[14px] text-tx outline-none focus:border-c2/60 resize-none"
              />
            </label>
          </section>

          {/* Fecha / personas / horario */}
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
                             text-[14px] text-tx outline-none focus:border-c2/60"
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
              ) : slots.length === 0 ? (
                <p className="text-[13px] text-tx3 bg-sf rounded-xl px-4 py-3">
                  El local no abre ese día
                </p>
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
          </section>

          {/* Mesa */}
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-tx3">Mesa</p>
            {loadingTables ? (
              <div className="h-12 bg-sf rounded-xl animate-pulse" />
            ) : availableTables.length === 0 ? (
              <p className="text-[13px] text-tx3 bg-sf rounded-xl px-4 py-3">
                No hay mesas con capacidad para {partySize} persona{partySize !== 1 ? 's' : ''}
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

          {/* Origen */}
          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-tx3">Origen</p>
            <div className="grid grid-cols-3 gap-2">
              {(['phone', 'walkin', 'panel'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSource(opt)}
                  className={`h-11 rounded-xl border text-[13px] font-semibold transition-colors ${
                    source === opt
                      ? 'bg-tx text-white border-tx'
                      : 'bg-sf text-tx border-[var(--br)]'
                  }`}
                >
                  {SOURCE_LABEL[opt]}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-xl bg-c1l border border-c1/30 px-4 py-3
                            text-[13px] text-[#C0313E]">
              {error}
            </div>
          )}
        </div>

        {/* Footer sticky */}
        <div className="px-6 pt-4 pb-2 border-t border-[var(--br)] bg-white">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full h-13 rounded-xl bg-tx text-white font-bold text-[15px]
                       disabled:opacity-45 transition-opacity"
            style={{ height: '52px' }}
          >
            {submitting ? 'Guardando…' : 'Crear reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}
