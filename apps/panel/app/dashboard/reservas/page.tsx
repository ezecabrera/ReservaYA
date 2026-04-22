'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'

interface Reservation {
  id: string
  status: string
  date: string
  time_slot: string
  party_size: number
  tables: { label: string } | null
  users: { name: string } | null
}

type StatusTone = 'confirmed' | 'checked_in' | 'pending' | 'no_show' | 'cancelled'

const STATUS_STYLE: Record<string, { label: string; tone: StatusTone }> = {
  confirmed:       { label: 'Confirmada', tone: 'confirmed' },
  checked_in:      { label: 'Check-in',   tone: 'checked_in' },
  pending_payment: { label: 'Pendiente',  tone: 'pending' },
  no_show:         { label: 'No-show',    tone: 'no_show' },
  cancelled:       { label: 'Cancelada',  tone: 'cancelled' },
}

const TONE_CLS: Record<StatusTone, string> = {
  confirmed:  'bg-[#0F3460]/[0.08] text-[#0F3460] border-[#0F3460]/15',
  checked_in: 'bg-c2l text-[#15A67A] border-[#15A67A]/20',
  pending:    'bg-c3l text-[#CC7700] border-[#CC7700]/20',
  no_show:    'bg-c1l text-[#D63646] border-[#D63646]/20',
  cancelled:  'bg-sf2 text-tx3 border-[rgba(0,0,0,0.08)]',
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Mock preview ─────────────────────────────────────────────────────────────

const PREVIEW_RESERVATIONS: Reservation[] = [
  { id: '1', status: 'confirmed',       date: 'x', time_slot: '20:30', party_size: 2, tables: { label: 'S2' }, users: { name: 'Martín García' } },
  { id: '2', status: 'confirmed',       date: 'x', time_slot: '20:30', party_size: 4, tables: { label: 'T1' }, users: { name: 'Sofía López' } },
  { id: '3', status: 'checked_in',      date: 'x', time_slot: '20:30', party_size: 3, tables: { label: 'S4' }, users: { name: 'Lucas P.' } },
  { id: '4', status: 'pending_payment', date: 'x', time_slot: '21:00', party_size: 2, tables: { label: 'B1' }, users: { name: 'Camila R.' } },
  { id: '5', status: 'confirmed',       date: 'x', time_slot: '21:00', party_size: 6, tables: { label: 'T2' }, users: { name: 'Familia Méndez' } },
  { id: '6', status: 'no_show',         date: 'x', time_slot: '21:30', party_size: 2, tables: { label: 'S3' }, users: { name: 'Diego F.' } },
  { id: '7', status: 'confirmed',       date: 'x', time_slot: '22:00', party_size: 4, tables: { label: 'T3' }, users: { name: 'Ana Torres' } },
]

export default function ReservasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sf" />}>
      <ReservasInner />
    </Suspense>
  )
}

function ReservasInner() {
  const searchParams = useSearchParams()
  const isPreview = process.env.NODE_ENV !== 'production' && searchParams.has('preview')

  const today = toLocalDateString(new Date())
  const [date, setDate] = useState(today)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(!isPreview)

  useEffect(() => {
    if (isPreview) {
      setReservations(PREVIEW_RESERVATIONS)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/reservas?date=${date}`)
      .then(r => r.json())
      .then(d => { setReservations(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [date, isPreview])

  const bySlot = useMemo(() => {
    const m: Record<string, Reservation[]> = {}
    reservations.forEach(r => {
      if (!m[r.time_slot]) m[r.time_slot] = []
      m[r.time_slot].push(r)
    })
    return m
  }, [reservations])

  const slots = Object.keys(bySlot).sort()
  const total = reservations.length
  const confirmed = reservations.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length
  const checkedIn = reservations.filter(r => r.status === 'checked_in').length
  const pending = reservations.filter(r => r.status === 'pending_payment').length

  return (
    <div className="min-h-screen bg-sf pb-20">
      <PageHeader
        title="Reservas"
        subtitle={formatDay(date)}
        venueName={isPreview ? 'La Cantina de Martín' : undefined}
      />
      {!loading && total > 0 && (
        <div className="max-w-3xl mx-auto px-5 pt-5 flex flex-wrap gap-2">
          <InlineStat label="Total" value={total} />
          <InlineStat label="Confirmadas" value={confirmed} tone="confirmed" />
          <InlineStat label="Check-ins" value={checkedIn} tone="checked_in" />
          {pending > 0 && <InlineStat label="Pendientes" value={pending} tone="pending" />}
        </div>
      )}

      {/* Selector de fecha */}
      <div className="max-w-3xl mx-auto px-5 pt-4">
        <label className="block text-[11px] font-semibold text-tx2 uppercase tracking-wider mb-1.5">
          Día
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3
                     text-[14px] text-tx outline-none
                     focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                     transition-colors duration-[160ms]"
        />
      </div>

      {/* Lista */}
      <main className="max-w-3xl mx-auto px-5 pt-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-white rounded-md border border-[rgba(0,0,0,0.07)] animate-pulse" />
            ))}
          </div>
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {slots.map(slot => (
              <section key={slot}>
                <div className="flex items-baseline justify-between mb-2.5">
                  <p className="font-sans-black text-[18px] text-tx leading-none tabular-nums">
                    {slot} hs
                  </p>
                  <span className="text-[12px] text-tx3 font-semibold">
                    {bySlot[slot].length} reserva{bySlot[slot].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {bySlot[slot].map(r => <ReservationRow key={r.id} r={r} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Componentes ──────────────────────────────────────────────────────────────

function ReservationRow({ r }: { r: Reservation }) {
  const style = STATUS_STYLE[r.status] ?? { label: r.status, tone: 'cancelled' as StatusTone }
  return (
    <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)]
                    px-4 py-3 flex items-center gap-3
                    hover:border-[#0F3460]/30 transition-colors duration-[160ms]">
      {/* Mesa */}
      <div className="w-11 h-11 rounded-md bg-sf border border-[rgba(0,0,0,0.08)]
                      flex items-center justify-center flex-shrink-0">
        <span className="font-display text-[15px] text-tx">{r.tables?.label ?? '—'}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-tx font-semibold text-[14px] truncate">
          {r.users?.name ?? 'Sin nombre'}
        </p>
        <p className="text-tx2 text-[12px]">
          {r.party_size} persona{r.party_size !== 1 ? 's' : ''}
        </p>
      </div>
      {/* Badge */}
      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${TONE_CLS[style.tone]}`}>
        {style.label}
      </span>
    </div>
  )
}

function InlineStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: StatusTone
}) {
  const toneDot = tone ? {
    confirmed:  'bg-[#0F3460]',
    checked_in: 'bg-[#15A67A]',
    pending:    'bg-[#CC7700]',
    no_show:    'bg-[#D63646]',
    cancelled:  'bg-tx3',
  }[tone] : 'bg-tx3'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sf border border-[rgba(0,0,0,0.08)] px-2.5 py-1">
      <span className={`w-1.5 h-1.5 rounded-full ${toneDot}`} />
      <span className="text-tx text-[12px] font-semibold tabular-nums">{value}</span>
      <span className="text-tx2 text-[12px]">{label}</span>
    </span>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" stroke="#ABABBA" strokeWidth="2" />
          <path d="M16 2v4M8 2v4M3 10h18" stroke="#ABABBA" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-display text-[18px] text-tx">Sin reservas</p>
      <p className="text-tx2 text-[13px] mt-1">No hay reservas para este día.</p>
    </div>
  )
}
