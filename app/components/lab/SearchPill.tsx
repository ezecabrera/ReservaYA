'use client'

import { useState } from 'react'

type Tab = 'when' | 'party' | null

interface Props {
  defaultDate?: string
  defaultTime?: string
  defaultParty?: number
  onChange?: (v: { date: string; time: string; party: number }) => void
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function SearchPill({
  defaultDate,
  defaultTime = '21:00',
  defaultParty = 2,
  onChange,
}: Props) {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const [date, setDate] = useState(defaultDate ?? iso)
  const [time, setTime] = useState(defaultTime)
  const [party, setParty] = useState(defaultParty)
  const [open, setOpen] = useState<Tab>(null)

  function emit(v: Partial<{ date: string; time: string; party: number }>) {
    const next = { date, time, party, ...v }
    onChange?.(next)
    if (v.date) setDate(v.date)
    if (v.time) setTime(v.time)
    if (v.party) setParty(v.party)
  }

  return (
    <div className="relative">
      {/* Pill compacto */}
      <div
        className="flex items-stretch bg-white rounded-full border border-[rgba(0,0,0,0.08)]
                   shadow-sm overflow-hidden"
      >
        <button
          onClick={() => setOpen(open === 'when' ? null : 'when')}
          className="flex-1 flex flex-col items-start px-4 py-2.5 active:bg-sf
                     text-left"
        >
          <span className="text-[10px] font-bold text-tx3 uppercase tracking-wider">
            Cuándo
          </span>
          <span className="text-[13px] font-semibold text-tx truncate">
            {formatDateLabel(date)} · {time}
          </span>
        </button>
        <div className="w-px bg-[var(--br)] my-2" />
        <button
          onClick={() => setOpen(open === 'party' ? null : 'party')}
          className="px-4 py-2.5 active:bg-sf flex flex-col items-start text-left"
        >
          <span className="text-[10px] font-bold text-tx3 uppercase tracking-wider">
            Personas
          </span>
          <span className="text-[13px] font-semibold text-tx">{party}</span>
        </button>
        <div className="my-1.5 mr-1.5 flex items-center">
          <div
            className="w-9 h-9 rounded-full bg-c1 flex items-center justify-center
                       shadow-[0_4px_12px_rgba(255,71,87,0.28)]"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Popover cuándo */}
      {open === 'when' && (
        <div className="absolute left-0 right-0 top-[56px] z-30 bg-white rounded-xl
                        border border-[var(--br)] shadow-lg p-4 animate-slide-down">
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-2">Fecha</p>
          <input
            type="date"
            value={date}
            min={iso}
            onChange={(e) => emit({ date: e.target.value })}
            className="w-full rounded-md border border-[var(--br)] bg-sf px-3 py-2.5
                       text-[14px] text-tx outline-none focus:border-c4"
          />
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mt-4 mb-2">Hora</p>
          <div className="grid grid-cols-4 gap-2">
            {['13:00', '14:00', '20:00', '21:00', '21:30', '22:00', '22:30', '23:00'].map((t) => (
              <button
                key={t}
                onClick={() => { emit({ time: t }); setOpen(null) }}
                className={`py-2.5 rounded-md border text-[13px] font-semibold transition-all
                  ${t === time
                    ? 'bg-c1 text-white border-c1 shadow-[0_4px_12px_rgba(255,71,87,0.28)]'
                    : 'bg-sf text-tx2 border-[var(--br)] hover:border-c1'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popover comensales */}
      {open === 'party' && (
        <div className="absolute left-0 right-0 top-[56px] z-30 bg-white rounded-xl
                        border border-[var(--br)] shadow-lg p-4 animate-slide-down">
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-3">
            ¿Cuántos son?
          </p>
          <div className="flex items-center justify-center gap-6 py-2">
            <button
              onClick={() => emit({ party: Math.max(1, party - 1) })}
              disabled={party <= 1}
              className="w-11 h-11 rounded-full bg-sf border border-[var(--br)]
                         flex items-center justify-center active:scale-95 disabled:opacity-40"
              aria-label="Menos comensales"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="font-display text-[42px] font-bold text-tx w-14 text-center">
              {party}
            </span>
            <button
              onClick={() => emit({ party: Math.min(20, party + 1) })}
              disabled={party >= 20}
              className="w-11 h-11 rounded-full bg-c1 text-white flex items-center justify-center
                         active:scale-95 disabled:opacity-40 shadow-[0_4px_12px_rgba(255,71,87,0.28)]"
              aria-label="Más comensales"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-tx3 text-[12px] text-center mt-2">
            {party >= 8 ? 'Para grupos grandes confirmamos por WhatsApp' : 'Hasta 20 comensales'}
          </p>
        </div>
      )}
    </div>
  )
}
