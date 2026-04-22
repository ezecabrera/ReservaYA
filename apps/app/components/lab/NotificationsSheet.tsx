'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Notifications — scaffolding
 *
 * Por ahora muestra una lista derivada de /api/mis-reservas:
 * - "Reserva próxima" (< 24hs)
 * - "Reserva pendiente de pago" (pending_payment)
 * - "Reserva confirmada" (confirmed)
 *
 * Próximo paso: crear tabla `notifications` en Supabase con push real
 * desde triggers (cambios de status de reserva, promociones, etc).
 */

interface Notif {
  id: string
  kind: 'reservation_upcoming' | 'pending_payment' | 'confirmed' | 'streak' | 'tier'
  title: string
  body: string
  href: string
  icon?: string          // emoji para kinds 'streak' y 'tier'
  createdAt: number      // ms
  read: boolean
}

interface RewardsMini {
  tier: 'bronce' | 'plata' | 'oro'
  tierLabel: string
  toNextTier: number | null
  nextTierLabel: string | null
  incentive: string
  streaks: Array<{ icon: string; title: string; subtitle: string }>
}

function readLocalReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem('untoque-notifs-read')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveLocalReadIds(ids: Set<string>) {
  try { localStorage.setItem('untoque-notifs-read', JSON.stringify([...ids])) } catch { /* */ }
}

function formatAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Hace ${days} d`
}

interface Props {
  open: boolean
  onClose: () => void
}

export function NotificationsSheet({ open, onClose }: Props) {
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    const readIds = readLocalReadIds()
    setLoading(true)
    Promise.all([
      fetch('/api/mis-reservas').then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/perfil').then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([list, profile]: [
      Array<{ id: string; status: string; date: string; time_slot: string; venues: { name: string } | null }>,
      { rewards?: RewardsMini } | null,
    ]) => {
      const now = Date.now()
      const items: Notif[] = []

      // Reservas
      if (Array.isArray(list)) {
        for (const r of list) {
          const ts = new Date(`${r.date}T${r.time_slot.slice(0, 5)}:00`).getTime()
          if (r.status === 'pending_payment') {
            items.push({
              id: `pay-${r.id}`,
              kind: 'pending_payment',
              title: 'Completá el pago de tu reserva',
              body: `${r.venues?.name ?? 'Restaurante'} — tu lugar se libera pronto si no pagás.`,
              href: `/reserva/${r.id}/pagar`,
              createdAt: now - 5 * 60_000,
              read: readIds.has(`pay-${r.id}`),
            })
          } else if (r.status === 'confirmed' && ts > now && ts - now < 24 * 3600_000) {
            items.push({
              id: `upc-${r.id}`,
              kind: 'reservation_upcoming',
              title: 'Tu reserva es pronto',
              body: `${r.venues?.name ?? 'Restaurante'} hoy a las ${r.time_slot.slice(0, 5)} hs.`,
              href: `/reserva/${r.id}/confirmacion`,
              createdAt: now - 30 * 60_000,
              read: readIds.has(`upc-${r.id}`),
            })
          } else if (r.status === 'confirmed') {
            items.push({
              id: `cfm-${r.id}`,
              kind: 'confirmed',
              title: 'Reserva confirmada',
              body: `${r.venues?.name ?? 'Restaurante'} — ya tenés tu QR listo.`,
              href: `/reserva/${r.id}/confirmacion`,
              createdAt: now - 60 * 60_000,
              read: readIds.has(`cfm-${r.id}`),
            })
          }
        }
      }

      // Rewards: rachas + nudge de tier
      const rewards = profile?.rewards
      if (rewards) {
        rewards.streaks.forEach((s, i) => {
          const id = `streak-${i}-${s.title}`
          items.push({
            id,
            kind: 'streak',
            icon: s.icon,
            title: s.title,
            body: s.subtitle,
            href: '/perfil',
            createdAt: now - (2 + i) * 3600_000,
            read: readIds.has(id),
          })
        })
        if (rewards.toNextTier !== null && rewards.toNextTier <= 2 && rewards.toNextTier > 0) {
          const id = `tier-next-${rewards.nextTierLabel}`
          items.push({
            id,
            kind: 'tier',
            icon: '🔥',
            title: `A ${rewards.toNextTier} reserva${rewards.toNextTier === 1 ? '' : 's'} de ${rewards.nextTierLabel}`,
            body: rewards.incentive,
            href: '/perfil',
            createdAt: now - 4 * 3600_000,
            read: readIds.has(id),
          })
        }
      }

      items.sort((a, b) => b.createdAt - a.createdAt)
      setNotifs(items)
    }).finally(() => setLoading(false))
  }, [open])

  function markAllRead() {
    const ids = new Set(notifs.map((n) => n.id))
    saveLocalReadIds(ids)
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })))
  }

  useEffect(() => {
    // Al abrir el sheet, marcar como leídas después de 2s
    if (open && notifs.length > 0) {
      const id = setTimeout(() => markAllRead(), 2000)
      return () => clearTimeout(id)
    }
  }, [open, notifs.length])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  return (
    // Mobile: bottom sheet · Desktop (lg+): modal centrado desde la derecha
    <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:justify-start lg:items-end lg:p-6">
      <button
        aria-label="Cerrar notificaciones"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative bg-bg rounded-t-3xl max-h-[85vh] flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.12)] lg:rounded-2xl lg:w-[380px] lg:max-h-[calc(100vh-100px)] lg:mt-[60px] lg:shadow-[0_14px_40px_rgba(0,0,0,0.12)]">
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-tx3/40" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--br)]">
          <h2 className="font-display text-[17px] font-bold text-tx">Notificaciones</h2>
          <button onClick={onClose} className="text-tx2 p-1" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-lg" />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-sf flex items-center justify-center mx-auto mb-3 border border-[var(--br)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.16V11a6 6 0 00-5-5.92V4a1 1 0 10-2 0v1.08A6 6 0 006 11v3.16c0 .54-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        stroke="var(--tx3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-display text-[17px] font-bold text-tx">Sin notificaciones</p>
              <p className="text-[13px] text-tx2 mt-1">Te avisaremos cuando tengas reservas próximas o cambios.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--br)]">
              {notifs.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={onClose}
                    className="flex gap-3 p-4 active:bg-sf transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                                    ${n.kind === 'pending_payment' ? 'bg-c3l'
                                      : n.kind === 'reservation_upcoming' ? 'bg-c1l'
                                      : n.kind === 'streak' ? 'bg-c3l'
                                      : n.kind === 'tier' ? 'bg-c1l'
                                      : 'bg-c2l'}`}>
                      {n.kind === 'pending_payment' && <span className="text-[16px]">💳</span>}
                      {n.kind === 'reservation_upcoming' && <span className="text-[16px]">⏰</span>}
                      {n.kind === 'confirmed' && <span className="text-[16px]">✓</span>}
                      {(n.kind === 'streak' || n.kind === 'tier') && <span className="text-[16px]">{n.icon}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-[14px] ${n.read ? 'font-semibold text-tx2' : 'font-bold text-tx'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-c1" />}
                      </div>
                      <p className="text-[12px] text-tx2 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[11px] text-tx3 mt-1">{formatAgo(n.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/** Badge con contador de no leídas. Usar en el bell icon del home. */
export function useUnreadCount(): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [resList, resProfile] = await Promise.all([
          fetch('/api/mis-reservas'),
          fetch('/api/perfil'),
        ])
        const list = resList.ok ? await resList.json() : []
        const profile = resProfile.ok ? await resProfile.json() : null
        if (cancelled) return
        const readIds = readLocalReadIds()
        const now = Date.now()
        let count = 0
        if (Array.isArray(list)) {
          for (const r of list) {
            const ts = new Date(`${r.date}T${r.time_slot.slice(0, 5)}:00`).getTime()
            if (r.status === 'pending_payment' && !readIds.has(`pay-${r.id}`)) count++
            else if (r.status === 'confirmed' && ts > now && ts - now < 24 * 3600_000 && !readIds.has(`upc-${r.id}`)) count++
            else if (r.status === 'confirmed' && !readIds.has(`cfm-${r.id}`)) count++
          }
        }
        const rewards = (profile as { rewards?: RewardsMini } | null)?.rewards
        if (rewards) {
          rewards.streaks.forEach((s, i) => {
            const id = `streak-${i}-${s.title}`
            if (!readIds.has(id)) count++
          })
          if (rewards.toNextTier !== null && rewards.toNextTier <= 2 && rewards.toNextTier > 0) {
            const id = `tier-next-${rewards.nextTierLabel}`
            if (!readIds.has(id)) count++
          }
        }
        setN(count)
      } catch { /* silent */ }
    }
    load()
    const id = setInterval(load, 60_000) // refresh cada 1 min
    return () => { cancelled = true; clearInterval(id) }
  }, [])
  return n
}
