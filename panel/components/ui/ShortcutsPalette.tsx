'use client'

import { useEffect, useState } from 'react'

/**
 * Shortcuts palette — modal de referencia de atajos del panel.
 * Se abre con "?" desde cualquier lado (ignora si hay focus en input).
 * Cierra con Esc o click fuera. Grupo visual por contexto: Global,
 * Dashboard, Reserva. Kbd pills con mono font y border ink-line-2.
 */

interface Shortcut {
  keys: string[]
  label: string
  hint?: string
}

interface Group {
  title: string
  items: Shortcut[]
}

const GROUPS: Group[] = [
  {
    title: 'Global',
    items: [
      { keys: ['?'], label: 'Abrir esta paleta',        hint: 'Visible desde cualquier página del panel' },
      { keys: ['N'], label: 'Nueva reserva',            hint: 'Walk-in, llamada o reserva futura' },
      { keys: ['Esc'], label: 'Cerrar panel / sheet',   hint: 'Dismiss por prioridad: rate → edit → detalle' },
    ],
  },
  {
    title: 'Dashboard',
    items: [
      { keys: ['/'], label: 'Foco al buscador',    hint: 'Filtra cola por nombre o teléfono' },
      { keys: ['F'], label: 'Vista Piso',          hint: 'Grid espacial de mesas con drop zones' },
      { keys: ['T'], label: 'Vista Timeline',      hint: 'Matriz mesa × hora, drag reprograma' },
    ],
  },
]

export function ShortcutsPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // "?" es Shift + "/" en teclado inglés; en layouts AR puede venir
      // como "?" directo. Cubrimos ambos casos.
      const isQuestionMark = e.key === '?' || (e.key === '/' && e.shiftKey)
      if (isQuestionMark) {
        const target = e.target as HTMLElement | null
        const inInput = target && (
          target.tagName === 'INPUT'
          || target.tagName === 'TEXTAREA'
          || target.isContentEditable
        )
        if (inInput || e.metaKey || e.ctrlKey || e.altKey) return
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm
                   animate-[fadeUp_0.2s_cubic-bezier(0.32,0.72,0,1)_both]"
      />

      <div
        role="dialog"
        aria-label="Atajos de teclado"
        className="relative w-full max-w-md rounded-2xl bg-ink-2 border border-ink-line-2
                   shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)]
                   overflow-hidden
                   animate-[slideUp_0.26s_cubic-bezier(0.32,0.72,0,1)_both]"
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-ink-line flex items-start justify-between">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-text-3 mb-0.5">
              Teclado
            </p>
            <h2 className="font-display text-[19px] font-bold text-ink-text leading-tight">
              Atajos del panel
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="w-8 h-8 -mt-1 -mr-1 rounded-md text-ink-text-3
                       hover:text-ink-text hover:bg-ink-3
                       flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Groups */}
        <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {GROUPS.map((g) => (
            <section key={g.title}>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-text-3 mb-2">
                {g.title}
              </p>
              <ul className="space-y-1.5">
                {g.items.map((s) => (
                  <li
                    key={s.keys.join('+') + s.label}
                    className="flex items-start justify-between gap-3 py-1.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink-text leading-tight">{s.label}</p>
                      {s.hint && (
                        <p className="text-[11px] text-ink-text-3 mt-0.5 leading-snug">
                          {s.hint}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="min-w-[28px] h-7 px-2 rounded-md bg-ink border border-ink-line-2
                                     flex items-center justify-center
                                     text-[11.5px] font-mono font-semibold text-ink-text"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink-line bg-ink">
          <p className="text-[11px] text-ink-text-3 leading-snug">
            Los atajos se ignoran cuando estás escribiendo en un input o
            textarea. Abrí esta paleta desde cualquier página con{' '}
            <kbd className="inline-block bg-ink-2 border border-ink-line-2 rounded px-1.5 py-0.5
                             font-mono text-[10px] text-ink-text-2">?</kbd>.
          </p>
        </div>
      </div>
    </div>
  )
}
