'use client'

import { useState } from 'react'
import { PanelNav } from '@/components/nav/PanelNav'

type CheckInState = 'idle' | 'loading' | 'success' | 'error'

export default function CheckInPage() {
  const [code, setCode] = useState('')
  const [state, setState] = useState<CheckInState>('idle')
  const [result, setResult] = useState<{ guest_name?: string; time_slot?: string; message?: string; already?: boolean } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setState('loading')

    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code.trim() }),
      })
      const data = await res.json() as {
        ok?: boolean; guest_name?: string; time_slot?: string
        error?: string; message?: string
      }

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error ?? 'Check-in fallido')
        setState('error')
        return
      }

      setResult(data)
      setState('success')
      setCode('')
      // Auto-reset después de 5s
      setTimeout(() => setState('idle'), 5000)
    } catch {
      setErrorMsg('Error de conexión')
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-ink pb-24">

      <div className="px-5 pt-12 pb-6">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-text-3 mb-1">
          Ingreso
        </p>
        <h1 className="font-display text-[26px] font-bold text-ink-text tracking-tight leading-tight">
          Check-in
        </h1>
        <p className="text-ink-text-2 text-[13px] mt-1">
          Ingresá el código o escaneá el QR
        </p>
      </div>

      {/* Success state */}
      {state === 'success' && result && (
        <div className="mx-5 mb-5 bg-olive/18 border border-olive/40 rounded-2xl p-6 text-center
                        view-enter">
          <div className="w-14 h-14 rounded-full bg-olive flex items-center justify-center mx-auto mb-3
                          shadow-[0_8px_22px_-6px_rgba(79,138,95,0.55)]">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke="white"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display text-[22px] font-bold text-ink-text">
            {result.guest_name ?? 'Cliente'}
          </p>
          <p className="text-ink-text-2 text-[14px] mt-1">
            {result.already ? result.message : `Check-in realizado · ${result.time_slot} hs`}
          </p>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="mx-5 mb-5 bg-wine/15 border border-wine/35 rounded-2xl p-4 flex items-center gap-3
                        view-enter">
          <span className="text-wine-soft text-[20px]">✕</span>
          <p className="text-ink-text text-[14px]">{errorMsg}</p>
          <button onClick={() => setState('idle')}
            className="ml-auto text-ink-text-3 text-[20px] leading-none hover:text-ink-text transition-colors">
            &times;
          </button>
        </div>
      )}

      {/* Input de código */}
      <div className="mx-5">
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-ink-text-3 uppercase tracking-[0.12em] mb-2">
              Código de reserva o token QR
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Pegá el token o código aquí"
              autoComplete="off"
              autoFocus
              className="w-full rounded-xl bg-ink-2 border border-ink-line-2
                         px-4 py-4 text-[14px] text-ink-text placeholder-ink-text-3
                         outline-none focus:border-olive/50 focus:ring-2 focus:ring-olive/20
                         transition-all duration-[180ms] font-mono tabular-nums"
            />
          </div>

          <button
            type="submit"
            disabled={!code.trim() || state === 'loading'}
            className="w-full py-4 rounded-xl bg-olive text-white font-bold text-[15px]
                       shadow-[0_8px_22px_-6px_rgba(79,138,95,0.55)] disabled:opacity-50
                       hover:brightness-110 active:scale-[0.97]
                       transition-all duration-[180ms]"
          >
            {state === 'loading' ? 'Verificando…' : 'Confirmar check-in'}
          </button>
        </form>

        {/* Instrucciones */}
        <div className="mt-8 space-y-3">
          <p className="text-[11px] font-bold text-ink-text-3 uppercase tracking-[0.12em]">
            Cómo funciona
          </p>
          {[
            ['1', 'El cliente muestra el QR del email o su código de mesa'],
            ['2', 'Escaneá el QR con la cámara del dispositivo y pegá el token'],
            ['3', 'O pedile que diga su nombre y código ("Germán, T2")'],
          ].map(([num, text]) => (
            <div key={num} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-ink-2 border border-ink-line-2
                               flex items-center justify-center
                               text-[10px] font-bold text-ink-text-2 flex-shrink-0 mt-0.5
                               font-mono">
                {num}
              </span>
              <p className="text-ink-text-2 text-[13px]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <PanelNav />
    </div>
  )
}
