'use client'

import { useEffect, useState } from 'react'

interface Props {
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  time: string
}

function diffParts(ms: number) {
  if (ms <= 0) return { done: true, d: 0, h: 0, m: 0, s: 0 }
  const total = Math.floor(ms / 1000)
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { done: false, d, h, m, s }
}

export function Countdown({ date, time }: Props) {
  const target = new Date(`${date}T${time}:00`).getTime()
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const p = diffParts(target - now)

  if (p.done) {
    return (
      <div className="bg-c2l border border-c2/30 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-c2 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5 9-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-bold text-[#0F7A5A] uppercase tracking-wider">
            Es ahora
          </p>
          <p className="text-[13px] text-tx2">Te están esperando. Buen provecho.</p>
        </div>
      </div>
    )
  }

  const useDays = p.d > 0
  return (
    <div className="bg-gradient-to-br from-tx to-[#1a1a2e] text-white rounded-xl px-4 py-4">
      <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">
        Faltan
      </p>
      <div className="flex items-baseline gap-3">
        {useDays && (
          <Block value={p.d} label={p.d === 1 ? 'día' : 'días'} />
        )}
        <Block value={p.h} label="h" pad />
        <Block value={p.m} label="min" pad />
        {!useDays && <Block value={p.s} label="seg" pad small />}
      </div>
    </div>
  )
}

function Block({ value, label, pad, small }: { value: number; label: string; pad?: boolean; small?: boolean }) {
  const display = pad ? String(value).padStart(2, '0') : value
  return (
    <div className="flex flex-col items-start">
      <span className={`font-display font-bold leading-none tracking-tight ${small ? 'text-[28px] opacity-70' : 'text-[40px]'}`}>
        {display}
      </span>
      <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  )
}
