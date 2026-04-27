'use client'

/**
 * ReservationHistorySheet — timeline vertical del audit log de una reserva.
 *
 * Render:
 *  - Header con back arrow + nombre del cliente.
 *  - Lista cronológica (asc) de ReservationEvent con bullet coloreado por
 *    event_type, pill de actor + timestamp y diff card before/after.
 *  - Empty state cuando la reserva todavía no acumuló eventos.
 *
 * Wired desde EditReservationSheet via boton "Ver historial".
 *
 * Source de datos: GET /api/reservas/[id]/history → ReservationEvent[]
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  ReservationEvent,
  ReservationEventType,
} from '@/lib/shared/types/reservation-event'

interface ReservationHistorySheetProps {
  reservationId: string | null
  customerName: string
  open: boolean
  onClose: () => void
}

/* ============================================================
   Iconos (Lucide-style, stroke 2, 16px). Inline para evitar deps.
   ============================================================ */

const baseSvg = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconCalendarPlus() {
  return (
    <svg {...baseSvg}>
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M19 16v6M16 19h6" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg {...baseSvg}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
function IconArrowRightLeft() {
  return (
    <svg {...baseSvg}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  )
}
function IconSquare() {
  return (
    <svg {...baseSvg}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg {...baseSvg}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg {...baseSvg}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13A4 4 0 0 1 16 11" />
    </svg>
  )
}
function IconTag() {
  return (
    <svg {...baseSvg}>
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
      <circle cx="7" cy="7" r="1" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg {...baseSvg}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="m5 6 1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
    </svg>
  )
}
function IconCheckCircle() {
  return (
    <svg {...baseSvg}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
function IconXCircle() {
  return (
    <svg {...baseSvg}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  )
}
function IconBan() {
  return (
    <svg {...baseSvg}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.5 5.5 13 13" />
    </svg>
  )
}
function IconArrowRight() {
  return (
    <svg {...baseSvg} width={12} height={12}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}
function IconBolt() {
  return (
    <svg {...baseSvg} width={10} height={10}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    </svg>
  )
}
function IconArrowLeft() {
  return (
    <svg {...baseSvg} width={18} height={18}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}
function IconClipboard() {
  return (
    <svg {...baseSvg} width={28} height={28} stroke="currentColor">
      <rect x="6" y="4" width="12" height="18" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

/* ============================================================
   Mapeo event_type → icon + color + label
   ============================================================ */

interface EventMeta {
  Icon: () => JSX.Element
  color: string
  label: string
}

function metaFor(event: ReservationEvent): EventMeta {
  const type = event.event_type
  switch (type) {
    case 'created':
      return { Icon: IconCalendarPlus, color: 'var(--p-mint-2)', label: 'Creación de reserva' }
    case 'updated':
      return { Icon: IconEdit, color: 'var(--text-2)', label: 'Edición' }
    case 'status_changed': {
      const to = (event.after_data?.status as string | undefined) ?? ''
      let color = 'var(--text-2)'
      if (to === 'confirmed' || to === 'check_in' || to === 'checked_in') color = 'var(--p-mint-2)'
      else if (to === 'finished') color = 'var(--text-2)'
      else if (to === 'cancelled' || to === 'no_show') color = 'var(--wine)'
      else if (to === 'pending_payment') color = 'var(--p-butter-2)'
      const before = (event.before_data?.status as string | undefined) ?? '?'
      return {
        Icon: IconArrowRightLeft,
        color,
        label: `Estado: ${humanizeStatus(before)} → ${humanizeStatus(to)}`,
      }
    }
    case 'table_changed':
      return { Icon: IconSquare, color: 'var(--text-2)', label: 'Cambio de mesa' }
    case 'time_changed':
      return { Icon: IconClock, color: 'var(--text-2)', label: 'Cambio de horario' }
    case 'party_size_changed':
      return { Icon: IconUsers, color: 'var(--text-2)', label: 'Cambio de comensales' }
    case 'tags_changed':
      return { Icon: IconTag, color: 'var(--p-lilac-2)', label: 'Edición de tags' }
    case 'deleted':
      return { Icon: IconTrash, color: 'var(--wine)', label: 'Eliminación de reserva' }
    case 'check_in':
      return { Icon: IconCheckCircle, color: 'var(--p-mint-2)', label: 'Check-in' }
    case 'no_show':
      return { Icon: IconXCircle, color: 'var(--wine)', label: 'No-show' }
    case 'cancelled':
      return { Icon: IconBan, color: 'var(--wine)', label: 'Cancelación' }
    default: {
      const exhaustive: never = type
      return { Icon: IconEdit, color: 'var(--text-2)', label: String(exhaustive) }
    }
  }
}

function humanizeStatus(s: string): string {
  switch (s) {
    case 'pending_payment': return 'Pago pendiente'
    case 'confirmed': return 'Confirmada'
    case 'check_in':
    case 'checked_in': return 'Check-in'
    case 'finished': return 'Finalizada'
    case 'cancelled': return 'Cancelada'
    case 'no_show': return 'No-show'
    default: return s || '—'
  }
}

/* ============================================================
   timeAgo helper
   ============================================================ */

function timeAgo(iso: string): string {
  const now = Date.now()
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return iso
  const diffMs = now - t
  const min = Math.round(diffMs / 60_000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const hr = Math.round(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} · ${hh}:${mi}hs`
}

/* ============================================================
   DiffCard — render del before/after segun event_type
   ============================================================ */

function getStr(d: Record<string, unknown> | null, k: string): string | null {
  if (!d) return null
  const v = d[k]
  if (v === null || v === undefined) return null
  return String(v)
}

function trimSlot(s: string | null): string | null {
  if (!s) return null
  // "10:30:00" → "10:30hs"
  const hm = s.match(/^(\d{1,2}):(\d{2})/)
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}hs`
  return s
}

function DiffCard({ event }: { event: ReservationEvent }) {
  const before = event.before_data
  const after = event.after_data

  const baseStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    border: '1px solid var(--line)',
  }

  switch (event.event_type) {
    case 'time_changed': {
      const b = trimSlot(getStr(before, 'time_slot'))
      const a = trimSlot(getStr(after, 'time_slot'))
      if (!b && !a) return null
      return (
        <div style={baseStyle}>
          <DiffRow before={b} after={a} strike />
        </div>
      )
    }
    case 'status_changed': {
      const b = humanizeStatus(getStr(before, 'status') ?? '')
      const a = humanizeStatus(getStr(after, 'status') ?? '')
      return (
        <div style={baseStyle}>
          <DiffRow before={b} after={a} />
        </div>
      )
    }
    case 'table_changed': {
      const b = getStr(before, 'table_label') ?? getStr(before, 'table_id')
      const a = getStr(after, 'table_label') ?? getStr(after, 'table_id')
      if (!b && !a) return null
      return (
        <div style={baseStyle}>
          <DiffRow
            before={b ? `Mesa ${b}` : null}
            after={a ? `Mesa ${a}` : null}
          />
        </div>
      )
    }
    case 'party_size_changed': {
      const b = getStr(before, 'party_size')
      const a = getStr(after, 'party_size')
      if (!b && !a) return null
      return (
        <div style={baseStyle}>
          <DiffRow
            before={b ? `${b} personas` : null}
            after={a ? `${a} personas` : null}
          />
        </div>
      )
    }
    case 'created': {
      const date = getStr(after, 'date')
      const slot = trimSlot(getStr(after, 'time_slot'))
      const partySize = getStr(after, 'party_size')
      const zone = getStr(after, 'zone_name') ?? getStr(after, 'table_label')
      const lines: string[] = []
      if (date || slot) lines.push([date, slot].filter(Boolean).join(' · '))
      if (partySize || zone) {
        const parts: string[] = []
        if (partySize) parts.push(`${partySize} personas`)
        parts.push(zone || 'Salón')
        lines.push(parts.join(' · '))
      }
      if (!lines.length) return null
      return (
        <div style={baseStyle}>
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )
    }
    case 'cancelled': {
      const reason = getStr(after, 'cancel_reason') ?? getStr(before, 'cancel_reason')
      if (!reason) return null
      return (
        <div style={{ ...baseStyle, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Motivo
          </span>
          <span>{reason}</span>
        </div>
      )
    }
    case 'tags_changed': {
      const b = (before?.tags as unknown[] | undefined) ?? []
      const a = (after?.tags as unknown[] | undefined) ?? []
      return (
        <div style={baseStyle}>
          <DiffRow
            before={b.length ? b.map(String).join(', ') : '—'}
            after={a.length ? a.map(String).join(', ') : '—'}
          />
        </div>
      )
    }
    case 'updated': {
      // generic; if there's a single changed field, show it
      const fields = collectChangedFields(before, after)
      if (!fields.length) return null
      return (
        <div style={baseStyle}>
          {fields.map((f) => (
            <DiffRow key={f.key} label={f.label} before={f.before} after={f.after} />
          ))}
        </div>
      )
    }
    default:
      return null
  }
}

function collectChangedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): Array<{ key: string; label: string; before: string | null; after: string | null }> {
  if (!after) return []
  const out: Array<{ key: string; label: string; before: string | null; after: string | null }> = []
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after)])
  const labels: Record<string, string> = {
    guest_name: 'Titular',
    guest_phone: 'Teléfono',
    customer_notes: 'Nota cliente',
    staff_notes: 'Nota staff',
    duration_minutes: 'Duración',
  }
  for (const k of keys) {
    if (!(k in labels)) continue
    const b = before ? (before[k] as unknown) : null
    const a = after[k]
    if (String(b ?? '') === String(a ?? '')) continue
    out.push({
      key: k,
      label: labels[k],
      before: b == null || b === '' ? null : String(b),
      after: a == null || a === '' ? null : String(a),
    })
  }
  return out
}

function DiffRow({
  label,
  before,
  after,
  strike,
}: {
  label?: string
  before: string | null
  after: string | null
  strike?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {label && (
        <span style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </span>
      )}
      <span
        style={{
          color: 'var(--text-3)',
          textDecoration: strike ? 'line-through' : undefined,
        }}
      >
        {before ?? '—'}
      </span>
      <span style={{ color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center' }}>
        <IconArrowRight />
      </span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>
        {after ?? '—'}
      </span>
    </div>
  )
}

/* ============================================================
   ActorPill
   ============================================================ */

function ActorPill({ event }: { event: ReservationEvent }) {
  const isSystem = event.actor_type === 'system'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 99,
        background: isSystem ? 'var(--bg-2)' : 'var(--surface-2)',
        border: '1px solid var(--line)',
        fontSize: 11,
        color: 'var(--text-3)',
        whiteSpace: 'nowrap',
      }}
    >
      {isSystem && <IconBolt />}
      <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>
        {event.actor_label || (isSystem ? 'Sistema' : '—')}
      </span>
      <span aria-hidden>·</span>
      <span>{timeAgo(event.created_at)}</span>
    </span>
  )
}

/* ============================================================
   Main component
   ============================================================ */

export function ReservationHistorySheet({
  reservationId,
  customerName,
  open,
  onClose,
}: ReservationHistorySheetProps) {
  const [events, setEvents] = useState<ReservationEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || !reservationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setEvents([])
    fetch(`/api/reservas/${reservationId}/history`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body?.error || `Error ${r.status}`)
        }
        return r.json() as Promise<ReservationEvent[]>
      })
      .then((data) => {
        if (cancelled) return
        setEvents(Array.isArray(data) ? data : [])
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error cargando historial')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, reservationId])

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 fade-up"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      />

      <div
        className="sheet-in card relative w-full flex flex-col"
        style={{
          maxWidth: '34rem',
          maxHeight: '92vh',
          borderRadius: 'var(--r)',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-2">
          <span style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line-2)' }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '16px 22px 14px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver"
            style={{
              width: 32,
              height: 32,
              borderRadius: 99,
              background: 'var(--surface-2)',
              border: 'none',
              color: 'var(--text-2)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconArrowLeft />
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="caps" style={{ marginBottom: 2, color: 'var(--text-3)', fontSize: 11, letterSpacing: 0.6 }}>
              Historial de reserva
            </div>
            <h2
              id="history-title"
              className="fr-900 truncate"
              style={{ fontSize: 22, color: 'var(--text)', margin: 0, lineHeight: 1.1 }}
            >
              {customerName || 'Reserva'}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px 28px' }}>
          {loading && <SkeletonTimeline />}

          {!loading && error && (
            <div
              role="alert"
              style={{
                padding: '12px 14px',
                background: 'var(--wine-bg)',
                border: '1px solid var(--wine)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--wine-soft)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && events.length === 0 && <EmptyState />}

          {!loading && !error && events.length > 0 && (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {events.map((ev, idx) => {
                const meta = metaFor(ev)
                const last = idx === events.length - 1
                return (
                  <li
                    key={ev.id}
                    style={{
                      position: 'relative',
                      paddingLeft: 28,
                      paddingBottom: last ? 0 : 22,
                    }}
                  >
                    {/* Vertical line */}
                    {!last && (
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: 7,
                          top: 18,
                          bottom: 0,
                          width: 2,
                          background: 'var(--line)',
                        }}
                      />
                    )}
                    {/* Bullet */}
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 2,
                        width: 16,
                        height: 16,
                        borderRadius: 99,
                        background: meta.color,
                        border: '3px solid var(--bg)',
                        boxShadow: '0 0 0 1px var(--line)',
                      }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: 'var(--text)',
                      }}
                    >
                      <span
                        style={{
                          color: meta.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <meta.Icon />
                      </span>
                      <span
                        className="fr-900"
                        style={{
                          fontSize: 14,
                          color: 'var(--text)',
                          fontWeight: 700,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <ActorPill event={ev} />
                    </div>

                    <DiffCard event={ev} />
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}

/* ============================================================
   Empty + Skeleton
   ============================================================ */

function EmptyState() {
  return (
    <div
      style={{
        padding: '36px 20px',
        border: '1px dashed var(--line)',
        borderRadius: 'var(--r-sm)',
        textAlign: 'center',
        color: 'var(--text-2)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface-2)',
      }}
    >
      <span style={{ color: 'var(--text-3)' }}>
        <IconClipboard />
      </span>
      <div className="fr-900" style={{ fontSize: 16, color: 'var(--text)' }}>
        Sin historial todavía
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 280, lineHeight: 1.4 }}>
        Los cambios futuros sobre esta reserva van a quedar registrados acá.
      </div>
    </div>
  )
}

function SkeletonTimeline() {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          style={{
            position: 'relative',
            paddingLeft: 28,
            paddingBottom: 22,
          }}
        >
          {i < 2 && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 7,
                top: 18,
                bottom: 0,
                width: 2,
                background: 'var(--line)',
              }}
            />
          )}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 2,
              width: 16,
              height: 16,
              borderRadius: 99,
              background: 'var(--surface-2)',
              border: '3px solid var(--bg)',
              boxShadow: '0 0 0 1px var(--line)',
            }}
          />
          <div
            style={{
              height: 14,
              width: '60%',
              borderRadius: 6,
              background: 'var(--surface-2)',
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 22,
              width: 180,
              borderRadius: 99,
              background: 'var(--surface-2)',
              marginBottom: 8,
            }}
          />
          <div
            style={{
              height: 48,
              borderRadius: 10,
              background: 'var(--surface-2)',
            }}
          />
        </li>
      ))}
    </ol>
  )
}

// Re-export type for consumers if needed.
export type { ReservationEvent } from '@/lib/shared/types/reservation-event'
