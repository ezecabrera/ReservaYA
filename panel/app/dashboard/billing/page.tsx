'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PanelNav } from '@/components/nav/PanelNav'

interface BillingData {
  status: string
  trialEndsAt: string | null
  trialDaysLeft: number
  currentPeriodEnd: string | null
  planAmount: number
  mpPreapprovalId: string | null
  isOwner: boolean
}

const STATUS_INFO: Record<string, { label: string; color: string; desc: string }> = {
  trial:     { label: 'Prueba gratuita', color: 'text-c3',  desc: 'Acceso completo durante el período de prueba' },
  active:    { label: 'Activa',          color: 'text-c2',  desc: 'Suscripción activa — gracias por confiar en ReservaYA' },
  paused:    { label: 'Pausada',         color: 'text-c3',  desc: 'La suscripción está pausada. Reactivá para seguir recibiendo reservas' },
  cancelled: { label: 'Cancelada',       color: 'text-c1',  desc: 'La suscripción fue cancelada' },
  expired:   { label: 'Vencida',         color: 'text-c1',  desc: 'El período de prueba venció' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const searchParams = useSearchParams()
  const justSubscribed = searchParams.get('subscribed') === 'true'

  useEffect(() => {
    fetch('/api/billing')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubscribe() {
    setSubscribing(true)
    try {
      const res = await fetch('/api/billing/subscribe', { method: 'POST' })
      const json = await res.json() as { init_point?: string; error?: string }
      if (json.init_point) {
        window.location.href = json.init_point
      }
    } finally {
      setSubscribing(false)
    }
  }

  const info = data ? (STATUS_INFO[data.status] ?? STATUS_INFO.trial) : null

  return (
    <div className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)' }}>

      <div className="px-5 pt-12 pb-6">
        <h1 className="font-display text-[24px] font-bold text-white tracking-tight">Plan</h1>
        <p className="text-white/55 text-[13px] mt-0.5">Gestión de tu suscripción</p>
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-center text-white/40 mt-20">Error cargando datos</p>
      ) : (
        <div className="px-5 space-y-4">

          {/* Banner de éxito post-suscripción */}
          {justSubscribed && data.status === 'active' && (
            <div className="bg-c2/15 border border-c2/30 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-c2 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-white font-semibold text-[14px]">
                ¡Suscripción activada! Bienvenido al plan mensual.
              </p>
            </div>
          )}

          {/* Estado actual */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-1">Estado</p>
                <p className={`font-display text-[22px] font-bold ${info?.color ?? 'text-white'}`}>
                  {info?.label}
                </p>
                <p className="text-white/40 text-[12px] mt-0.5">{info?.desc}</p>
              </div>
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                data.status === 'active' ? 'bg-c2 animate-pulse' :
                data.status === 'trial' ? 'bg-c3 animate-pulse' : 'bg-c1'
              }`} />
            </div>

            {/* Trial: días restantes */}
            {data.status === 'trial' && data.trialEndsAt && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/45 text-[12px]">Prueba gratuita</span>
                  <span className="text-white font-bold text-[13px]">
                    {data.trialDaysLeft} día{data.trialDaysLeft !== 1 ? 's' : ''} restantes
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-c3 transition-all duration-700"
                    style={{ width: `${Math.min((data.trialDaysLeft / 30) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-white/30 text-[11px] mt-1.5">
                  Vence el {formatDate(data.trialEndsAt)}
                </p>
              </div>
            )}

            {/* Activa: próximo cobro */}
            {data.status === 'active' && data.currentPeriodEnd && (
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-white/45 text-[13px]">Próximo cobro</span>
                <span className="text-white font-semibold text-[13px]">
                  {formatDate(data.currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>

          {/* Plan */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider mb-3">
              Plan mensual
            </p>
            <div className="flex items-end gap-1">
              <span className="font-display text-[38px] font-bold text-white leading-none">
                ${data.planAmount.toLocaleString('es-AR')}
              </span>
              <span className="text-white/40 text-[14px] mb-1.5">/mes</span>
            </div>
            <div className="mt-3 space-y-2">
              {[
                'Reservas ilimitadas',
                'Panel en tiempo real',
                'QR de check-in',
                'Menú anticipado y pre-pedidos',
                'Analytics de ocupación y no-shows',
                'Modo grupo para clientes',
              ].map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="var(--c2)"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-white/60 text-[13px]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA según estado */}
          {data.isOwner && (data.status === 'trial' || data.status === 'expired') && (
            <div className="space-y-2">
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full py-4 rounded-xl bg-c1 text-white font-bold text-[15px]
                           shadow-[0_4px_20px_rgba(255,71,87,0.3)] disabled:opacity-50
                           active:scale-[0.97] transition-all duration-[180ms]"
              >
                {subscribing ? 'Redirigiendo a Mercado Pago…' : 'Activar suscripción →'}
              </button>
              <p className="text-center text-white/30 text-[11px]">
                Pago seguro vía Mercado Pago · Cancelás cuando quieras
              </p>
            </div>
          )}

          {data.status === 'paused' && data.isOwner && (
            <button
              onClick={handleSubscribe}
              className="w-full py-4 rounded-xl bg-c3 text-white font-bold text-[15px]
                         active:scale-[0.97] transition-transform"
            >
              Reactivar suscripción →
            </button>
          )}

          {data.status === 'active' && (
            <p className="text-center text-white/25 text-[12px]">
              Para cancelar o modificar, accedé a tu cuenta de Mercado Pago.
            </p>
          )}

        </div>
      )}

      <PanelNav />
    </div>
  )
}
