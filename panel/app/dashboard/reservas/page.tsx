'use client'

import { useEffect, useState } from 'react'
import { PanelNav } from '@/components/nav/PanelNav'

interface Reservation {
  id: string
  status: string
  date: string
  time_slot: string
  party_size: number
  tables: { label: string } | null
  users: { name: string } | null
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  confirmed:       { label: 'Confirmada',  cls: 'bg-c4l text-[#2B5FCC]' },
  checked_in:      { label: 'Check-in',    cls: 'bg-c2l text-[#15A67A]' },
  pending_payment: { label: 'Pendiente',   cls: 'bg-c3l text-[#CC7700]' },
  no_show:         { label: 'No-show',     cls: 'bg-c1l text-[#D63646]' },
  cancelled:       { label: 'Cancelada',   cls: 'bg-sf2 text-tx3' },
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ReservasPage() {
  const today = toLocalDateString(new Date())
  const [date, setDate] = useState(today)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reservas?date=${date}`)
      .then(r => r.json())
      .then(d => { setReservations(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [date])

  // Agrupar por turno
  const bySlot: Record<string, Reservation[]> = {}
  reservations.forEach(r => {
    if (!bySlot[r.time_slot]) bySlot[r.time_slot] = []
    bySlot[r.time_slot].push(r)
  })
  const slots = Object.keys(bySlot).sort()

  const total = reservations.length
  const confirmed = reservations.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length
  const checkedIn = reservations.filter(r => r.status === 'checked_in').length

  return (
    <div className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-[24px] font-bold text-white tracking-tight">Reservas</h1>
        {!loading && (
          <p className="text-white/55 text-[13px] mt-0.5">
            {confirmed} confirmadas · {checkedIn} check-ins · {total} total
          </p>
        )}
      </div>

      {/* Selector de fecha */}
      <div className="px-5 mb-5">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3
                     text-[14px] text-white outline-none focus:border-c2/50 transition-all"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-[15px]">Sin reservas para este día</p>
        </div>
      ) : (
        <div className="px-5 space-y-6">
          {slots.map(slot => (
            <div key={slot}>
              <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
                {slot} hs — {bySlot[slot].length} reserva{bySlot[slot].length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {bySlot[slot].map(r => {
                  const st = STATUS_STYLE[r.status] ?? { label: r.status, cls: 'bg-sf2 text-tx3' }
                  return (
                    <div key={r.id}
                      className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5
                                 flex items-center gap-4">
                      {/* Mesa */}
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-[16px] text-white">
                          {r.tables?.label ?? '?'}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-[14px] truncate">
                          {r.users?.name ?? 'Sin nombre'}
                        </p>
                        <p className="text-white/40 text-[12px]">
                          {r.party_size} persona{r.party_size !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {/* Badge de estado */}
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <PanelNav />
    </div>
  )
}
