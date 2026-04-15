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
    <div className="min-h-screen pb-24"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      <div className="px-5 pt-12 pb-6">
        <h1 className="font-display text-[24px] font-bold text-white tracking-tight">
          Check-in
        </h1>
        <p className="text-white/55 text-[13px] mt-0.5">
          Ingresá el código o escaneá el QR
        </p>
      </div>

      {/* Success state */}
      {state === 'success' && result && (
        <div className="mx-5 mb-5 bg-c2/15 border border-c2/30 rounded-2xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-c2 flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" stroke="white"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-display text-[22px] font-bold text-white">
            {result.guest_name ?? 'Cliente'}
          </p>
          <p className="text-white/55 text-[14px] mt-1">
            {result.already ? result.message : `Check-in realizado · ${result.time_slot} hs`}
          </p>
        </div>
      )}

      {/* Error state */}
      {state === 'error' && (
        <div className="mx-5 mb-5 bg-c1/15 border border-c1/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-c1 text-[20px]">✕</span>
          <p className="text-white/80 text-[14px]">{errorMsg}</p>
          <button onClick={() => setState('idle')}
            className="ml-auto text-white/40 text-[20px] leading-none">&times;</button>
        </div>
      )}

      {/* Input de código */}
      <div className="mx-5">
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-white/40 uppercase tracking-wider mb-2">
              Código de reserva o token QR
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Pegá el token o código aquí"
              autoComplete="off"
              autoFocus
              className="w-full rounded-xl bg-white/10 border border-white/15
                         px-4 py-4 text-[14px] text-white placeholder-white/30
                         outline-none focus:border-c2/50 focus:ring-2 focus:ring-c2/20
                         transition-all duration-[180ms]"
            />
          </div>

          <button
            type="submit"
            disabled={!code.trim() || state === 'loading'}
            className="w-full py-4 rounded-xl bg-c2 text-white font-bold text-[15px]
                       shadow-c2 disabled:opacity-50 transition-all duration-[180ms]
                       active:scale-[0.97]"
          >
            {state === 'loading' ? 'Verificando…' : 'Confirmar check-in'}
          </button>
        </form>

        {/* Instrucciones */}
        <div className="mt-8 space-y-3">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider">Cómo funciona</p>
          {[
            ['1', 'El cliente muestra el QR del email o su código de mesa'],
            ['2', 'Escaneá el QR con la cámara del dispositivo y pegá el token'],
            ['3', 'O pedile que diga su nombre y código ("Germán, T2")'],
          ].map(([num, text]) => (
            <div key={num} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center
                               text-[10px] font-bold text-white/40 flex-shrink-0 mt-0.5">
                {num}
              </span>
              <p className="text-white/45 text-[13px]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <PanelNav />
    </div>
  )
}
