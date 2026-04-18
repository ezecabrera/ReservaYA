'use client'

import { useEffect, useState } from 'react'

interface Summary {
  pending: number
  failed: number
  sent_today: number
  available: boolean
}

/**
 * Widget compacto que se muestra en el dashboard indicando el estado del
 * outbox de notificaciones. Si hay failed > 0, lo resalta en rojo y el dueño
 * sabe que tiene mensajes sin enviar que requieren atención.
 *
 * Si la tabla no existe (migration 009 no aplicada) se oculta silenciosamente.
 */
export function NotificationsWidget() {
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/notifications/summary')
        if (!res.ok) return
        const d: Summary = await res.json()
        if (!cancelled) setData(d)
      } catch {}
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  if (!data || !data.available) return null
  if (data.pending === 0 && data.failed === 0 && data.sent_today === 0) return null

  const hasFailure = data.failed > 0

  return (
    <div className="relative bg-white/[0.04] border border-white/8 rounded-2xl p-4 overflow-hidden">
      <div
        aria-hidden
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
          hasFailure
            ? 'from-[#FF8A91]/60 via-[#FF8A91]/15 to-transparent'
            : 'from-[#7BD3B2]/55 via-[#7BD3B2]/10 to-transparent'
        }`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10.5px] font-bold text-white/40 uppercase tracking-[0.1em] mb-1">
            WhatsApp · hoy
          </p>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="font-display font-bold text-[22px] text-[#7BD3B2] tracking-tight">
                {data.sent_today}
              </span>
              <span className="text-white/50 text-[11px] ml-1">enviados</span>
            </div>
            {data.pending > 0 && (
              <div>
                <span className="font-display font-bold text-[16px] text-[#F3C773] tracking-tight">
                  {data.pending}
                </span>
                <span className="text-white/45 text-[11px] ml-1">pendientes</span>
              </div>
            )}
            {data.failed > 0 && (
              <div>
                <span className="font-display font-bold text-[16px] text-[#FF8A91] tracking-tight">
                  {data.failed}
                </span>
                <span className="text-white/45 text-[11px] ml-1">fallaron</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center
                        text-white/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
