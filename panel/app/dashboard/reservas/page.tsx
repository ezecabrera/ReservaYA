'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReservationActionSheet,
  type ReservationRow,
} from '@/components/reservas/ReservationActionSheet'
import { EditReservationSheet } from '@/components/reservas/EditReservationSheet'
import { AddWaitlistSheet } from '@/components/reservas/AddWaitlistSheet'
import { WaitlistTab } from '@/components/reservas/WaitlistTab'
import { GuestTagChip } from '@/components/crm/GuestTagChip'
import { RateGuestSheet } from '@/components/reservas/RateGuestSheet'
import { PageHero } from '@/components/ui/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconWineGlass, IconOpenBook } from '@/components/ui/Icons'

type Reservation = ReservationRow & { table_id: string }
type Tab = 'reservas' | 'espera'

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  confirmed:       { label: 'Confirmada',  cls: 'bg-[#6A85C7]/18 text-[#9AAEE0]' },
  checked_in:      { label: 'Check-in',    cls: 'bg-[#5BAF94]/20 text-[#7BD3B2]' },
  pending_payment: { label: 'Pendiente',   cls: 'bg-[#E5A332]/18 text-[#F3C773]' },
  no_show:         { label: 'No-show',     cls: 'bg-[#E5545E]/20 text-[#FF8A91]' },
  cancelled:       { label: 'Cancelada',   cls: 'bg-white/8 text-white/45' },
}

const SOURCE_BADGE: Record<string, string> = {
  walkin: 'Walk-in',
  phone:  'Teléfono',
  panel:  'Manual',
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function displayName(r: Reservation) {
  return r.users?.name ?? r.guest_name ?? 'Sin nombre'
}

function matchesSearch(r: Reservation, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase().trim()
  const name = (r.users?.name ?? r.guest_name ?? '').toLowerCase()
  const phone = (r.users?.phone ?? r.guest_phone ?? '').toLowerCase()
  return name.includes(needle) || phone.includes(needle)
}

export default function ReservasPage() {
  const today = toLocalDateString(new Date())
  const [tab, setTab] = useState<Tab>('reservas')
  const [date, setDate] = useState(today)
  const [search, setSearch] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  // showNewSheet se usa solo para compatibilidad con el click-a-row → editar.
  // La creación de reservas la maneja NewReservationTrigger del layout.
  const [showWaitlistSheet, setShowWaitlistSheet] = useState(false)
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [ratingReservation, setRatingReservation] = useState<Reservation | null>(null)
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const [waitlistReloadToken, setWaitlistReloadToken] = useState(0)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reservas?date=${date}`)
      const data = await res.json()
      setReservations(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [date])

  const fetchWaitlistCount = useCallback(async () => {
    try {
      const res = await fetch('/api/waitlist')
      const data = await res.json()
      setWaitlistCount(Array.isArray(data) ? data.length : 0)
    } catch {
      setWaitlistCount(null)
    }
  }, [])

  useEffect(() => { fetchReservations() }, [fetchReservations])

  // Cuando el NewReservationTrigger global crea una reserva, refrescamos la lista.
  useEffect(() => {
    const handler = () => fetchReservations()
    window.addEventListener('reservation:created', handler)
    return () => window.removeEventListener('reservation:created', handler)
  }, [fetchReservations])
  useEffect(() => { fetchWaitlistCount() }, [fetchWaitlistCount, waitlistReloadToken])

  // Filtrado local por búsqueda + agrupado por slot
  const filtered = useMemo(
    () => reservations.filter((r) => matchesSearch(r, search)),
    [reservations, search],
  )

  const bySlot: Record<string, Reservation[]> = {}
  filtered.forEach((r) => {
    if (!bySlot[r.time_slot]) bySlot[r.time_slot] = []
    bySlot[r.time_slot].push(r)
  })
  const slots = Object.keys(bySlot).sort()

  const total = reservations.length
  const confirmed = reservations.filter((r) => ['confirmed', 'checked_in'].includes(r.status)).length
  const checkedIn = reservations.filter((r) => r.status === 'checked_in').length

  const prettyDate = (() => {
    const [y, m, d] = date.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  })()

  return (
    <div className="min-h-screen pb-28 bg-ink">

      <PageHero
        kicker={tab === 'reservas' ? 'Agenda' : 'Piso'}
        title={tab === 'reservas' ? 'Reservas' : 'Lista de espera'}
        subtitle={tab === 'reservas'
          ? `${prettyDate} · ${confirmed} confirmadas · ${checkedIn} check-ins`
          : waitlistCount !== null
            ? `${waitlistCount} grupo${waitlistCount !== 1 ? 's' : ''} esperando`
            : undefined}
        accent="coral"
      >
        {/* Segmented control */}
        <div className="bg-white/[0.06] border border-white/10 rounded-xl p-1 flex gap-1 max-w-xs">
          <button
            type="button"
            onClick={() => setTab('reservas')}
            className={`flex-1 h-9 rounded-lg text-[12.5px] font-bold transition-colors ${
              tab === 'reservas' ? 'bg-white text-[#16213E]' : 'text-white/55'
            }`}
          >
            Reservas
          </button>
          <button
            type="button"
            onClick={() => setTab('espera')}
            className={`flex-1 h-9 rounded-lg text-[12.5px] font-bold transition-colors
                        flex items-center justify-center gap-1.5 ${
              tab === 'espera' ? 'bg-white text-[#16213E]' : 'text-white/55'
            }`}
          >
            Espera
            {waitlistCount !== null && waitlistCount > 0 && (
              <span className="text-[9.5px] font-bold rounded-full min-w-[16px] h-[16px]
                               flex items-center justify-center px-1 bg-wine text-white">
                {waitlistCount}
              </span>
            )}
          </button>
        </div>
      </PageHero>

      {tab === 'reservas' && (
        <div className="px-5 pt-5 space-y-3">
          {/* Date + search en una fila */}
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-3.5 py-2.5
                         text-[13px] text-white outline-none focus:border-white/25
                         transition-colors"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="relative">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="w-full rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-4 py-2.5
                         text-[13px] text-white placeholder:text-white/35 outline-none
                         focus:border-white/25 focus:bg-white/[0.08] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                           bg-white/10 text-white/70 flex items-center justify-center
                           text-[11px] font-bold"
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      <main className="px-5 pt-4">
        {tab === 'reservas' ? (
          loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-ink-2 border border-ink-line rounded-2xl animate-pulse reveal-stagger"
                  style={{ '--i': i } as React.CSSProperties}
                />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState
              accent="coral"
              title="Servicio sin reservas"
              description="Arrancás con el salón limpio. Tocá el + para cargar una walk-in o una llamada."
              icon={<IconWineGlass size={28} />}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              accent="coral"
              title="Sin resultados"
              description={`Nada coincide con "${search}". Probá otro nombre o teléfono.`}
              icon={<IconOpenBook size={28} />}
            />
          ) : (
            <div className="space-y-6">
              {slots.map((slot) => (
                <section key={slot}>
                  <header className="flex items-baseline justify-between mb-3">
                    <h2 className="font-display text-[16px] font-bold text-white tracking-tight">
                      {slot.slice(0, 5)}<span className="text-white/35 font-normal"> hs</span>
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/35">
                      {bySlot[slot].length} {bySlot[slot].length === 1 ? 'reserva' : 'reservas'}
                    </span>
                  </header>
                  <div className="space-y-2">
                    {bySlot[slot].map((r, idx) => {
                      const st = STATUS_STYLE[r.status] ?? { label: r.status, cls: 'bg-white/10 text-white/55' }
                      const sourceBadge = r.source && r.source !== 'app' ? SOURCE_BADGE[r.source] : null
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setActiveReservation(r)}
                          className="w-full text-left bg-white/[0.04] border border-white/8 rounded-2xl
                                     px-4 py-3.5 flex items-center gap-4 active:bg-white/[0.08]
                                     hover:border-white/15 transition-all duration-200"
                          style={{
                            opacity: 0,
                            animation: `fadeInUp 380ms ${Math.min(idx * 35, 500)}ms cubic-bezier(.2,1,.3,1) forwards`,
                          }}
                        >
                          <div className="w-11 h-11 rounded-xl bg-white/8 border border-white/10
                                          flex items-center justify-center flex-shrink-0">
                            <span className="font-display font-bold text-[15px] text-white tracking-tight">
                              {r.tables?.label ?? '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-white font-semibold text-[14px] truncate">
                                {displayName(r)}
                              </p>
                              {r.guest_tag && <GuestTagChip tag={r.guest_tag} />}
                              {sourceBadge && (
                                <span className="text-[9.5px] font-bold uppercase tracking-wide
                                                 px-1.5 py-0.5 rounded bg-white/8 text-white/55">
                                  {sourceBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-white/40 text-[12px]">
                              {r.party_size} persona{r.party_size !== 1 ? 's' : ''}
                              {r.guest_phone && !r.users ? ` · ${r.guest_phone}` : ''}
                            </p>
                            {r.notes && (
                              <p className="text-white/50 text-[11.5px] mt-1 italic line-clamp-1">
                                {r.notes}
                              </p>
                            )}
                          </div>
                          <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${st.cls}`}>
                            {st.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : (
          <WaitlistTab reloadToken={waitlistReloadToken} />
        )}
      </main>

      {/*
        FAB local — solo para tab="espera" (agregar a lista de espera).
        Nueva reserva la maneja el FAB global del layout (`NewReservationTrigger`).
        Color olive para diferenciarlo del wine del global.
      */}
      {tab === 'espera' && (
        <button
          type="button"
          onClick={() => setShowWaitlistSheet(true)}
          aria-label="Agregar a la espera"
          className="fixed right-5 z-40 w-14 h-14 rounded-full bg-olive text-white
                     shadow-[0_12px_28px_-4px_rgba(79,138,95,0.55)]
                     flex items-center justify-center active:scale-95 transition-transform
                     lg:hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showWaitlistSheet && (
        <AddWaitlistSheet
          onClose={() => setShowWaitlistSheet(false)}
          onCreated={() => {
            setShowWaitlistSheet(false)
            setWaitlistReloadToken((n) => n + 1)
          }}
        />
      )}

      {activeReservation && !editingReservation && !ratingReservation && (
        <ReservationActionSheet
          reservation={activeReservation}
          onClose={() => setActiveReservation(null)}
          onUpdated={() => {
            setActiveReservation(null)
            fetchReservations()
          }}
          onEdit={() => setEditingReservation(activeReservation)}
          onRateGuest={() => setRatingReservation(activeReservation)}
        />
      )}

      {ratingReservation && (
        <RateGuestSheet
          reservationId={ratingReservation.id}
          guestName={displayName(ratingReservation)}
          onClose={() => setRatingReservation(null)}
          onRated={() => {
            setRatingReservation(null)
            setActiveReservation(null)
          }}
        />
      )}

      {editingReservation && (
        <EditReservationSheet
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onUpdated={() => {
            setEditingReservation(null)
            setActiveReservation(null)
            fetchReservations()
          }}
        />
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
