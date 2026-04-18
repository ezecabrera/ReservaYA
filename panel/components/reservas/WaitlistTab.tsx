'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WaitlistEntry, WaitlistStatus } from '@/lib/shared'
import { mutateFetch } from '@/lib/panelFetch'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconHourglass } from '@/components/ui/Icons'

interface WaitlistTabProps {
  /** Cuando cambia este valor, la tab recarga (se usa al volver de crear). */
  reloadToken: number
}

function formatElapsed(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'recién'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

export function WaitlistTab({ reloadToken }: WaitlistTabProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist')
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, reloadToken])

  // Tick para recomputar "hace X min" sin recargar la data
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  async function patch(id: string, status: WaitlistStatus) {
    setError(null)
    setBusyId(id)
    const res = await mutateFetch(`/api/waitlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo actualizar')
      setBusyId(null)
      return
    }
    setBusyId(null)
    load()
  }

  void now // referencia para re-render cada 30s

  if (loading) {
    return (
      <div className="px-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        accent="amber"
        icon={<IconHourglass size={28} />}
        title="Nadie en espera"
        description="Tocá el botón para anotar un grupo que llegó sin reserva."
      />
    )
  }

  return (
    <div className="px-5 space-y-3">
      {error && (
        <div className="rounded-xl bg-wine/20 border border-wine/40 px-4 py-3
                        text-[13px] text-wine-soft">
          {error}
        </div>
      )}

      {entries.map((e) => {
        const isNotified = e.status === 'notified'
        const since = isNotified && e.notified_at
          ? formatElapsed(e.notified_at)
          : formatElapsed(e.created_at)

        return (
          <div
            key={e.id}
            className={`rounded-2xl px-4 py-3.5 border transition-colors ${
              isNotified
                ? 'bg-gold/15 border-gold/35'
                : 'bg-ink-2 border-ink-line hover:border-ink-line-2'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isNotified ? 'bg-gold/28 border border-gold/40' : 'bg-ink-3 border border-ink-line-2'
              }`}>
                <span className="font-display font-bold text-[16px] text-ink-text font-mono tabular-nums">
                  {e.party_size}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-ink-text font-semibold text-[14.5px] truncate">
                    {e.guest_name}
                  </p>
                  {isNotified && (
                    <span className="text-[9.5px] font-bold uppercase tracking-wide
                                     px-1.5 py-0.5 rounded bg-gold/35 text-gold border border-gold/45">
                      Avisado
                    </span>
                  )}
                </div>
                <p className="text-ink-text-3 text-[12px]">
                  {e.guest_phone ? `${e.guest_phone} · ` : ''}
                  {isNotified ? 'avisado hace' : 'espera hace'} {since}
                </p>
                {e.notes && (
                  <p className="text-ink-text-2 text-[11.5px] mt-1 italic line-clamp-2">
                    {e.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {e.status === 'waiting' && (
                <button
                  type="button"
                  onClick={() => patch(e.id, 'notified')}
                  disabled={busyId === e.id}
                  className="flex-1 h-10 rounded-xl bg-gold/28 border border-gold/45
                             text-gold text-[13px] font-bold disabled:opacity-60
                             hover:bg-gold/38 transition-colors"
                >
                  Avisar
                </button>
              )}
              <button
                type="button"
                onClick={() => patch(e.id, 'seated')}
                disabled={busyId === e.id}
                className="flex-1 h-10 rounded-xl bg-olive/28 border border-olive/45
                           text-olive text-[13px] font-bold disabled:opacity-60
                           hover:bg-olive/38 transition-colors"
              >
                Sentar
              </button>
              <button
                type="button"
                onClick={() => patch(e.id, 'left')}
                disabled={busyId === e.id}
                className="flex-1 h-10 rounded-xl bg-ink-3 border border-ink-line-2
                           text-ink-text-2 text-[13px] font-semibold disabled:opacity-60
                           hover:text-ink-text hover:bg-ink-3/80 transition-colors"
              >
                Se fue
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
