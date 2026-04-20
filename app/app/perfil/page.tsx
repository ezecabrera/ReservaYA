'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/ui/BottomNav'
import { Countdown } from '@/components/lab/Countdown'

interface RewardsData {
  tier: 'bronce' | 'plata' | 'oro'
  tierLabel: string
  reservationsThisMonth: number
  toNextTier: number | null
  nextTierLabel: string | null
  incentive: string
  streaks: Array<{ icon: string; title: string; subtitle: string }>
}

interface ProfileData {
  name: string
  phone: string
  email: string
  memberSince: string
  stats: {
    total: number
    checkedIn: number
    pending?: number
    favoriteVenue: string | null
  }
  rewards?: RewardsData
}

const TIER_META: Record<RewardsData['tier'], {
  label: string; emoji: string; gradient: string; text: string; bar: string; max: number
}> = {
  bronce: {
    label: 'Bronce', emoji: '🥉',
    gradient: 'linear-gradient(135deg, #F3E3D2 0%, #E5C8A8 100%)',
    text: '#7A4A24', bar: '#7A4A24', max: 3,
  },
  plata:  {
    label: 'Plata', emoji: '🥈',
    gradient: 'linear-gradient(135deg, #E8EBEF 0%, #C8D0DA 100%)',
    text: '#525966', bar: '#525966', max: 7,
  },
  oro:    {
    label: 'Oro', emoji: '🥇',
    gradient: 'linear-gradient(135deg, #FFF2C4 0%, #F0C866 100%)',
    text: '#8A6310', bar: '#8A6310', max: 7,
  },
}

interface UpcomingReservation {
  id: string
  date: string
  time_slot: string
  status: string
  venues: { name: string } | null
  tables: { label: string } | null
}

const AVATAR_COLORS = ['#FF4757', '#2ED8A8', '#4E8EFF', '#9B59FF', '#FFB800', '#FF8C42']

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function memberSinceLabel(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export default function PerfilPage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [nextUp, setNextUp] = useState<UpcomingReservation | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/perfil')
      .then(r => {
        if (r.status === 401) { router.replace('/login?redirect=/perfil'); return null }
        return r.json()
      })
      .then(d => { if (d) { setData(d); setNewName(d.name) } })
      .finally(() => setLoading(false))

    // Fetch próxima reserva en paralelo (silencioso si falla)
    fetch('/api/mis-reservas')
      .then(r => r.ok ? r.json() : [])
      .then((list: UpcomingReservation[]) => {
        if (!Array.isArray(list)) return
        const now = Date.now()
        const toTs = (date: string, timeSlot: string) => {
          // time_slot viene como "HH:MM:SS" o "HH:MM" — normalizar a HH:MM
          const t = timeSlot.slice(0, 5)
          return new Date(`${date}T${t}:00`).getTime()
        }
        const upcoming = list
          .map(r => ({ ...r, time_slot: r.time_slot.slice(0, 5) }))
          .filter(r => {
            const t = toTs(r.date, r.time_slot)
            return t > now && (r.status === 'confirmed' || r.status === 'pending_payment')
          })
          .sort((a, b) => toTs(a.date, a.time_slot) - toTs(b.date, b.time_slot))
        setNextUp(upcoming[0] ?? null)
      })
      .catch(() => { /* silent */ })
  }, [router])

  async function handleSaveName() {
    if (!newName.trim() || newName === data?.name) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const updated = await res.json() as { name: string }
      setData(prev => prev ? { ...prev, name: updated.name } : prev)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg pb-28">
        <div className="screen-x pt-14 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 skeleton rounded-lg" />
              <div className="h-4 w-24 skeleton rounded-lg" />
            </div>
          </div>
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-16 skeleton rounded-xl" />
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!data) return null

  const initial = data.name[0]?.toUpperCase() ?? '?'
  const color = avatarColor(data.name)

  return (
    <div className="min-h-screen bg-bg pb-28">

      {/* Header / Avatar */}
      <div className="screen-x pt-14 pb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}22`, border: `2.5px solid ${color}` }}
          >
            <span
              className="font-display font-bold text-[32px]"
              style={{ color }}
            >
              {initial}
            </span>
          </div>

          {/* Nombre + edición */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName() }}
                  className="flex-1 border-b-2 border-c1 bg-transparent text-[18px]
                             font-bold text-tx outline-none pb-0.5"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="text-[13px] font-bold text-c1"
                >
                  {saving ? '…' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setEditing(false); setNewName(data.name) }}
                  className="text-[13px] text-tx3"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[22px] font-bold text-tx leading-tight truncate">
                  {data.name}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-shrink-0 active:scale-90 transition-transform"
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                      stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-tx3 text-[13px] mt-0.5">
              Desde {memberSinceLabel(data.memberSince)}
            </p>
          </div>
        </div>
      </div>

      <div className="screen-x space-y-4">

        {/* Próxima reserva */}
        {nextUp && (
          <Link
            href={`/reserva/${nextUp.id}/confirmacion`}
            className="block active:scale-[0.99] transition-transform duration-[180ms] space-y-2"
          >
            <div className="bg-white rounded-xl p-4 border border-[var(--br)] shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-c1 animate-pulse" />
                <p className="text-tx3 text-[10px] font-bold uppercase tracking-[0.15em]">
                  Tu próxima salida
                </p>
              </div>
              <p className="font-display text-[18px] font-bold text-tx truncate">
                {nextUp.venues?.name}
              </p>
              <p className="text-tx2 text-[12px] mt-0.5">
                {new Date(nextUp.date + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })} · {nextUp.time_slot} hs · Mesa {nextUp.tables?.label}
              </p>
            </div>
            <Countdown date={nextUp.date} time={nextUp.time_slot} />
          </Link>
        )}

        {/* Tu nivel + incentivo — gradient por tier (diseño Claude Design) */}
        {data.rewards && (() => {
          const r = data.rewards
          const meta = TIER_META[r.tier]
          const progress = Math.min(r.reservationsThisMonth / meta.max, 1)
          return (
            <div
              className="rounded-xl p-[18px] overflow-hidden"
              style={{ background: meta.gradient, color: meta.text, border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[1.4px] opacity-65">
                    Tu nivel
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[28px]" aria-hidden>{meta.emoji}</span>
                    <span className="font-display text-[26px] font-black leading-none tracking-tight capitalize">
                      {r.tierLabel}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-[34px] font-black leading-none">
                    {r.reservationsThisMonth}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[1px] opacity-65 mt-1 leading-tight">
                    reservas<br/>este mes
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.12)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress * 100}%`, background: meta.bar }}
                />
              </div>

              {/* Incentivo + próximo tier */}
              <div className="flex items-center justify-between mt-2.5 gap-3">
                <p className="text-[12.5px] font-bold leading-snug flex-1">
                  {r.incentive}
                </p>
                {r.nextTierLabel && (
                  <p className="text-[11px] font-bold uppercase tracking-[0.8px] opacity-60 whitespace-nowrap">
                    {r.nextTierLabel === 'Plata' ? '🥈' : '🥇'} {r.nextTierLabel}
                  </p>
                )}
              </div>
            </div>
          )
        })()}

        {/* Rachas (si hay) */}
        {data.rewards?.streaks && data.rewards.streaks.length > 0 && (
          <div className="space-y-2">
            {data.rewards.streaks.map((s) => (
              <div key={s.title} className="card p-3.5 flex items-start gap-3">
                <span className="text-[22px] flex-shrink-0" aria-hidden>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-bold text-tx leading-tight">{s.title}</p>
                  <p className="text-[12px] text-tx3 mt-0.5 leading-snug">{s.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3.5 text-center">
            <p className="font-display text-[26px] font-bold text-tx leading-none">
              {data.stats.total}
            </p>
            <p className="text-tx3 text-[11px] font-semibold mt-1">
              {(data.stats.pending ?? 0) > 0 ? 'Total' : 'Reservas'}
            </p>
            {(data.stats.pending ?? 0) > 0 && (
              <p className="text-c3 text-[10px] font-bold mt-0.5">
                {data.stats.pending} en proceso
              </p>
            )}
          </div>
          <div className="card p-3.5 text-center">
            <p className="font-display text-[26px] font-bold text-c2 leading-none">
              {data.stats.checkedIn}
            </p>
            <p className="text-tx3 text-[11px] font-semibold mt-1">Asistidas</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="font-display text-[22px] font-bold text-tx leading-none">
              {data.stats.checkedIn + data.stats.total - (data.stats.pending ?? 0) > 0
                ? `${Math.round((data.stats.checkedIn / Math.max(1, data.stats.total - (data.stats.pending ?? 0))) * 100)}%`
                : '—'
              }
            </p>
            <p className="text-tx3 text-[11px] font-semibold mt-1">Asistencia</p>
          </div>
        </div>

        {/* Venue favorito */}
        {data.stats.favoriteVenue && (
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-c1l flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="var(--c1)" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
                Tu favorito
              </p>
              <p className="text-[14px] font-bold text-tx truncate">{data.stats.favoriteVenue}</p>
            </div>
          </div>
        )}

        {/* Datos de contacto */}
        <div className="card divide-y divide-[var(--br)]">
          {data.phone && (
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-[13px] text-tx2">Teléfono</span>
              <span className="text-[13px] font-semibold text-tx">{data.phone}</span>
            </div>
          )}
          {data.email && (
            <div className="px-4 py-3.5 flex items-center justify-between">
              <span className="text-[13px] text-tx2">Email</span>
              <span className="text-[13px] font-semibold text-tx truncate max-w-[60%]">{data.email}</span>
            </div>
          )}
        </div>

        {/* Acciones rápidas */}
        <div className="card divide-y divide-[var(--br)]">
          <Link href="/mis-reservas"
            className="px-4 py-3.5 flex items-center justify-between active:bg-sf transition-colors">
            <span className="text-[14px] font-semibold text-tx">Mis reservas</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
          <Link href="/perfil/configuracion"
            className="px-4 py-3.5 flex items-center justify-between active:bg-sf transition-colors">
            <span className="text-[14px] font-semibold text-tx">Configuración</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-4 rounded-xl border-2 border-c1/20 text-c1
                     font-bold text-[15px] active:scale-[0.97] transition-transform
                     disabled:opacity-50"
        >
          {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
        </button>

        <p className="text-center text-tx3 text-[11px] pb-2">
          Un Toque · v1.0
        </p>

      </div>

      <BottomNav />
    </div>
  )
}
