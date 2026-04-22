'use client'

import Link from 'next/link'
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

interface Props {
  proximas: Reservation[]
  pasadas: Reservation[]
  tab: 'proximas' | 'pasadas'
  setTab: (t: 'proximas' | 'pasadas') => void
  loading: boolean
  reviewed: Set<string>
  onReview: (r: Reservation) => void
  onCancel: (r: Reservation) => void
}

const CORAL = '#FF4757'
const AMBER = '#FFB800'

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  confirmed:       { label: 'Confirmada',  color: '#2F6AD9', bg: '#EEF5FF', border: '#C6DCFF' },
  checked_in:      { label: 'Asistida',    color: '#0E8F6A', bg: '#EAFDF6', border: '#B4F0DD' },
  pending_payment: { label: 'Pendiente',   color: '#A47800', bg: '#FFF8E6', border: '#FFE0A0' },
  no_show:         { label: 'No asistí',   color: '#C42434', bg: '#FFF1F2', border: '#FFCFD3' },
  cancelled:       { label: 'Cancelada',   color: '#5A5A6E', bg: '#F0F2F5', border: '#DADFE6' },
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export function DesktopReservas({
  proximas, pasadas, tab, setTab, loading, reviewed, onReview, onCancel,
}: Props) {
  const list = tab === 'proximas' ? proximas : pasadas
  const nextUp = proximas.find(r => r.status === 'confirmed' || r.status === 'pending_payment')

  return (
    <div className="hidden lg:block dk-content-centered py-8">
      <header className="flex items-end justify-between mb-6">
        <div>
          <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.18em] mb-1">Tu cuenta</p>
          <h1 className="font-display text-[36px] text-tx leading-none tracking-tight">
            Mis reservas
          </h1>
        </div>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-white font-semibold text-[13px] no-underline transition-colors"
          style={{ background: CORAL }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Nueva reserva
        </Link>
      </header>

      <div className="grid gap-8" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Columna principal: tabs + lista */}
        <div className="min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 bg-sf rounded-lg p-1 mb-5 w-fit">
            {([['proximas', 'Próximas'], ['pasadas', 'Historial']] as const).map(([key, label]) => {
              const active = tab === key
              const count = key === 'proximas' ? proximas.length : pasadas.length
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-5 py-2 rounded-md text-[13px] font-bold transition-all inline-flex items-center gap-2
                              ${active ? 'bg-bg shadow-sm text-tx' : 'text-tx2 hover:text-tx'}`}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? CORAL : 'rgba(0,0,0,0.06)',
                        color: active ? 'white' : 'var(--tx3)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Grid de reservas */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 skeleton rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] p-14 text-center">
              {tab === 'proximas' ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-sf flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#ABABBA" strokeWidth="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="#ABABBA" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="font-display text-[22px] text-tx">Sin reservas próximas</p>
                  <p className="text-tx2 text-[14px] mt-1">¿Salimos a comer?</p>
                  <Link
                    href="/"
                    className="inline-block mt-5 px-5 py-2.5 rounded-md text-white font-semibold text-[13px] no-underline"
                    style={{ background: CORAL }}
                  >
                    Explorar restaurantes
                  </Link>
                </>
              ) : (
                <p className="text-tx2 text-[15px]">Todavía no tenés historial.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {list.map(r => (
                <ReservaRow
                  key={r.id}
                  r={r}
                  tab={tab}
                  reviewed={reviewed}
                  onReview={() => onReview(r)}
                  onCancel={() => onCancel(r)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: próxima salida */}
        <aside className="min-w-0">
          {nextUp ? (
            <div
              className="sticky rounded-2xl border-2 overflow-hidden"
              style={{ top: 'calc(var(--dk-topbar-h, 68px) + 12px)', borderColor: CORAL }}
            >
              <div style={{ background: CORAL, padding: '18px 22px', color: 'white' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CORAL }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                    Tu próxima salida
                  </p>
                </div>
                <p className="font-display text-[22px] leading-none tracking-tight">
                  {nextUp.venues?.name ?? 'Reserva'}
                </p>
                <p className="text-white/70 text-[12px] mt-2">
                  {formatDate(nextUp.date)} · {formatTime(nextUp.time_slot)} hs
                </p>
              </div>

              <div className="p-5 space-y-4 bg-bg">
                <Countdown date={nextUp.date} time={formatTime(nextUp.time_slot)} />

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(0,0,0,0.07)]">
                  <InfoCell label="Personas" value={`${nextUp.party_size}`} />
                  <InfoCell label="Mesa" value={nextUp.tables?.label ?? '—'} />
                </div>

                <Link
                  href={`/reserva/${nextUp.id}/confirmacion`}
                  className="block w-full text-center py-3 rounded-md font-semibold text-[13px] no-underline transition-colors"
                  style={{ background: 'var(--sf)', color: 'var(--tx)', border: '1px solid var(--br)' }}
                >
                  Ver QR y detalles
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="sticky rounded-2xl border border-dashed border-[rgba(0,0,0,0.1)] p-6 text-center"
              style={{ top: 'calc(var(--dk-topbar-h, 68px) + 12px)' }}
            >
              <p className="font-display text-[18px] text-tx">Sin reserva activa</p>
              <p className="text-tx2 text-[12px] mt-1.5 leading-relaxed">
                Cuando tengas una reserva próxima la vas a ver acá con su QR listo para el check-in.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function ReservaRow({
  r, tab, reviewed, onReview, onCancel,
}: {
  r: Reservation
  tab: 'proximas' | 'pasadas'
  reviewed: Set<string>
  onReview: () => void
  onCancel: () => void
}) {
  const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.confirmed
  const isPast = tab === 'pasadas'

  return (
    <div className="rounded-xl bg-bg border border-[rgba(0,0,0,0.07)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[18px] text-tx leading-tight tracking-tight truncate">
            {r.venues?.name ?? 'Restaurante'}
          </h3>
          <p className="text-tx3 text-[12px] truncate mt-0.5">
            {r.venues?.address ?? ''}
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0"
          style={{ background: st.bg, color: st.color, borderColor: st.border }}
        >
          {st.label}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[12.5px] text-tx2 flex-wrap">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {formatDate(r.date)}
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {formatTime(r.time_slot)}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
            <path d="M3 20a6 6 0 0112 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
            <path d="M15 20a5 5 0 016-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {r.party_size}
        </span>
        {r.tables?.label && (
          <span className="font-mono text-tx3 uppercase text-[11px] font-bold tracking-wider">
            Mesa {r.tables.label}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-1">
        {!isPast && r.qr_token && (
          <Link
            href={`/reserva/${r.id}/confirmacion`}
            className="flex-1 py-2 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx text-[12px] font-bold text-center no-underline hover:bg-sf2 transition-colors"
          >
            Ver QR
          </Link>
        )}
        {!isPast && (
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx2 text-[12px] font-bold hover:text-[#C42434] hover:border-[#C42434]/30 transition-colors"
          >
            Cancelar
          </button>
        )}
        {isPast && r.status === 'checked_in' && !reviewed.has(r.id) && (
          <button
            onClick={onReview}
            className="flex-1 py-2 rounded-md text-white text-[12px] font-bold transition-colors"
            style={{ background: CORAL }}
          >
            Dejar reseña
          </button>
        )}
        {isPast && r.status === 'checked_in' && reviewed.has(r.id) && (
          <span className="flex-1 py-2 text-center text-tx3 text-[12px] font-bold">
            ✓ Reseña enviada
          </span>
        )}
      </div>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-tx3">{label}</p>
      <p className="font-display text-[20px] text-tx leading-none mt-1 tabular-nums">{value}</p>
    </div>
  )
}
