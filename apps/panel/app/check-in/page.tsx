'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PanelNav } from '@/components/nav/PanelNav'
import { PageHeader } from '@/components/ui/PageHeader'

type CheckInState = 'idle' | 'loading' | 'success' | 'error'

interface CheckInResult {
  guest_name?: string
  time_slot?: string
  message?: string
  already?: boolean
  party_size?: number
  table_label?: string
}

const NAVY = '#0F3460'

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sf" />}>
      <CheckInInner />
    </Suspense>
  )
}

function CheckInInner() {
  const searchParams = useSearchParams()
  const isPreview = process.env.NODE_ENV !== 'production' && searchParams.has('preview')

  const [code, setCode] = useState('')
  const [state, setState] = useState<CheckInState>('idle')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setState('loading')

    if (isPreview) {
      setTimeout(() => {
        setResult({
          guest_name: 'Martín García',
          time_slot: '21:00',
          party_size: 4,
          table_label: 'T1',
        })
        setState('success')
        setCode('')
        setTimeout(() => setState('idle'), 5000)
      }, 500)
      return
    }

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

      setResult(data as CheckInResult)
      setState('success')
      setCode('')
      setTimeout(() => setState('idle'), 5000)
    } catch {
      setErrorMsg('Error de conexión')
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-sf pb-20">
      <PageHeader
        title="Check-in"
        subtitle="Ingresá el código o escaneá el QR del cliente"
        venueName={isPreview ? 'La Cantina de Martín' : undefined}
      />

      <main className="max-w-md mx-auto px-5 pt-6 space-y-4">

        {/* Success state */}
        {state === 'success' && result && (
          <div className="bg-white rounded-md border border-c2/30 p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-c2l border border-c2/25 flex items-center justify-center mx-auto mb-3">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#15A67A"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-sans-black text-[22px] text-tx leading-none">
              {result.guest_name ?? 'Cliente'}
            </p>
            <p className="text-tx2 text-[13px] mt-2">
              {result.already
                ? result.message
                : `Check-in realizado · ${result.time_slot ?? ''} hs`}
            </p>
            {(result.table_label || result.party_size) && (
              <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-center gap-5 text-[13px]">
                {result.table_label && (
                  <div>
                    <span className="text-tx3 text-[11px] font-semibold uppercase tracking-wider">Mesa</span>
                    <p className="font-sans-black text-[18px] text-tx leading-none mt-1">{result.table_label}</p>
                  </div>
                )}
                {result.party_size && (
                  <div>
                    <span className="text-tx3 text-[11px] font-semibold uppercase tracking-wider">Personas</span>
                    <p className="font-display text-[18px] text-tx leading-none mt-1 tabular-nums">
                      {result.party_size}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="bg-c1l border border-[#D63646]/20 rounded-md p-3.5 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" stroke="#D63646" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#D63646" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[#D63646] text-[13px] font-medium flex-1 leading-snug">
              {errorMsg}
            </p>
            <button
              onClick={() => setState('idle')}
              className="text-tx3 text-[16px] leading-none hover:text-[#D63646] transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleCheckIn}
          className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-5 space-y-4"
        >
          <div>
            <label className="block text-[12px] font-semibold text-tx2 mb-1.5">
              Código de reserva o token QR
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Pegá el token o código aquí"
              autoComplete="off"
              autoFocus
              className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                         px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none font-mono
                         focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                         transition-colors duration-[160ms]"
            />
          </div>

          <button
            type="submit"
            disabled={!code.trim() || state === 'loading'}
            className="w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                       disabled:opacity-60 hover:bg-[#0A2548]
                       transition-colors duration-[160ms] flex items-center justify-center gap-2"
          >
            {state === 'loading'
              ? (<><Spinner /> Verificando…</>)
              : 'Confirmar check-in'}
          </button>
        </form>

        {/* Instrucciones */}
        <div className="bg-white rounded-md border border-[rgba(0,0,0,0.07)] p-5">
          <p className="text-[11px] font-semibold text-tx3 uppercase tracking-wider mb-3">
            Cómo funciona
          </p>
          <div className="space-y-3">
            {[
              'El cliente muestra el QR del email o su código de mesa',
              'Escaneá el QR con la cámara del dispositivo y pegá el token',
              'O pedile que diga su nombre y código (ej: "Germán, T2")',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-[11px]"
                  style={{ background: `${NAVY}14`, color: NAVY }}
                >
                  {i + 1}
                </span>
                <p className="text-tx2 text-[13px] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PanelNav />
    </div>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 00-9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
