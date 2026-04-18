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
    <div className="relative bg-ink-2 border border-ink-line rounded-2xl p-4 overflow-hidden
                    hover:border-ink-line-2 transition-colors">
      <div
        aria-hidden
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
          hasFailure
            ? 'from-wine-soft/60 via-wine/15 to-transparent'
            : 'from-olive/55 via-olive/10 to-transparent'
        }`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10.5px] font-bold text-ink-text-3 uppercase tracking-[0.12em] mb-1">
            WhatsApp · hoy
          </p>
          <div className="flex items-baseline gap-4 flex-wrap">
            <div>
              <span className="font-display font-bold text-[22px] text-olive tracking-tight tabular-nums">
                {data.sent_today}
              </span>
              <span className="text-ink-text-3 text-[11px] ml-1">enviados</span>
            </div>
            {data.pending > 0 && (
              <div>
                <span className="font-display font-bold text-[16px] text-gold tracking-tight tabular-nums">
                  {data.pending}
                </span>
                <span className="text-ink-text-3 text-[11px] ml-1">pendientes</span>
              </div>
            )}
            {data.failed > 0 && (
              <div>
                <span className="font-display font-bold text-[16px] text-wine-soft tracking-tight tabular-nums">
                  {data.failed}
                </span>
                <span className="text-ink-text-3 text-[11px] ml-1">fallaron</span>
              </div>
            )}
          </div>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                         transition-colors
                         ${hasFailure
                           ? 'bg-wine/15 border border-wine/30 text-wine-soft'
                           : 'bg-ink-3 border border-ink-line-2 text-ink-text-2'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
