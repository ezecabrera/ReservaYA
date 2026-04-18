'use client'

import { useEffect, useState } from 'react'
import { NewReservationSheet } from './NewReservationSheet'

/**
 * Trigger global para crear una reserva desde cualquier parte del panel.
 *
 * Caso de uso central: cliente presencial pide una reserva para más tarde
 * o para otro día. El staff tiene que poder hacerlo en 15 segundos sin
 * salirse del modo operativo (no hay que navegar a /reservas primero).
 *
 * Variantes visuales:
 *   - `pill`: botón full con label "Nueva reserva" — sidebar desktop
 *   - `fab`:  floating action button coral — mobile bottom-right
 *   - `inline`: botón compacto con icon + label — para headers/toolbars
 *
 * Keyboard: "N" desde cualquier parte abre el sheet (si no hay focus en input).
 */

interface Props {
  variant?: 'pill' | 'fab' | 'inline'
  /** Fecha default que abre el form (YYYY-MM-DD). Default hoy. */
  defaultDate?: string
  /** Callback tras crear — si no se da, no hacemos nada post-create. */
  onCreated?: () => void
  className?: string
}

export function NewReservationTrigger({
  variant = 'pill',
  defaultDate,
  onCreated,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)

  // Keyboard shortcut "N"
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return
      // Si el focus está en un input/textarea/contentEditable, ignorar
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const date = defaultDate ?? new Date().toISOString().slice(0, 10)

  const plus = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )

  return (
    <>
      {variant === 'pill' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full h-10 rounded-lg bg-wine text-white
                      flex items-center justify-center gap-2
                      text-[13px] font-bold
                      shadow-[0_4px_16px_-4px_rgba(161,49,67,0.55)]
                      hover:brightness-110 active:scale-[0.98]
                      transition-all duration-200 ${className}`}
        >
          {plus}
          <span>Nueva reserva</span>
          <kbd className="ml-auto text-[10px] font-mono text-white/60 bg-white/10
                          rounded px-1.5 py-0.5 border border-white/15">
            N
          </kbd>
        </button>
      )}

      {variant === 'inline' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg
                      bg-wine text-white text-[12.5px] font-bold
                      shadow-[0_3px_10px_-2px_rgba(161,49,67,0.50)]
                      hover:brightness-110 active:scale-[0.97]
                      transition-all duration-150 ${className}`}
        >
          {plus}
          Nueva
        </button>
      )}

      {variant === 'fab' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Nueva reserva"
          className={`fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-wine text-white
                      shadow-[0_12px_28px_-4px_rgba(161,49,67,0.65)]
                      flex items-center justify-center active:scale-95
                      transition-transform lg:hidden ${className}`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {open && (
        <NewReservationSheet
          defaultDate={date}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false)
            // Evento global: cualquier página con lista de reservas lo escucha
            // y refresca (sin prop drilling o context).
            window.dispatchEvent(new CustomEvent('reservation:created'))
            onCreated?.()
          }}
        />
      )}
    </>
  )
}
