'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { GuestProfile } from '@/lib/shared'
import { GuestTagChip } from '@/components/crm/GuestTagChip'

interface HistoryRow {
  id: string
  date: string
  time_slot: string
  party_size: number
  status: string
  source: string | null
  cancelled_by: string | null
  notes: string | null
  table_label: string | null
}

interface RatingRow {
  id: string
  stars: number
  comment: string | null
  created_at: string
  reservation_id: string
}

interface EventRow {
  id: string
  reservation_id: string
  event_type: 'created' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show' | 'edited' | 'reverted'
  actor_role: 'user' | 'staff' | 'system' | null
  notes: string | null
  diff_json: { from: Record<string, unknown>; to: Record<string, unknown> } | null
  created_at: string
}

interface Response {
  profile: GuestProfile
  history: HistoryRow[]
  ratings: RatingRow[]
  events: EventRow[]
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  confirmed:       { label: 'Confirmada',  cls: 'bg-c4l text-[#2B5FCC]' },
  checked_in:      { label: 'Visitó',      cls: 'bg-c2l text-[#15A67A]' },
  pending_payment: { label: 'Pendiente',   cls: 'bg-c3l text-[#CC7700]' },
  no_show:         { label: 'No-show',     cls: 'bg-c1l text-[#D63646]' },
  cancelled:       { label: 'Cancelada',   cls: 'bg-white/10 text-white/55' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function GuestDetailPage() {
  const params = useParams<{ key: string }>()
  const key = params?.key ?? ''

  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!key) return
    fetch(`/api/crm/guests/${encodeURIComponent(key)}`)
      .then(async (r) => {
        if (!r.ok) {
          const b = await r.json().catch(() => ({}))
          throw new Error(b.error ?? 'Error')
        }
        return r.json()
      })
      .then((d: Response) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [key])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink pb-28 px-5 pt-12">
        <div
          className="h-8 w-48 bg-ink-2 border border-ink-line rounded animate-pulse mb-5 reveal-stagger"
          style={{ '--i': 0 } as React.CSSProperties}
        />
        <div
          className="h-28 bg-ink-2 border border-ink-line rounded-2xl animate-pulse mb-5 reveal-stagger"
          style={{ '--i': 1 } as React.CSSProperties}
        />
        <div
          className="h-40 bg-ink-2 border border-ink-line rounded-2xl animate-pulse reveal-stagger"
          style={{ '--i': 2 } as React.CSSProperties}
        />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pb-28 px-5 pt-12 flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>
        <p className="text-white/60 text-[14px]">{error ?? 'Comensal no encontrado'}</p>
        <Link href="/dashboard/crm" className="text-c2 text-[13px] font-semibold">
          ← Volver a comensales
        </Link>
      </div>
    )
  }

  const { profile, history, ratings, events } = data
  const isUser = profile.key.startsWith('user:')

  return (
    <div className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      {/* Header con back */}
      <div className="px-5 pt-12 pb-4">
        <Link
          href="/dashboard/crm"
          className="inline-flex items-center gap-1.5 text-white/60 text-[12.5px] mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Comensales
        </Link>
        <h1 className="font-display text-[24px] font-bold text-white tracking-tight">
          {profile.name}
        </h1>
        {profile.phone && (
          <p className="text-white/55 text-[13px] mt-0.5">{profile.phone}</p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {profile.tags.map((tag) => (
            <GuestTagChip key={tag} tag={tag} />
          ))}
          {!isUser && (
            <span className="text-[9.5px] font-bold uppercase tracking-wide
                             px-1.5 py-0.5 rounded bg-white/10 text-white/55">
              Sin cuenta
            </span>
          )}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Visitas" value={profile.stats.visits_completed} accent="text-c2" />
          <StatCard label="Total reservas" value={profile.stats.total_reservations} />
          <StatCard
            label="No-shows"
            value={profile.stats.no_shows}
            accent={profile.stats.no_shows > 0 ? 'text-c1' : undefined}
          />
          <StatCard label="Prom. pax" value={profile.stats.avg_party_size || '—'} />
          <StatCard label="Primera visita" value={formatDate(profile.first_seen_date)} small />
          <StatCard label="Última visita" value={formatDate(profile.stats.last_visit_date)} small />
        </div>

        {/* Ratings internos del venue a este cliente */}
        {ratings.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              Calificaciones internas ({ratings.length})
            </p>
            <div className="space-y-2">
              {ratings.map((r) => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <svg key={n} width="13" height="13" viewBox="0 0 24 24"
                          fill={n <= r.stars ? '#E8B51A' : 'rgba(255,255,255,0.15)'}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-white/40 text-[11px]">{formatCreated(r.created_at)}</span>
                  </div>
                  {r.comment && (
                    <p className="text-white/80 text-[13px] leading-snug">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial */}
        <div>
          <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
            Historial ({history.length})
          </p>
          <div className="space-y-2">
            {history.map((h) => {
              const st = STATUS_STYLE[h.status] ?? { label: h.status, cls: 'bg-white/10 text-white/55' }
              const isUnilateral = h.status === 'cancelled' && h.cancelled_by === 'venue'
              return (
                <div key={h.id}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-[13px] text-white">
                        {h.table_label ?? '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="text-white font-semibold text-[13.5px]">
                          {formatDate(h.date)} · {h.time_slot}hs
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                        {isUnilateral && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wide
                                           px-1.5 py-0.5 rounded bg-c1/30 text-c1l">
                            Cancelé yo
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-[11.5px] mt-0.5">
                        {h.party_size} pax{h.source && h.source !== 'app' ? ` · ${h.source}` : ''}
                      </p>
                      {h.notes && (
                        <p className="text-white/55 text-[11.5px] mt-1 italic">{h.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Audit trail — timeline de actividad */}
        {events.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-3">
              Timeline ({events.length})
            </p>
            <div className="relative bg-white/[0.03] border border-white/8 rounded-2xl p-4">
              <ol className="relative space-y-3">
                {events.slice(0, 20).map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${
                        e.event_type === 'checked_in' ? 'bg-[#7BD3B2]' :
                        e.event_type === 'cancelled' ? 'bg-[#FF8A91]' :
                        e.event_type === 'no_show' ? 'bg-[#FF8A91]' :
                        e.event_type === 'edited' ? 'bg-[#F3C773]' :
                        'bg-white/45'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-white text-[12.5px] font-semibold">
                          {eventLabel(e.event_type)}
                          {e.actor_role && (
                            <span className="ml-1.5 text-[10.5px] text-white/40 font-normal">
                              · por {e.actor_role === 'staff' ? 'staff' : e.actor_role === 'user' ? 'el cliente' : 'sistema'}
                            </span>
                          )}
                        </p>
                        <span className="text-[10.5px] text-white/35 flex-shrink-0">
                          {formatEventTime(e.created_at)}
                        </span>
                      </div>
                      {e.notes && (
                        <p className="text-white/50 text-[11px] mt-0.5">{e.notes}</p>
                      )}
                      {e.diff_json && (
                        <p className="text-white/40 text-[11px] mt-0.5 font-mono truncate">
                          {summarizeDiff(e.diff_json)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function eventLabel(type: EventRow['event_type']): string {
  switch (type) {
    case 'created':     return 'Reserva creada'
    case 'confirmed':   return 'Confirmada'
    case 'checked_in':  return 'Check-in'
    case 'cancelled':   return 'Cancelada'
    case 'no_show':     return 'No-show'
    case 'edited':      return 'Editada'
    case 'reverted':    return 'Revertida'
  }
}

function formatEventTime(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function summarizeDiff(diff: { from: Record<string, unknown>; to: Record<string, unknown> }): string {
  const keys = Object.keys(diff.to)
  if (keys.length === 0) return ''
  const pieces = keys.slice(0, 3).map((k) => {
    const f = String(diff.from[k] ?? '—')
    const t = String(diff.to[k] ?? '—')
    return `${k}: ${f} → ${t}`
  })
  return pieces.join(' · ')
}

function StatCard({
  label,
  value,
  accent,
  small,
}: {
  label: string
  value: string | number
  accent?: string
  small?: boolean
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-[10px] font-bold text-white/35 uppercase tracking-wider">{label}</p>
      <p className={`font-display font-bold leading-none mt-1.5 ${
        small ? 'text-[15px]' : 'text-[24px]'
      } ${accent ?? 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}
