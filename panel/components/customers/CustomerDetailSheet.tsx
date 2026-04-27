'use client'

import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Avatar, Ic } from '@/components/ui/brand'
import { CustomerTagsModal } from './CustomerTagsModal'
import {
  AlertCircleIcon,
  BanIcon,
  CakeIcon,
  PlusIcon,
  SaladIcon,
  StarIcon,
  TagKindIcon,
  TAG_KIND_COLOR,
} from './tag-icons'
import type {
  CustomerTag,
  CustomerTagKind,
} from '@/lib/shared/types/customer-tag'

interface CustomerDetail {
  phone: string
  name: string
  visits: number
  last_visit: string | null
  no_shows_90d: number
  late_cancels_90d: number
  total_spend_ars: number
  total_penalties_ars: number
  is_risky: boolean
  reservations: Array<{
    id: string
    date: string
    time_slot: string
    status: string
    party_size: number
    duration_minutes: number
    deposit_paid_amount: number
    customer_notes: string | null
    cancel_reason: string | null
    created_at: string
    table_label: string | null
  }>
  penalties: Array<{
    id: string
    kind: string
    amount_ars: number
    reason: string | null
    charged: boolean
    created_at: string
  }>
}

interface CustomerDetailSheetProps {
  open: boolean
  onClose: () => void
  /** Teléfono del cliente — se hace fetch al abrir */
  phone: string | null
  /** Nombre fallback mientras carga */
  fallbackName?: string
  /** Acción para crear nueva reserva con este cliente prefilled */
  onNewReservation?: (name: string, phone: string) => void
}

const STATUS_PASTEL: Record<string, string> = {
  confirmed: 'p-mint',
  checked_in: 'p-mint',
  finished: 'p-sky',
  pending_payment: 'p-butter',
  cancelled: 'p-pink',
  no_show: 'p-pink',
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  checked_in: 'Check-in',
  finished: 'Cerrada',
  pending_payment: 'Pendiente',
  cancelled: 'Cancelada',
  no_show: 'No-show',
}

export function CustomerDetailSheet({
  open,
  onClose,
  phone,
  fallbackName,
  onNewReservation,
}: CustomerDetailSheetProps) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<CustomerTag[]>([])
  const [tagsModalOpen, setTagsModalOpen] = useState(false)
  const [tagsModalKind, setTagsModalKind] = useState<
    CustomerTagKind | undefined
  >(undefined)

  useEffect(() => {
    if (!open || !phone) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/customers/${encodeURIComponent(phone)}/detail`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No se pudo cargar'))))
      .then((data: CustomerDetail) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, phone])

  // Fetch tags al abrir
  useEffect(() => {
    if (!open || !phone) {
      setTags([])
      return
    }
    let cancelled = false
    fetch(`/api/customers/${encodeURIComponent(phone)}/tags`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('tags load'))))
      .then((data: CustomerTag[]) => {
        if (!cancelled) setTags(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        // Silent: la sección queda vacía. El error principal del detail ya se muestra.
      })
    return () => {
      cancelled = true
    }
  }, [open, phone])

  const openTagsModal = (kind?: CustomerTagKind) => {
    setTagsModalKind(kind)
    setTagsModalOpen(true)
  }

  if (!phone) return null

  const name = detail?.name ?? fallbackName ?? 'Cliente'

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={name}
      subtitle={phone}
      maxWidth="lg"
      primaryAction={
        onNewReservation && (
          <button
            type="button"
            onClick={() => onNewReservation(name, phone)}
            className="btn btn-primary"
            style={{ height: 34, padding: '0 14px', borderRadius: 'var(--r-pill)', fontSize: 12 }}
          >
            <Ic.plus width={12} height={12} /> Nueva reserva
          </button>
        )
      }
    >
      {loading && (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 13,
          }}
        >
          Cargando historial…
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 14,
            background: 'var(--wine-bg)',
            border: '1px solid var(--wine)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--wine-soft)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {detail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Chips de tags clickeables (encima del hero) */}
          <TagChipsRow tags={tags} onClickKind={openTagsModal} />

          {/* Hero stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: detail.is_risky ? 'var(--wine-bg)' : 'var(--bg-2)',
              border: `1px solid ${detail.is_risky ? 'var(--wine)' : 'var(--line)'}`,
              borderRadius: 'var(--r-sm)',
            }}
          >
            <Avatar name={detail.name} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="fr-900"
                style={{ fontSize: 22, color: detail.is_risky ? '#F5D0D7' : 'var(--text)' }}
              >
                {detail.name}
              </div>
              <div
                className="ff-mono"
                style={{
                  fontSize: 11,
                  color: detail.is_risky ? '#E9B9C1' : 'var(--text-3)',
                  marginTop: 2,
                }}
              >
                {detail.phone} · {detail.visits} visita{detail.visits !== 1 ? 's' : ''}
                {detail.last_visit && ` · última ${formatDate(detail.last_visit)}`}
              </div>
            </div>
            {detail.is_risky && (
              <span
                className="caps"
                style={{
                  padding: '4px 10px',
                  background: 'var(--wine)',
                  color: '#F5E9EB',
                  borderRadius: 99,
                  fontSize: 10,
                }}
              >
                Riesgo
              </span>
            )}
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 8,
            }}
          >
            <Stat
              label="No-shows 90d"
              value={detail.no_shows_90d}
              highlight={detail.no_shows_90d >= 2}
            />
            <Stat
              label="Cancel tarde"
              value={detail.late_cancels_90d}
              highlight={detail.late_cancels_90d >= 3}
            />
            <Stat
              label="Gasto"
              value={`$${detail.total_spend_ars.toLocaleString('es-AR')}`}
            />
            <Stat
              label="Penaliz."
              value={`$${detail.total_penalties_ars.toLocaleString('es-AR')}`}
              highlight={detail.total_penalties_ars > 0}
            />
          </div>

          {/* Información personalizada (tags detallados) */}
          <CustomTagsSection tags={tags} onAdd={() => openTagsModal()} />

          {/* Reservations list */}
          <section>
            <div className="caps" style={{ marginBottom: 10 }}>
              Últimas reservas · {detail.reservations.length}
            </div>
            {detail.reservations.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: 'var(--text-3)',
                  fontSize: 13,
                  background: 'var(--bg-2)',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                Sin historial registrado
              </div>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.reservations.map((r) => {
                  const pastel = STATUS_PASTEL[r.status] ?? 'p-sky'
                  return (
                    <li
                      key={r.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-2)',
                        borderRadius: 'var(--r-sm)',
                        borderLeft: `3px solid var(--${pastel})`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            display: 'flex',
                            gap: 8,
                            alignItems: 'baseline',
                          }}
                        >
                          {formatDate(r.date)} · {r.time_slot.slice(0, 5)}
                          <span
                            className="ff-mono"
                            style={{ fontSize: 11, color: 'var(--text-3)' }}
                          >
                            ×{r.party_size}
                            {r.table_label ? ` · mesa ${r.table_label}` : ''}
                          </span>
                        </div>
                        {r.customer_notes && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-3)',
                              fontStyle: 'italic',
                              marginTop: 2,
                            }}
                          >
                            {r.customer_notes}
                          </div>
                        )}
                        {r.cancel_reason && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--wine-soft)',
                              marginTop: 2,
                            }}
                          >
                            ✗ {r.cancel_reason}
                          </div>
                        )}
                      </div>
                      <span
                        className="caps"
                        style={{
                          padding: '3px 10px',
                          background: `var(--${pastel})`,
                          color: '#1A1B1F',
                          borderRadius: 99,
                          fontSize: 10,
                        }}
                      >
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Penalties */}
          {detail.penalties.length > 0 && (
            <section>
              <div className="caps" style={{ marginBottom: 10 }}>
                Penalizaciones · {detail.penalties.length}
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {detail.penalties.map((p) => (
                  <li
                    key={p.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--wine-bg)',
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--wine)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 12,
                      color: '#F5D0D7',
                    }}
                  >
                    <span className="caps" style={{ flexShrink: 0, color: '#E9B9C1' }}>
                      {p.kind.replace('_', ' ')}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, opacity: 0.85 }}>
                      {p.reason ?? 'Sin motivo'}
                    </span>
                    <span
                      className="ff-mono"
                      style={{ fontWeight: 600 }}
                    >
                      {p.charged
                        ? `$${p.amount_ars.toLocaleString('es-AR')}`
                        : 'sin cobro'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {phone && (
        <CustomerTagsModal
          phone={phone}
          existingTags={tags}
          initialKind={tagsModalKind}
          open={tagsModalOpen}
          onClose={() => setTagsModalOpen(false)}
          onSaved={(next) => setTags(next)}
        />
      )}
    </BottomSheet>
  )
}

/* ── TagChipsRow: 5 chips arriba del nombre ─────────────── */

const CHIP_KINDS: Array<{
  kind: CustomerTagKind
  label: string
  Icon: React.ComponentType<{ size?: number; filled?: boolean }>
  bg: string
  textActive: string
  textGhost?: string
}> = [
  {
    kind: 'allergy',
    label: 'Alergias',
    Icon: AlertCircleIcon,
    bg: 'var(--p-pink)',
    textActive: '#1A1B1F',
  },
  {
    kind: 'restriction',
    label: 'Restricciones',
    Icon: BanIcon,
    bg: 'var(--wine)',
    textActive: '#F5E9EB',
  },
  {
    kind: 'dietary',
    label: 'Dieta',
    Icon: SaladIcon,
    bg: 'var(--p-mint)',
    textActive: '#1A1B1F',
  },
  {
    kind: 'vip',
    label: 'VIP',
    Icon: StarIcon,
    bg: 'var(--p-butter)',
    textActive: '#1A1B1F',
  },
  {
    kind: 'celebration',
    label: 'Celebración',
    Icon: CakeIcon,
    bg: 'var(--p-peach)',
    textActive: '#1A1B1F',
  },
]

function TagChipsRow({
  tags,
  onClickKind,
}: {
  tags: CustomerTag[]
  onClickKind: (kind: CustomerTagKind) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {CHIP_KINDS.map(({ kind, label, Icon, bg, textActive }) => {
        const items = tags.filter((t) => t.kind === kind)
        const active = items.length > 0
        const isRestriction = kind === 'restriction'
        // Para restriction usamos wine outline cuando activa (más contundente)
        const styleActive = isRestriction
          ? {
              background: 'transparent',
              border: '1px solid var(--wine)',
              color: 'var(--wine-soft)',
            }
          : {
              background: bg,
              border: '1px solid transparent',
              color: textActive,
            }
        const styleGhost = {
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          color: 'var(--text-2)',
        }
        const s = active ? styleActive : styleGhost

        // Para alergias / restricciones / dieta mostrar contador si >1
        const showCount = active && items.length > 1
        // Resumen: en allergy si hay 1 mostrar el value
        const summary =
          active && items.length === 1 && kind !== 'vip'
            ? items[0].value
            : null

        return (
          <button
            key={kind}
            type="button"
            onClick={() => onClickKind(kind)}
            aria-label={`${label}${active ? ` · ${items.length}` : ' · sin datos'}`}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 99,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: 200,
              ...s,
            }}
          >
            <Icon size={14} filled={kind === 'vip' && active} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {summary ?? label}
            </span>
            {showCount && (
              <span
                className="ff-mono"
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  background: 'rgba(0,0,0,0.12)',
                  borderRadius: 99,
                }}
              >
                {items.length}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── CustomTagsSection: lista detallada con icono ───────── */

function CustomTagsSection({
  tags,
  onAdd,
}: {
  tags: CustomerTag[]
  onAdd: () => void
}) {
  return (
    <section>
      <div
        className="caps"
        style={{
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>Información personalizada</span>
        <span style={{ color: 'var(--text-3)' }}>· {tags.length}</span>
      </div>

      {tags.length === 0 ? (
        <div
          style={{
            padding: '20px 16px',
            background: 'var(--bg-2)',
            border: '1px dashed var(--line)',
            borderRadius: 'var(--r-sm)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 320 }}>
            Sin información todavía. Sumá alergias, dieta o notas para
            personalizar la atención.
          </div>
          <button
            type="button"
            onClick={onAdd}
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 99,
              border: '1px solid var(--wine)',
              background: 'transparent',
              color: 'var(--wine-soft)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PlusIcon size={14} />
            Agregar información
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            padding: 6,
          }}
        >
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              margin: 0,
              padding: 0,
              listStyle: 'none',
            }}
          >
            {tags.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    background: TAG_KIND_COLOR[t.kind],
                    color: t.kind === 'restriction' ? '#F5E9EB' : '#1A1B1F',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  <TagKindIcon
                    kind={t.kind}
                    size={14}
                    filled={t.kind === 'vip'}
                  />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {t.kind === 'vip' ? 'Cliente VIP' : t.value}
                  </div>
                  {t.notes && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-3)',
                        marginTop: 2,
                      }}
                    >
                      {t.notes}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div
            style={{
              borderTop: '1px solid var(--line)',
              padding: '8px 6px 4px',
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <button
              type="button"
              onClick={onAdd}
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 99,
                background: 'transparent',
                border: 'none',
                color: 'var(--wine-soft)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PlusIcon size={14} />
              Agregar más información
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: highlight ? 'var(--wine-bg)' : 'var(--bg-2)',
        border: `1px solid ${highlight ? 'var(--wine)' : 'var(--line)'}`,
        borderRadius: 'var(--r-sm)',
      }}
    >
      <div
        className="caps"
        style={{ color: highlight ? '#E9B9C1' : 'var(--text-3)' }}
      >
        {label}
      </div>
      <div
        className="fr-900"
        style={{
          fontSize: 22,
          color: highlight ? '#F3D0D7' : 'var(--text)',
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}
