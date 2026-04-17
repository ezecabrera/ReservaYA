'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/BottomNav'
import { Countdown } from '@/components/lab/Countdown'

interface Reservation {
  id: string
  status: string
  date: string
  time_slot: string
  party_size: number
  qr_token: string | null
  venues: { id: string; name: string; address: string } | null
  tables: { label: string } | null
}

const STATUS_STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed:       { label: 'Confirmada',  cls: 'badge-blue',   dot: 'bg-c4' },
  checked_in:      { label: 'Asistida',    cls: 'badge-green',  dot: 'bg-c2' },
  pending_payment: { label: 'Pendiente',   cls: 'badge-amber',  dot: 'bg-c3' },
  no_show:         { label: 'No asistí',   cls: 'badge-red',    dot: 'bg-c1' },
  cancelled:       { label: 'Cancelada',   cls: 'badge',        dot: 'bg-tx3' },
}

function isUpcoming(date: string, timeSlot: string) {
  const [h, m] = timeSlot.split(':').map(Number)
  const dt = new Date(date + 'T00:00:00')
  dt.setHours(h, m)
  return dt.getTime() > Date.now()
}

/** Normaliza time_slot de "HH:MM:SS" a "HH:MM" */
function formatTime(timeSlot: string): string {
  return timeSlot.slice(0, 5)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export default function MisReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'proximas' | 'pasadas'>('proximas')

  useEffect(() => {
    fetch('/api/mis-reservas')
      .then(r => r.json())
      .then(d => { setReservations(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const proximas = reservations.filter(r =>
    isUpcoming(r.date, r.time_slot) && r.status !== 'cancelled'
  ).sort((a, b) => {
    const tA = new Date(`${a.date}T${a.time_slot}:00`).getTime()
    const tB = new Date(`${b.date}T${b.time_slot}:00`).getTime()
    return tA - tB
  })
  const pasadas = reservations.filter(r =>
    !isUpcoming(r.date, r.time_slot) || r.status === 'cancelled'
  )
  const list = tab === 'proximas' ? proximas : pasadas
  const nextUp = proximas.find(r => r.status === 'confirmed' || r.status === 'pending_payment')

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <div className="screen-x pt-14 pb-4">
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">
          Mis reservas
        </h1>
      </div>

      {/* Hero countdown para próxima reserva */}
      {!loading && nextUp && tab === 'proximas' && (
        <div className="screen-x mb-5">
          <Link
            href={`/reserva/${nextUp.id}/confirmacion`}
            className="block active:scale-[0.99] transition-transform duration-[180ms] space-y-3"
          >
            <div className="bg-white rounded-2xl p-5 border border-[var(--br)] shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-c1 animate-pulse" />
                <p className="text-tx3 text-[10px] font-bold uppercase tracking-[0.15em]">
                  Tu próxima salida
                </p>
              </div>
              <p className="font-display text-[22px] font-bold text-tx leading-tight">
                {nextUp.venues?.name ?? 'Reserva'}
              </p>
              <p className="text-tx2 text-[12px] mt-0.5">
                {formatDate(nextUp.date)} · {formatTime(nextUp.time_slot)} hs · Mesa {nextUp.tables?.label}
              </p>
            </div>
            <Countdown date={nextUp.date} time={formatTime(nextUp.time_slot)} />
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="screen-x mb-5">
        <div className="flex gap-2 bg-sf rounded-xl p-1">
          {([['proximas', 'Próximas'], ['pasadas', 'Historial']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-[180ms]
                          ${tab === key
                            ? 'bg-white shadow-sm text-tx'
                            : 'text-tx3'
                          }`}
            >
              {label}
              {key === 'proximas' && proximas.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                                  ${tab === 'proximas' ? 'bg-c1 text-white' : 'bg-sf2 text-tx3'}`}>
                  {proximas.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="screen-x space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            {tab === 'proximas' ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-sf2 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--tx3)" strokeWidth="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="font-semibold text-[15px] text-tx">Sin reservas próximas</p>
                <p className="text-tx3 text-[13px] mt-1">¿Salimos a comer?</p>
                <Link href="/" className="btn-primary mt-5 block">
                  Explorar restaurantes
                </Link>
              </>
            ) : (
              <>
                <p className="font-semibold text-[15px] text-tx">Sin historial todavía</p>
                <p className="text-tx3 text-[13px] mt-1">Tus reservas pasadas aparecerán acá</p>
              </>
            )}
          </div>
        ) : (
          list.map(r => {
            const st = STATUS_STYLE[r.status] ?? { label: r.status, cls: 'badge', dot: 'bg-tx3' }
            const upcoming = isUpcoming(r.date, r.time_slot)
            return (
              <div key={r.id} className="card overflow-hidden">
                {/* Franja superior */}
                <div className={`h-1 ${upcoming ? 'bg-c1' : 'bg-sf2'}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-tx truncate">
                        {r.venues?.name ?? 'Restaurante'}
                      </p>
                      <p className="text-tx3 text-[12px] mt-0.5 truncate">
                        {r.venues?.address}
                      </p>
                    </div>
                    <span className={`${st.cls} flex-shrink-0`}>{st.label}</span>
                  </div>

                  <div className="flex items-center gap-4 text-[13px] text-tx2">
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {formatDate(r.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {formatTime(r.time_slot)} hs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      {r.party_size}
                    </span>
                    <span className="ml-auto font-display font-bold text-[15px] text-tx">
                      {r.tables?.label}
                    </span>
                  </div>

                  {/* CTA según estado */}
                  {upcoming && r.status === 'confirmed' && r.venues && (
                    <div className="mt-3 pt-3 border-t border-[var(--br)] flex gap-2">
                      <Link
                        href={`/reserva/${r.id}/confirmacion`}
                        className="flex-1 text-center py-2 rounded-lg bg-sf text-tx2
                                   text-[12px] font-semibold border border-[var(--br)]
                                   active:scale-95 transition-transform"
                      >
                        Ver QR
                      </Link>
                      <Link
                        href={`/${r.venues.id}`}
                        className="flex-1 text-center py-2 rounded-lg bg-c1l text-c1
                                   text-[12px] font-bold border border-c1/20
                                   active:scale-95 transition-transform"
                      >
                        Reservar de nuevo
                      </Link>
                    </div>
                  )}
                  {!upcoming && r.status === 'checked_in' && r.venues && (
                    <div className="mt-3 pt-3 border-t border-[var(--br)]">
                      <Link
                        href={`/${r.venues.id}`}
                        className="block text-center py-2 rounded-lg bg-sf text-tx2
                                   text-[12px] font-semibold border border-[var(--br)]
                                   active:scale-95 transition-transform"
                      >
                        Volver a reservar →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <BottomNav />
    </div>
  )
}
