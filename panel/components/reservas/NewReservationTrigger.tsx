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

interface PrefilledState {
  tableId?: string
  timeSlot?: string
  date?: string
}

export function NewReservationTrigger({
  variant = 'pill',
  defaultDate,
  onCreated,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [prefilled, setPrefilled] = useState<PrefilledState>({})

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
      setPrefilled({})
      setOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Evento "open:new-reservation" con detail { table_id, time_slot, date }.
  // Disparado, por ejemplo, desde TimelineView al click en una celda vacía.
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ table_id?: string; time_slot?: string; date?: string }>
      setPrefilled({
        tableId: custom.detail?.table_id,
        timeSlot: custom.detail?.time_slot,
        date: custom.detail?.date,
      })
      setOpen(true)
    }
    window.addEventListener('open:new-reservation', handler as EventListener)
    return () => window.removeEventListener('open:new-reservation', handler as EventListener)
  }, [])

  const date = prefilled.date ?? defaultDate ?? new Date().toISOString().slice(0, 10)

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
          onClick={() => { setPrefilled({}); setOpen(true) }}
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
          onClick={() => { setPrefilled({}); setOpen(true) }}
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
          onClick={() => { setPrefilled({}); setOpen(true) }}
          aria-label="Nueva reserva"
          className={`group fixed right-5 bottom-24 z-40 w-14 h-14 rounded-full bg-wine text-white
                      shadow-[0_12px_28px_-4px_rgba(161,49,67,0.65)]
                      flex items-center justify-center
                      hover:scale-[1.06] hover:shadow-[0_16px_34px_-4px_rgba(161,49,67,0.75)]
                      active:scale-95
                      transition-all duration-200 lg:hidden ${className}`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            className="transition-transform duration-200 group-hover:rotate-90"
          >
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>

          {/* Tooltip — sólo visible en tablet con hover real (no en touch puro) */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-full mr-3 px-2.5 py-1
                       rounded-md bg-ink border border-ink-line-2
                       text-[11px] font-semibold text-ink-text whitespace-nowrap
                       opacity-0 translate-x-2
                       group-hover:opacity-100 group-hover:translate-x-0
                       transition-all duration-150
                       hidden md:block"
          >
            Nueva reserva
            <kbd className="ml-1.5 text-[10px] font-mono text-ink-text-3 bg-ink-2
                             border border-ink-line rounded px-1 py-0.5">N</kbd>
          </span>
        </button>
      )}

      {open && (
        <NewReservationSheet
          defaultDate={date}
          defaultTableId={prefilled.tableId}
          defaultTimeSlot={prefilled.timeSlot}
          onClose={() => { setOpen(false); setPrefilled({}) }}
          onCreated={() => {
            setOpen(false)
            setPrefilled({})
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
