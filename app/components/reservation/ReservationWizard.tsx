'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Venue, Table } from '@reservaya/shared'
import { getAvailableDates, getAvailableTimeSlots, formatDateEs } from '@reservaya/shared'
import { createClient } from '@/lib/supabase/client'
import { Toast, useToast } from '@/components/ui/Toast'
import { TableCardSkeleton } from '@/components/ui/Skeleton'

type WizardStep = 'datetime' | 'table' | 'summary'

interface WizardState {
  date: string | null
  timeSlot: string | null
  partySize: number
  selectedTable: Table | null
  lockId: string | null
  lockExpiresAt: string | null
}

interface ReservationWizardProps {
  venue: Venue
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8]

export function ReservationWizard({ venue }: ReservationWizardProps) {
  const [step, setStep] = useState<WizardStep>('datetime')
  const [state, setState] = useState<WizardState>({
    date: null, timeSlot: null, partySize: 2,
    selectedTable: null, lockId: null, lockExpiresAt: null,
  })
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [lockTimer, setLockTimer] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const { toast, show: showToast, dismiss } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const availableDates = getAvailableDates(venue.config_json)
  const availableSlots = state.date
    ? getAvailableTimeSlots(venue.config_json, state.date)
    : []

  // Countdown del lock de selección
  useEffect(() => {
    if (!state.lockExpiresAt) { setLockTimer(null); return }
    const tick = () => {
      const remaining = Math.max(
        0, Math.floor((new Date(state.lockExpiresAt!).getTime() - Date.now()) / 1000)
      )
      setLockTimer(remaining)
      if (remaining === 0) {
        setState(s => ({ ...s, selectedTable: null, lockId: null, lockExpiresAt: null }))
        showToast('El tiempo de selección venció. Elegí la mesa de nuevo.', 'error')
        setStep('table')
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [state.lockExpiresAt, showToast])

  const loadTables = useCallback(async () => {
    if (!state.date || !state.timeSlot) return
    setLoadingTables(true)
    try {
      const params = new URLSearchParams({
        venue_id: venue.id,
        date: state.date,
        time_slot: state.timeSlot,
        party_size: String(state.partySize),
      })
      const res = await fetch(`/api/tables/disponibles?${params}`)
      const data = await res.json() as Table[]
      setAvailableTables(data)
    } catch {
      showToast('Error al cargar las mesas', 'error')
    } finally {
      setLoadingTables(false)
    }
  }, [state.date, state.timeSlot, state.partySize, venue.id, showToast])

  useEffect(() => {
    if (step === 'table') loadTables()
  }, [step, loadTables])

  async function handleSelectTable(table: Table) {
    // Limpiar lock anterior si existe
    if (state.lockId) {
      await fetch(`/api/table-lock?lock_id=${state.lockId}`, { method: 'DELETE' })
    }
    try {
      const res = await fetch('/api/table-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: table.id }),
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        showToast(err.error ?? 'Mesa no disponible', 'error')
        await loadTables()
        return
      }
      const lock = await res.json() as { id: string; expires_at: string }
      setState(s => ({
        ...s, selectedTable: table,
        lockId: lock.id, lockExpiresAt: lock.expires_at,
      }))
      setStep('summary')
    } catch {
      showToast('Error al reservar la mesa', 'error')
    }
  }

  async function handleConfirm() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const redirect = encodeURIComponent(window.location.pathname)
      router.push(`/login?redirect=${redirect}`)
      return
    }

    if (!state.date || !state.timeSlot || !state.selectedTable || !state.lockId) return
    setCreating(true)

    try {
      const res = await fetch('/api/reserva/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venue.id,
          table_id: state.selectedTable.id,
          date: state.date,
          time_slot: state.timeSlot,
          party_size: state.partySize,
          lock_id: state.lockId,
        }),
      })

      if (!res.ok) {
        const err = await res.json() as { error: string }
        showToast(err.error, 'error')
        setCreating(false)
        return
      }

      const reservation = await res.json() as { id: string }

      // Crear preferencia de pago y redirigir a MP
      const payRes = await fetch(`/api/reserva/${reservation.id}/pago`, {
        method: 'POST',
      })

      if (!payRes.ok) {
        showToast('Error al iniciar el pago', 'error')
        setCreating(false)
        return
      }

      const { init_point } = await payRes.json() as { init_point: string }
      window.location.href = init_point
    } catch {
      showToast('Error inesperado', 'error')
      setCreating(false)
    }
  }

  // ─── STEP: DATE / TIME / PARTY SIZE ───────────────────────────────────────
  if (step === 'datetime') {
    return (
      <div className="space-y-6">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}

        {/* Fecha */}
        <div>
          <p className="text-[13px] font-bold text-tx2 mb-3 uppercase tracking-wider">Fecha</p>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {availableDates.slice(0, 10).map((d) => {
              const dateObj = new Date(d + 'T12:00:00')
              const isSelected = state.date === d
              const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'short' })
              const dayNum  = dateObj.getDate()
              const monthName = dateObj.toLocaleDateString('es-AR', { month: 'short' })
              return (
                <button
                  key={d}
                  onClick={() => setState(s => ({ ...s, date: d, timeSlot: null }))}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-xl
                              px-3 py-2.5 min-w-[56px] border-2 transition-all duration-[180ms]
                              ${isSelected
                                ? 'bg-c1 border-c1 text-white shadow-c1'
                                : 'bg-white border-[var(--br)] text-tx2'
                              }`}
                >
                  <span className="text-[10px] font-bold uppercase">{dayName}</span>
                  <span className="font-display text-[22px] font-bold leading-none">{dayNum}</span>
                  <span className="text-[10px] font-semibold">{monthName}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Horarios */}
        {state.date && (
          <div>
            <p className="text-[13px] font-bold text-tx2 mb-3 uppercase tracking-wider">Horario</p>
            {availableSlots.length === 0 ? (
              <div className="bg-c3l border border-[rgba(255,184,0,0.3)] rounded-xl p-4 text-center">
                <p className="text-[#CC7700] text-[13px] font-semibold">
                  Las reservas para este turno ya cerraron. Elegí otro día.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setState(s => ({ ...s, timeSlot: slot }))}
                    className={`chip ${state.timeSlot === slot ? 'chip-active' : ''}`}
                  >
                    {slot} hs
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personas */}
        {state.timeSlot && (
          <div>
            <p className="text-[13px] font-bold text-tx2 mb-3 uppercase tracking-wider">Personas</p>
            <div className="flex gap-2 flex-wrap">
              {PARTY_SIZES.map((n) => (
                <button
                  key={n}
                  onClick={() => setState(s => ({ ...s, partySize: n }))}
                  className={`w-11 h-11 rounded-full font-bold text-[15px] border-2
                              transition-all duration-[180ms]
                              ${state.partySize === n
                                ? 'bg-c1 border-c1 text-white shadow-c1'
                                : 'bg-white border-[var(--br)] text-tx2'
                              }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {state.date && state.timeSlot && (
          <button
            onClick={() => setStep('table')}
            className="btn-primary"
          >
            Ver mesas disponibles
          </button>
        )}
      </div>
    )
  }

  // ─── STEP: SELECCIÓN DE MESA ───────────────────────────────────────────────
  if (step === 'table') {
    return (
      <div className="space-y-5">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}

        <div className="flex items-center gap-3">
          <button onClick={() => setStep('datetime')}
            className="w-9 h-9 rounded-full bg-sf flex items-center justify-center
                       border border-[var(--br)] active:scale-95 transition-transform">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="var(--tx2)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p className="font-semibold text-[14px] text-tx">
              {state.date ? formatDateEs(state.date) : ''} · {state.timeSlot} hs
            </p>
            <p className="text-tx3 text-[12px]">{state.partySize} persona{state.partySize !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <p className="text-[13px] font-bold text-tx2 uppercase tracking-wider">
          Elegí tu mesa
        </p>

        <div className="grid grid-cols-3 gap-3">
          {loadingTables
            ? Array.from({ length: 6 }).map((_, i) => <TableCardSkeleton key={i} />)
            : availableTables.length === 0
              ? (
                <div className="col-span-3 text-center py-8">
                  <p className="text-tx2 text-[14px] font-semibold">
                    No hay mesas disponibles para este horario.
                  </p>
                  <button onClick={() => setStep('datetime')}
                    className="text-c4 text-[13px] mt-2 font-semibold">
                    Cambiar horario →
                  </button>
                </div>
              )
              : availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className="flex flex-col items-center justify-center gap-1.5
                             rounded-xl border-2 border-c2/30 bg-c2l
                             active:scale-95 transition-transform duration-[180ms]"
                  style={{ aspectRatio: '1' }}
                >
                  <span className="font-display text-[18px] font-bold text-[#14A874]">
                    {table.label}
                  </span>
                  <span className="text-[11px] font-semibold text-[#14A874]">
                    {table.capacity} 👤
                  </span>
                </button>
              ))
          }
        </div>

        <div className="flex items-center gap-2 text-[12px] text-tx3">
          <span className="w-3 h-3 rounded-full bg-c2l border-2 border-c2/30 inline-block" />
          Disponible
          <span className="w-3 h-3 rounded-full bg-sf2 border-2 border-[var(--br)] inline-block ml-2" />
          No disponible
        </div>
      </div>
    )
  }

  // ─── STEP: RESUMEN + CONFIRMAR ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}

      <div className="flex items-center gap-3">
        <button onClick={() => setStep('table')}
          className="w-9 h-9 rounded-full bg-sf flex items-center justify-center
                     border border-[var(--br)] active:scale-95 transition-transform">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="var(--tx2)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="font-semibold text-[15px] text-tx">Confirmá tu reserva</p>
      </div>

      {/* Card resumen */}
      <div className="card-confirmation p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-tx2">Restaurante</span>
          <span className="text-[14px] font-bold text-tx">{venue.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-tx2">Mesa</span>
          <span className="font-display text-[18px] font-bold text-c2">
            {state.selectedTable?.label}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-tx2">Fecha</span>
          <span className="text-[14px] font-bold text-tx">
            {state.date ? formatDateEs(state.date) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-tx2">Horario</span>
          <span className="text-[14px] font-bold text-tx">{state.timeSlot} hs</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-tx2">Personas</span>
          <span className="text-[14px] font-bold text-tx">{state.partySize}</span>
        </div>
      </div>

      {/* Timer del lock */}
      {lockTimer !== null && lockTimer > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3
                        bg-c3l border border-[rgba(255,184,0,0.25)]">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="#CC7700" strokeWidth="2" />
            <path d="M12 7v5l3 3" stroke="#CC7700" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[13px] text-[#CC7700]">
            Mesa reservada por{' '}
            <span className="font-display text-[16px] font-bold">
              {Math.floor(lockTimer / 60)}:{String(lockTimer % 60).padStart(2, '0')}
            </span>
          </p>
        </div>
      )}

      {/* Seña */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-tx2">Seña (se descuenta al llegar)</p>
          <p className="text-[11px] text-tx3 mt-0.5">Pago seguro via Mercado Pago</p>
        </div>
        <span className="font-display text-[22px] font-bold text-tx">
          ${venue.config_json.deposit_amount?.toLocaleString('es-AR') ?? '2.000'}
        </span>
      </div>

      <button
        onClick={handleConfirm}
        disabled={creating}
        className="btn-primary disabled:opacity-60"
      >
        {creating ? 'Procesando…' : 'Confirmar y pagar seña →'}
      </button>

      <p className="text-center text-tx3 text-[12px]">
        Al confirmar aceptás la política de cancelación del restaurante.
      </p>
    </div>
  )
}
