'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Data {
  venueName: string
  tableLabel: string
  date: string
  timeSlot: string
  partySize: number
  depositAmount: number
}

interface Props {
  reservationId: string
  data: Data
}

type Method = 'mp' | 'card'

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatTime(t: string) {
  return t.slice(0, 5)
}

export function PaymentMethodClient({ reservationId, data }: Props) {
  const [selected, setSelected] = useState<Method | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handlePay(method: Method) {
    setSelected(method)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reserva/${reservationId}/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error al iniciar el pago' }))
        setError(err.error ?? 'Error al iniciar el pago')
        setLoading(false)
        setSelected(null)
        return
      }
      const { init_point } = await res.json() as { init_point: string }
      window.location.href = init_point
    } catch {
      setError('Error de red. Probá de nuevo.')
      setLoading(false)
      setSelected(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-10">
      {/* Header */}
      <header className="screen-x pt-12 pb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="w-10 h-10 rounded-full bg-sf flex items-center justify-center
                     border border-[var(--br)] active:scale-95 transition-transform duration-[180ms]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-tx3 text-[11px] font-bold uppercase tracking-wider">
            Paso 2 de 2
          </p>
          <h1 className="font-display text-[22px] font-bold text-tx leading-tight">
            Cómo querés pagar
          </h1>
        </div>
      </header>

      {/* Resumen */}
      <div className="screen-x mb-5">
        <div className="bg-white rounded-xl border border-[var(--br)] shadow-sm p-4">
          <p className="font-bold text-[15px] text-tx">{data.venueName}</p>
          <p className="text-tx2 text-[13px] capitalize mt-0.5">
            {formatDate(data.date)} · {formatTime(data.timeSlot)} hs · {data.partySize} personas · Mesa {data.tableLabel}
          </p>
          <div className="mt-3 pt-3 border-t border-[var(--br)] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">Total a pagar (seña)</p>
              <p className="text-[11px] text-tx3 mt-0.5">Se descuenta de tu consumo al llegar</p>
            </div>
            <p className="font-display font-bold text-[26px] text-tx tabular-nums">
              ${data.depositAmount.toLocaleString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      {/* Opciones */}
      <div className="screen-x space-y-3">
        <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
          Método de pago
        </p>

        {/* Tarjeta de crédito / débito — checkout con sólo tarjeta */}
        <button
          onClick={() => handlePay('card')}
          disabled={loading}
          className={`w-full bg-white rounded-xl border p-4 flex items-center gap-3
                      active:scale-[0.99] transition-all duration-[180ms] disabled:opacity-50
                      ${selected === 'card' ? 'border-c1 ring-2 ring-c1/20' : 'border-[var(--br)]'}
                      shadow-sm`}
        >
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-c1 to-[#D63646]
                          flex items-center justify-center flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2" />
              <path d="M2 10h20M6 15h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px] text-tx">Tarjeta de crédito o débito</p>
            <p className="text-[12px] text-tx2 mt-0.5">Visa · Mastercard · Amex · Cabal</p>
            <p className="text-[11px] text-tx3 mt-1">Pago seguro procesado por Mercado Pago</p>
          </div>
          {selected === 'card' && loading ? (
            <span className="w-5 h-5 border-2 border-c1/30 border-t-c1 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Mercado Pago — checkout con todos los métodos */}
        <button
          onClick={() => handlePay('mp')}
          disabled={loading}
          className={`w-full bg-white rounded-xl border p-4 flex items-center gap-3
                      active:scale-[0.99] transition-all duration-[180ms] disabled:opacity-50
                      ${selected === 'mp' ? 'border-c4 ring-2 ring-c4/20' : 'border-[var(--br)]'}
                      shadow-sm`}
        >
          <div className="w-12 h-12 rounded-lg bg-[#009EE3] flex items-center justify-center flex-shrink-0">
            <svg width="26" height="20" viewBox="0 0 32 24" fill="white">
              <path d="M16 3c-4.8 0-8.7 2.8-10.3 6.8-.3.7-.4 1.5-.4 2.3 0 2.4 1.3 4.5 3.4 5.7 1.8 1 3.9 1 5.7 0 .5-.3 1-.7 1.5-1.1.5.4 1 .8 1.5 1.1 1.8 1 3.9 1 5.7 0 2.1-1.2 3.4-3.3 3.4-5.7 0-.8-.1-1.6-.4-2.3C24.7 5.8 20.8 3 16 3zm-.7 11.8c-1.1.6-2.4.6-3.5 0-1.3-.7-2.1-2-2.1-3.5 0-.5.1-1 .2-1.4C10.9 7.1 13.2 5.3 16 5.3s5.1 1.8 6.1 4.6c.1.4.2.9.2 1.4 0 1.5-.8 2.8-2.1 3.5-1.1.6-2.4.6-3.5 0-.3-.2-.6-.4-.9-.7l-.4-.4-.4.4c-.2.3-.4.5-.7.7z"/>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[15px] text-tx">Mercado Pago</p>
            <p className="text-[12px] text-tx2 mt-0.5">
              Saldo · Tarjeta · Transferencia
            </p>
            <p className="text-[11px] text-tx3 mt-1">Pagá desde tu cuenta o con efectivo</p>
          </div>
          {selected === 'mp' && loading ? (
            <span className="w-5 h-5 border-2 border-c4/30 border-t-c4 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {error && (
          <div className="bg-c1l border border-c1/20 rounded-lg p-3 mt-4">
            <p className="text-[13px] text-[#D63646] font-semibold">{error}</p>
          </div>
        )}
      </div>

      {/* Seguridad y cancelación */}
      <div className="screen-x mt-6 space-y-3">
        <div className="flex items-start gap-2 bg-sf rounded-lg p-3 border border-[var(--br)]">
          <span className="text-[16px]">🔒</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-tx">Pago seguro</p>
            <p className="text-[11px] text-tx2 mt-0.5 leading-relaxed">
              No guardamos datos de tu tarjeta. El pago se procesa en el entorno encriptado de Mercado Pago.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-sf rounded-lg p-3 border border-[var(--br)]">
          <span className="text-[16px]">🛡️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-tx">Podés cancelar gratis</p>
            <p className="text-[11px] text-tx2 mt-0.5 leading-relaxed">
              Hasta 2hs antes del turno, la seña se devuelve automáticamente.
            </p>
          </div>
        </div>
      </div>

      <p className="screen-x text-center text-tx3 text-[11px] mt-6">
        Al continuar aceptás los términos y condiciones de reserva.
      </p>
    </div>
  )
}
