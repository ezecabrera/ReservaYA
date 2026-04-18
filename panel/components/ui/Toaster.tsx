'use client'

import { useEffect, useState } from 'react'
import { subscribeToasts, dismissToast, type Toast, type ToastTone } from '@/lib/toast'

/**
 * Pila de toasts del panel. Montar una sola vez en el layout.
 * Se suscribe al pub/sub de @/lib/toast y renderiza en esquina inferior
 * centrada. Cada toast animado con fadeUp + hover pausa el desalojo
 * (simulando una lectura atenta).
 *
 * Tonos:
 *   - ok:    bg-olive-tenue (confirmación positiva)
 *   - error: bg-wine-tenue  (conflictos, validaciones)
 *   - info:  bg-ink-3       (mensajes neutros, tips, shortcuts)
 */

const TONE_STYLES: Record<ToastTone, { bg: string; border: string; dot: string; text: string }> = {
  ok:    { bg: 'bg-olive/22',  border: 'border-olive/45',      dot: 'bg-olive',      text: 'text-ink-text' },
  error: { bg: 'bg-wine/25',   border: 'border-wine/50',       dot: 'bg-wine-soft',  text: 'text-ink-text' },
  info:  { bg: 'bg-ink-3',     border: 'border-ink-line-2',    dot: 'bg-ink-text-2', text: 'text-ink-text' },
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    return subscribeToasts(setItems)
  }, [])

  if (items.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]
                 flex flex-col-reverse items-center gap-2 pointer-events-none"
    >
      {items.map((t) => {
        const s = TONE_STYLES[t.tone]
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            className={`${s.bg} ${s.border} ${s.text}
                        pointer-events-auto rounded-xl border backdrop-blur-sm
                        px-4 py-2.5 min-w-[220px] max-w-[360px]
                        shadow-[0_14px_32px_-10px_rgba(0,0,0,0.6)]
                        flex items-start gap-2.5
                        animate-[fadeUp_0.26s_cubic-bezier(0.32,0.72,0,1)_both]
                        hover:brightness-110 transition-[filter] cursor-pointer
                        text-left`}
          >
            <span className={`${s.dot} w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold leading-tight truncate">
                {t.text}
              </p>
              {t.hint && (
                <p className="text-[11px] text-ink-text-2 mt-0.5 leading-snug">
                  {t.hint}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
