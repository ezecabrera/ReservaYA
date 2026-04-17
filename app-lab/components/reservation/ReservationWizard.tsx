'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Venue, Table, MenuCategory, MenuItem } from '@/lib/shared'
import { getAvailableDates, getAvailableTimeSlots, formatDateEs } from '@/lib/shared'
import { createClient } from '@/lib/supabase/client'
import { Toast, useToast } from '@/components/ui/Toast'
import { TableCardSkeleton } from '@/components/ui/Skeleton'

/**
 * Scroll suave a un elemento si NO está visible en viewport.
 * - Si ya se ve entero → no scrollea (evita movimientos innecesarios).
 * - Si está debajo del fold → scrollea con offset para dar respiro al header.
 * - Usa requestAnimationFrame para esperar que React pinte antes de medir.
 */
function scrollToRef(ref: React.RefObject<HTMLElement>, offset = 90) {
  if (!ref.current) return
  requestAnimationFrame(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vh = window.innerHeight
    // Si el top ya está visible en la primera mitad del viewport y su bottom
    // también se ve, no movemos nada — evita jitter.
    const alreadyVisible = rect.top >= 0 && rect.top < vh * 0.6 && rect.bottom <= vh
    if (alreadyVisible) return
    const y = rect.top + window.scrollY - offset
    window.scrollTo({ top: y, behavior: 'smooth' })
  })
}

type WizardStep = 'datetime' | 'table' | 'menu' | 'summary'

interface OrderSelection {
  menu_item_id: string
  name: string
  qty: number
  unit_price: number
}

interface WizardState {
  date: string | null
  timeSlot: string | null
  partySize: number
  selectedTable: Table | null
  lockId: string | null
  lockExpiresAt: string | null
  orderItems: OrderSelection[]
}

interface ReservationWizardProps {
  venue: Venue
  prefill?: { date?: string; time?: string; partySize?: number }
}

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8]

export function ReservationWizard({ venue, prefill }: ReservationWizardProps) {
  const [step, setStep] = useState<WizardStep>('datetime')
  const [state, setState] = useState<WizardState>({
    date: prefill?.date ?? null,
    timeSlot: prefill?.time ?? null,
    partySize: prefill?.partySize ?? 2,
    selectedTable: null, lockId: null, lockExpiresAt: null,
    orderItems: [],
  })
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [lockTimer, setLockTimer] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ menu_item_id: string; name: string; qty: number; unit_price: number }[]>([])
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [guestNote, setGuestNote] = useState('')

  // Refs para auto-scroll progresivo en el step datetime
  const timeRef  = useRef<HTMLDivElement>(null)
  const partyRef = useRef<HTMLDivElement>(null)
  const ctaRef   = useRef<HTMLDivElement>(null)

  function adjustQty(item: MenuItem, delta: number) {
    setState(s => {
      const existing = s.orderItems.find(o => o.menu_item_id === item.id)
      const newQty = (existing?.qty ?? 0) + delta
      if (newQty <= 0) {
        return { ...s, orderItems: s.orderItems.filter(o => o.menu_item_id !== item.id) }
      }
      if (existing) {
        return { ...s, orderItems: s.orderItems.map(o => o.menu_item_id === item.id ? { ...o, qty: newQty } : o) }
      }
      return {
        ...s,
        orderItems: [...s.orderItems, {
          menu_item_id: item.id,
          name: item.name,
          qty: newQty,
          unit_price: item.price,
        }],
      }
    })
  }
  const { toast, show: showToast, dismiss } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const availableDates = getAvailableDates(venue.config_json)
  const availableSlots = state.date
    ? getAvailableTimeSlots(venue.config_json, state.date)
    : []

  const loadMenu = useCallback(async () => {
    setLoadingMenu(true)
    try {
      const [catsRes, itemsRes, lastOrderRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('venue_id', venue.id)
          .order('sort_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('venue_id', venue.id)
          .neq('availability_status', 'unavailable')
          .order('name'),
        fetch(`/api/orders/ultimo?venue_id=${venue.id}`).then(r => r.json()),
      ])
      setMenuCategories(catsRes.data ?? [])
      setMenuItems(itemsRes.data ?? [])
      if (Array.isArray(lastOrderRes) && lastOrderRes.length > 0) {
        setLastOrder(lastOrderRes)
      }
    } finally {
      setLoadingMenu(false)
    }
  }, [venue.id, supabase])

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
    if (step === 'menu') {
      loadMenu()
      // POP-UP OMITIR MENÚ: al entrar al paso menu, abrir modal inmediatamente
      // para que el usuario pueda saltar sin scrollear todas las categorías.
      setShowMenuModal(true)
    }
    // Al cambiar de step, scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, loadTables, loadMenu])

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
      setStep('menu')
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

      // Crear pre-pedido si hay ítems seleccionados
      if (state.orderItems.length > 0) {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservation_id: reservation.id,
            items: state.orderItems,
          }),
        })
      }

      // Redirigir a la pantalla de selección de método de pago
      // (antes se iba directo a MP; ahora el usuario elige tarjeta o MP)
      window.location.href = `/reserva/${reservation.id}/pagar`
    } catch {
      showToast('Error inesperado', 'error')
      setCreating(false)
    }
  }

  // Progreso 1/4 → 2/4 → 3/4 → 4/4
  const stepNum = step === 'datetime' ? 1 : step === 'table' ? 2 : step === 'menu' ? 3 : 4
  const progressBar = (
    <div className="mb-5">
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n}
               className={`h-1 flex-1 rounded-full transition-colors duration-300
                          ${n <= stepNum ? 'bg-c1' : 'bg-sf2'}`} />
        ))}
      </div>
      <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
        Paso {stepNum} de 4 · {step === 'datetime' ? 'Cuándo' : step === 'table' ? 'Mesa' : step === 'menu' ? 'Menú' : 'Confirmar'}
      </p>
    </div>
  )

  // ─── STEP: DATE / TIME / PARTY SIZE ───────────────────────────────────────
  if (step === 'datetime') {
    const selectedDateObj = state.date ? new Date(state.date + 'T12:00:00') : null
    const selectedDateLabel = selectedDateObj
      ? selectedDateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      : null
    const timeActive  = !!state.date
    const partyActive = !!state.timeSlot
    const ctaActive   = !!state.date && !!state.timeSlot

    return (
      <div className="space-y-5 pb-24">
        {progressBar}
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}

        {/* ─── 1. Fecha ─── */}
        <section className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-c1 text-white text-[11px] font-bold flex items-center justify-center">
                {state.date ? '✓' : '1'}
              </span>
              <p className="text-[13px] font-bold text-tx uppercase tracking-wider">Fecha</p>
            </div>
            {selectedDateLabel && (
              <span className="text-[12px] text-c1 font-bold capitalize truncate max-w-[180px]">
                {selectedDateLabel}
              </span>
            )}
          </div>
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
                  onClick={() => {
                    setState(s => ({ ...s, date: d, timeSlot: null }))
                    // Auto-scroll al selector de horario
                    setTimeout(() => scrollToRef(timeRef), 150)
                  }}
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
        </section>

        {/* ─── 2. Horario ─── */}
        <section
          ref={timeRef}
          style={{ opacity: timeActive ? 1 : 0.5, transition: 'opacity 0.3s ease' }}
          className="card p-4 space-y-3 scroll-mt-24"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center
                                ${state.timeSlot ? 'bg-c1 text-white' : timeActive ? 'bg-c1 text-white' : 'bg-sf2 text-tx3'}`}>
                {state.timeSlot ? '✓' : '2'}
              </span>
              <p className="text-[13px] font-bold text-tx uppercase tracking-wider">Horario</p>
            </div>
            {state.timeSlot && (
              <span className="text-[12px] text-c1 font-bold">{state.timeSlot} hs</span>
            )}
          </div>

          {!timeActive ? (
            <p className="text-[12px] text-tx3">Elegí primero la fecha.</p>
          ) : availableSlots.length === 0 ? (
            <div className="bg-c3l border border-[rgba(255,184,0,0.3)] rounded-lg p-3 text-center">
              <p className="text-[#CC7700] text-[12px] font-semibold">
                Reservas cerradas para este turno. Elegí otro día.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => {
                    setState(s => ({ ...s, timeSlot: slot }))
                    // Auto-scroll a Personas (sólo si no está visible ya)
                    scrollToRef(partyRef)
                  }}
                  className={`chip ${state.timeSlot === slot ? 'chip-active' : ''}`}
                >
                  {slot} hs
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ─── 3. Personas ─── */}
        <section
          ref={partyRef}
          style={{ opacity: partyActive ? 1 : 0.5, transition: 'opacity 0.3s ease' }}
          className="card p-4 space-y-3 scroll-mt-24"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center
                                ${partyActive ? 'bg-c1 text-white' : 'bg-sf2 text-tx3'}`}>
                {partyActive ? '✓' : '3'}
              </span>
              <p className="text-[13px] font-bold text-tx uppercase tracking-wider">Personas</p>
            </div>
            {partyActive && (
              <span className="text-[12px] text-c1 font-bold">
                {state.partySize} {state.partySize === 1 ? 'persona' : 'personas'}
              </span>
            )}
          </div>

          {!partyActive ? (
            <p className="text-[12px] text-tx3">Elegí primero el horario.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {PARTY_SIZES.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setState(s => ({ ...s, partySize: n }))
                    scrollToRef(ctaRef)
                  }}
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
          )}
        </section>

        {/* ─── CTA sticky al fondo ─── */}
        <div
          ref={ctaRef}
          className="fixed bottom-0 left-0 right-0 z-40 px-[18px] pt-2 pb-[max(16px,env(safe-area-inset-bottom))]
                     bg-gradient-to-t from-bg via-bg/95 to-bg/0 backdrop-blur-sm
                     pointer-events-none"
        >
          <button
            onClick={() => setStep('table')}
            disabled={!ctaActive}
            className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed pointer-events-auto"
          >
            {ctaActive ? 'Ver mesas disponibles →' : 'Elegí fecha, horario y personas'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP: SELECCIÓN DE MESA ───────────────────────────────────────────────
  if (step === 'table') {
    return (
      <div className="space-y-5">
        {progressBar}
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

  // ─── STEP: PRE-PEDIDO (MENÚ) ──────────────────────────────────────────────
  if (step === 'menu') {
    const orderTotal = state.orderItems.reduce((sum, i) => sum + i.qty * i.unit_price, 0)

    return (
      <div className="space-y-5 relative">
        {progressBar}
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}

        {/* MODAL OMITIR PRE-PEDIDO — aparece al entrar al step menu */}
        {showMenuModal && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
            <button
              aria-label="Cerrar"
              onClick={() => setShowMenuModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <div className="relative bg-bg rounded-2xl w-full max-w-md p-6
                            shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="w-14 h-14 rounded-full bg-c3l flex items-center justify-center mx-auto mb-3">
                <span className="text-[28px]">🍽️</span>
              </div>
              <h3 className="font-display text-[20px] font-bold text-tx text-center">
                ¿Pre-pedir tu menú?
              </h3>
              <p className="text-tx2 text-[14px] text-center mt-2 leading-relaxed">
                Podés adelantar tu pedido para que el restaurante lo tenga listo al llegar.
                O seguir y pedirlo ahí.
              </p>
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => setShowMenuModal(false)}
                  className="btn-primary"
                >
                  Ver menú
                </button>
                <button
                  onClick={() => {
                    setShowMenuModal(false)
                    setStep('summary')
                  }}
                  className="w-full bg-sf text-tx font-semibold text-[15px] py-[15px] px-6
                             rounded-md border border-[var(--br)]
                             active:scale-[0.97] transition-transform duration-[180ms]"
                >
                  Continuar sin pre-pedido
                </button>
              </div>
              <p className="text-center text-tx3 text-[11px] mt-4">
                Podés cambiar esto después
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={() => setStep('table')}
            className="w-9 h-9 rounded-full bg-sf flex items-center justify-center
                       border border-[var(--br)] active:scale-95 transition-transform">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="var(--tx2)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p className="font-semibold text-[15px] text-tx">Pre-pedido (opcional)</p>
            <p className="text-tx3 text-[12px]">El restaurante lo tendrá listo al llegar</p>
          </div>
        </div>

        {loadingMenu ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : menuCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-tx2 text-[14px]">Sin menú disponible por el momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner "Lo de siempre" */}
            {lastOrder.length > 0 && state.orderItems.length === 0 && (
              <div className="card p-4 border-2 border-c3/30 bg-c3l">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] text-[#996600]">¿Lo de siempre?</p>
                    <p className="text-[12px] text-[#CC8800] mt-0.5 line-clamp-2">
                      {lastOrder.map(i => `${i.qty}× ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setState(s => ({ ...s, orderItems: lastOrder }))}
                    className="flex-shrink-0 px-3 py-2 rounded-lg bg-c3 text-white
                               text-[12px] font-bold active:scale-95 transition-transform"
                  >
                    Sí, ese →
                  </button>
                </div>
              </div>
            )}
            {menuCategories.map(cat => {
              const catItems = menuItems.filter(i => i.category_id === cat.id)
              if (catItems.length === 0) return null
              return (
                <div key={cat.id}>
                  <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-3">
                    {cat.name}
                  </p>
                  <div className="space-y-2">
                    {catItems.map(item => {
                      const sel = state.orderItems.find(o => o.menu_item_id === item.id)
                      const qty = sel?.qty ?? 0
                      return (
                        <div key={item.id}
                          className="card p-3.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[14px] text-tx">{item.name}</span>
                              {item.availability_status === 'limited' && (
                                <span className="badge badge-amber">Últimos</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-tx3 text-[12px] mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            <p className="text-c1 font-bold text-[14px] mt-1">
                              ${item.price.toLocaleString('es-AR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {qty > 0 && (
                              <>
                                <button
                                  onClick={() => adjustQty(item, -1)}
                                  className="w-8 h-8 rounded-full bg-sf2 flex items-center justify-center
                                             font-bold text-tx2 text-[18px] active:scale-90 transition-transform"
                                >
                                  −
                                </button>
                                <span className="font-display font-bold text-[18px] text-tx w-5 text-center">
                                  {qty}
                                </span>
                              </>
                            )}
                            <button
                              onClick={() => adjustQty(item, 1)}
                              className="w-8 h-8 rounded-full bg-c1 flex items-center justify-center
                                         font-bold text-white text-[18px] active:scale-90 transition-transform"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Resumen del pedido + CTAs */}
        <div className="space-y-3 pt-1">
          {state.orderItems.length > 0 && (
            <div className="card p-3.5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[13px] text-tx">
                  {state.orderItems.reduce((s, i) => s + i.qty, 0)} ítem{state.orderItems.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''} seleccionados
                </p>
                <p className="text-tx3 text-[12px]">Se abona al llegar</p>
              </div>
              <span className="font-display text-[20px] font-bold text-tx">
                ${orderTotal.toLocaleString('es-AR')}
              </span>
            </div>
          )}
          <button onClick={() => setStep('summary')} className="btn-primary">
            {state.orderItems.length > 0 ? 'Continuar con pre-pedido →' : 'Continuar sin pre-pedido →'}
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP: RESUMEN + CONFIRMAR ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {progressBar}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />}

      <div className="flex items-center gap-3">
        <button onClick={() => setStep('menu')}
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

      {/* Pre-pedido */}
      {state.orderItems.length > 0 && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] font-bold text-tx2">Pre-pedido</p>
            <button onClick={() => setStep('menu')}
              className="text-[12px] text-c4 font-semibold">Editar</button>
          </div>
          {state.orderItems.map(item => (
            <div key={item.menu_item_id} className="flex items-center justify-between">
              <span className="text-[13px] text-tx">
                {item.qty}× {item.name}
              </span>
              <span className="text-[13px] font-semibold text-tx2">
                ${(item.qty * item.unit_price).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
          <div className="border-t border-[var(--br)] pt-2 flex items-center justify-between">
            <span className="text-[13px] font-bold text-tx">Total pre-pedido</span>
            <span className="font-display text-[16px] font-bold text-tx">
              ${state.orderItems.reduce((s, i) => s + i.qty * i.unit_price, 0).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}

      {/* Nota al restaurante */}
      <div className="card p-4">
        <label className="block text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2">
          Nota al restaurante (opcional)
        </label>
        <textarea
          value={guestNote}
          onChange={(e) => setGuestNote(e.target.value.slice(0, 240))}
          placeholder="Ej. alérgico a los mariscos · mesa con silla alta · festejo un cumpleaños…"
          rows={2}
          className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf px-3 py-2
                     text-[13px] text-tx outline-none resize-none
                     focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20"
        />
        <p className="text-[10px] text-tx3 text-right mt-1">{guestNote.length}/240</p>
      </div>

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
