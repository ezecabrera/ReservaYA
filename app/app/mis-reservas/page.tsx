'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BottomNav } from '@/components/ui/BottomNav'
import { RateVenueSheet } from '@/components/rating/RateVenueSheet'
import { PageHero } from '@/components/ui/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'

interface Reservation {
  id: string
  status: string
  date: string
  time_slot: string
  party_size: number
  qr_token: string | null
  cancelled_by: 'user' | 'venue' | 'system' | null
  venues: { id: string; name: string; address: string } | null
  tables: { label: string } | null
}

const STATUS_STYLE: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed:       { label: 'Confirmada',  cls: 'badge-blue',   dot: 'bg-olive' },
  checked_in:      { label: 'Asistida',    cls: 'badge-green',  dot: 'bg-olive' },
  pending_payment: { label: 'Pendiente',   cls: 'badge-amber',  dot: 'bg-gold' },
  no_show:         { label: 'No asistí',   cls: 'badge-red',    dot: 'bg-wine' },
  cancelled:       { label: 'Cancelada',   cls: 'badge',        dot: 'bg-tx3' },
}

function isUpcoming(date: string, timeSlot: string) {
  const [h, m] = timeSlot.split(':').map(Number)
  const dt = new Date(date + 'T00:00:00')
  dt.setHours(h, m)
  return dt.getTime() > Date.now()
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
  const [ratingTarget, setRatingTarget] = useState<Reservation | null>(null)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mis-reservas')
      const data = await res.json()
      setReservations(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const proximas = reservations.filter(r =>
    isUpcoming(r.date, r.time_slot) && r.status !== 'cancelled'
  )
  const pasadas = reservations.filter(r =>
    !isUpcoming(r.date, r.time_slot) || r.status === 'cancelled'
  )
  const list = tab === 'proximas' ? proximas : pasadas

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHero
        kicker="Mi agenda"
        title="Mis reservas"
        subtitle={tab === 'proximas'
          ? `${proximas.length} próxima${proximas.length !== 1 ? 's' : ''}`
          : `${pasadas.length} en historial`}
        accent="coral"
      >
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[var(--br)] rounded-xl p-1 shadow-[var(--sh-sm)]">
          {([['proximas', 'Próximas'], ['pasadas', 'Historial']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-[12.5px] font-bold transition-all duration-[180ms]
                          flex items-center justify-center gap-1.5
                          ${tab === key ? 'bg-tx text-white' : 'text-tx3'}`}
            >
              {label}
              {key === 'proximas' && proximas.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                  ${tab === 'proximas' ? 'bg-wine text-white' : 'bg-sf2 text-tx3'}`}>
                  {proximas.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </PageHero>

      {/* Lista */}
      <div className="screen-x pt-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))
        ) : list.length === 0 ? (
          tab === 'proximas' ? (
            <EmptyState
              accent="coral"
              title="Sin reservas próximas"
              description="¿Salimos a comer? Encontrá tu próximo lugar ahora."
              action={{ label: 'Explorar restaurantes', href: '/' }}
              icon={(
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            />
          ) : (
            <EmptyState
              accent="amber"
              title="Sin historial todavía"
              description="Tus reservas pasadas aparecerán acá."
              icon={(
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            />
          )
        ) : (
          list.map(r => {
            const st = STATUS_STYLE[r.status] ?? { label: r.status, cls: 'badge', dot: 'bg-tx3' }
            const upcoming = isUpcoming(r.date, r.time_slot)
            return (
              <div key={r.id} className="card overflow-hidden">
                {/* Franja superior */}
                <div className={`h-1 ${upcoming ? 'bg-wine' : 'bg-sf2'}`} />
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
                      {r.time_slot} hs
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
                        className="flex-1 text-center py-2 rounded-lg bg-wine/10 text-wine
                                   text-[12px] font-bold border border-wine/25
                                   hover:bg-wine/15 active:scale-95 transition-all"
                      >
                        Reservar de nuevo
                      </Link>
                    </div>
                  )}
                  {!upcoming && r.status === 'checked_in' && r.venues && (
                    <div className="mt-3 pt-3 border-t border-[var(--br)] flex gap-2">
                      {!ratedIds.has(r.id) && (
                        <button
                          type="button"
                          onClick={() => setRatingTarget(r)}
                          className="flex-1 text-center py-2 rounded-lg bg-gold/15 text-gold
                                     text-[12px] font-bold border border-gold/35
                                     hover:bg-gold/25 active:scale-95 transition-all
                                     flex items-center justify-center gap-1.5"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Calificar
                        </button>
                      )}
                      <Link
                        href={`/${r.venues.id}`}
                        className="flex-1 text-center py-2 rounded-lg bg-sf text-tx2
                                   text-[12px] font-semibold border border-[var(--br)]
                                   active:scale-95 transition-transform"
                      >
                        Volver a reservar →
                      </Link>
                    </div>
                  )}
                  {r.status === 'cancelled' && r.cancelled_by === 'venue' && r.venues && !ratedIds.has(r.id) && (
                    <div className="mt-3 pt-3 border-t border-[var(--br)]">
                      <button
                        type="button"
                        onClick={() => setRatingTarget(r)}
                        className="w-full text-center py-2 rounded-lg bg-wine/10 text-wine
                                   text-[12px] font-bold border border-wine/25
                                   hover:bg-wine/15 active:scale-95 transition-all"
                      >
                        El local canceló · dejar reseña
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {ratingTarget && ratingTarget.venues && (
        <RateVenueSheet
          reservationId={ratingTarget.id}
          venueName={ratingTarget.venues.name}
          context={ratingTarget.status === 'cancelled' ? 'unilateral_cancel' : 'visit'}
          onClose={() => setRatingTarget(null)}
          onRated={() => {
            setRatedIds((prev) => new Set(prev).add(ratingTarget.id))
            setRatingTarget(null)
          }}
        />
      )}

      <BottomNav />
    </div>
  )
}
