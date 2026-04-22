'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'

interface BillingData {
  status: string
  trialEndsAt: string | null
  trialDaysLeft: number
  currentPeriodEnd: string | null
  planAmount: number
  mpPreapprovalId: string | null
  isOwner: boolean
}

type Tone = 'pending' | 'active' | 'warn' | 'error'

const STATUS_INFO: Record<string, { label: string; tone: Tone; desc: string }> = {
  no_subscription: { label: 'Sin suscripción', tone: 'pending', desc: 'Activá tu suscripción para empezar a recibir reservas' },
  trial:           { label: 'Prueba gratuita', tone: 'warn',    desc: 'Acceso completo durante el período de prueba' },
  active:          { label: 'Activa',          tone: 'active',  desc: 'Suscripción activa — gracias por confiar en Un Toque' },
  paused:          { label: 'Pausada',         tone: 'warn',    desc: 'La suscripción está pausada. Reactivá para seguir recibiendo reservas' },
  cancelled:       { label: 'Cancelada',       tone: 'error',   desc: 'La suscripción fue cancelada' },
  expired:         { label: 'Vencida',         tone: 'error',   desc: 'El período de prueba venció' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Estilos base ─────────────────────────────────────────────────────────────

const btnPrimary = `w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                    disabled:opacity-60 hover:bg-[#0A2548]
                    transition-colors duration-[160ms] flex items-center justify-center gap-2`

const btnSecondary = `w-full py-3 rounded-md bg-sf border border-[rgba(0,0,0,0.08)]
                      text-tx2 font-semibold text-[13px]
                      hover:bg-sf2 hover:text-tx
                      transition-colors duration-[160ms]`

const PLAN_FEATURES = [
  'Reservas ilimitadas',
  'Panel en tiempo real',
  'QR de check-in',
  'Menú anticipado y pre-pedidos',
  'Analytics de ocupación y no-shows',
  'Modo grupo para clientes',
]

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sf" />}>
      <BillingInner />
    </Suspense>
  )
}

function BillingInner() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const searchParams = useSearchParams()
  const justSubscribed = searchParams.get('subscribed') === 'true'
  const previewState = searchParams.get('preview')

  useEffect(() => {
    // Dev preview: render con mock data para ver cada estado sin sesión real
    if (process.env.NODE_ENV !== 'production' && previewState) {
      setData(mockFor(previewState))
      setLoading(false)
      return
    }
    fetch('/api/billing')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [previewState])

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

  const info = data ? (STATUS_INFO[data.status] ?? STATUS_INFO.no_subscription) : null
  const needsSubscribe = data?.isOwner && ['no_subscription', 'trial', 'expired', 'cancelled'].includes(data.status)

  return (
    <div className="min-h-screen bg-sf pb-14">
      <PageHeader
        title="Tu plan"
        subtitle="Gestión de tu suscripción en Un Toque"
        venueName={previewState ? 'La Cantina de Martín' : undefined}
      />
      <div className="max-w-md mx-auto px-5 pt-6">

        {loading ? (
          <div className="space-y-3">
            <div className="h-32 bg-white rounded-lg border border-[rgba(0,0,0,0.07)] animate-pulse" />
            <div className="h-56 bg-white rounded-lg border border-[rgba(0,0,0,0.07)] animate-pulse" />
          </div>
        ) : !data ? (
          <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-6 text-center">
            <p className="text-tx2 text-[14px]">No pudimos cargar los datos.</p>
            <button
              onClick={() => window.location.reload()}
              className={`${btnSecondary} mt-4`}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Banner post-suscripción */}
            {justSubscribed && data.status === 'active' && (
              <SuccessBanner message="¡Suscripción activada! Ya podés recibir reservas." />
            )}

            {/* Info: venue pendiente (post-onboarding antes del pago) */}
            {data.status === 'no_subscription' && data.isOwner && (
              <InfoBanner
                tone="pending"
                title="Tu restaurante está pendiente de activación"
                body="Ya creamos tu cuenta y configuramos tus mesas. El último paso es activar la suscripción mensual para que tu local aparezca en Un Toque y puedas recibir reservas."
              />
            )}

            {/* Estado actual */}
            <StatusCard data={data} info={info!} />

            {/* Plan */}
            <PlanCard amount={data.planAmount} />

            {/* CTA según estado */}
            {needsSubscribe && (
              <div className="space-y-2">
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className={btnPrimary}
                >
                  {subscribing
                    ? <><Spinner /> Redirigiendo a Mercado Pago…</>
                    : data.status === 'no_subscription'
                      ? 'Activar mi restaurante'
                      : 'Activar suscripción'}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-tx3 text-[11px]">
                  <LockIcon />
                  Pago seguro vía Mercado Pago · Cancelás cuando quieras
                </div>
              </div>
            )}

            {data.status === 'paused' && data.isOwner && (
              <button onClick={handleSubscribe} className={btnPrimary}>
                {subscribing ? <><Spinner /> Redirigiendo…</> : 'Reactivar suscripción'}
              </button>
            )}

            {data.status === 'active' && (
              <p className="text-center text-tx3 text-[12px] pt-1">
                Para cancelar o modificar, accedé a tu cuenta de Mercado Pago.
              </p>
            )}

          </div>
        )}

      </div>
    </div>
  )
}

// ── Componentes ──────────────────────────────────────────────────────────────

function StatusCard({ data, info }: { data: BillingData; info: { label: string; tone: Tone; desc: string } }) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Estado
          </p>
          <div className="flex items-center gap-2">
            <Dot tone={info.tone} />
            <p className="font-sans-black text-[20px] text-tx leading-none">
              {info.label}
            </p>
          </div>
          <p className="text-tx2 text-[12px] mt-2 leading-relaxed">{info.desc}</p>
        </div>
      </div>

      {/* Trial: días restantes */}
      {data.status === 'trial' && data.trialEndsAt && (
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-tx2 text-[12px]">Prueba gratuita</span>
            <span className="text-tx font-semibold text-[13px] tabular-nums">
              {data.trialDaysLeft} día{data.trialDaysLeft !== 1 ? 's' : ''} restantes
            </span>
          </div>
          <div className="w-full h-1.5 bg-sf2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0F3460] transition-all duration-700"
              style={{ width: `${Math.min((data.trialDaysLeft / 30) * 100, 100)}%` }}
            />
          </div>
          <p className="text-tx3 text-[11px] mt-2">
            Vence el {formatDate(data.trialEndsAt)}
          </p>
        </div>
      )}

      {/* Activa: próximo cobro */}
      {data.status === 'active' && data.currentPeriodEnd && (
        <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.06)]
                        flex items-center justify-between">
          <span className="text-tx2 text-[13px]">Próximo cobro</span>
          <span className="text-tx font-semibold text-[13px] tabular-nums">
            {formatDate(data.currentPeriodEnd)}
          </span>
        </div>
      )}
    </div>
  )
}

function PlanCard({ amount }: { amount: number }) {
  return (
    <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-5">
      <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-3">
        Plan mensual
      </p>
      <div className="flex items-end gap-1 mb-5">
        <span className="font-sans-black text-[42px] text-tx leading-none tabular-nums">
          ${amount.toLocaleString('es-AR')}
        </span>
        <span className="text-tx2 text-[14px] mb-1.5">/mes</span>
      </div>
      <div className="space-y-2.5">
        {PLAN_FEATURES.map(f => (
          <div key={f} className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-c2l flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#15A67A"
                  strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-tx text-[13px]">{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="bg-c2l border border-c2/25 rounded-md p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-[#15A67A] flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-[#0E6B4F] font-semibold text-[13px]">{message}</p>
    </div>
  )
}

function InfoBanner({
  tone,
  title,
  body,
}: {
  tone: Tone
  title: string
  body: string
}) {
  const styles: Record<Tone, { bg: string; border: string; accent: string; icon: string }> = {
    pending: { bg: 'bg-[#0F3460]/[0.04]', border: 'border-[#0F3460]/15', accent: 'bg-[#0F3460]', icon: '#0F3460' },
    warn:    { bg: 'bg-c3l',               border: 'border-c3/25',        accent: 'bg-c3',       icon: '#CC7700' },
    active:  { bg: 'bg-c2l',               border: 'border-c2/25',        accent: 'bg-[#15A67A]', icon: '#15A67A' },
    error:   { bg: 'bg-c1l',               border: 'border-[#D63646]/15', accent: 'bg-[#D63646]', icon: '#D63646' },
  }
  const st = styles[tone]
  return (
    <div className={`rounded-md border p-4 ${st.bg} ${st.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full ${st.accent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <p className="text-tx font-semibold text-[14px] mb-1">{title}</p>
          <p className="text-tx2 text-[13px] leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  )
}

function Dot({ tone }: { tone: Tone }) {
  const colorMap: Record<Tone, string> = {
    pending: 'bg-[#0F3460]',
    warn:    'bg-c3',
    active:  'bg-[#15A67A]',
    error:   'bg-[#D63646]',
  }
  return (
    <span className="relative flex w-2.5 h-2.5">
      {(tone === 'active' || tone === 'pending') && (
        <span className={`absolute inline-flex w-full h-full rounded-full opacity-40 animate-ping ${colorMap[tone]}`} />
      )}
      <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${colorMap[tone]}`} />
    </span>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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

// ── Dev preview mock ─────────────────────────────────────────────────────────

function mockFor(state: string): BillingData {
  const now = Date.now()
  const base: BillingData = {
    status: state,
    trialEndsAt: null,
    trialDaysLeft: 0,
    currentPeriodEnd: null,
    planAmount: 30000,
    mpPreapprovalId: null,
    isOwner: true,
  }
  if (state === 'trial') {
    return { ...base, trialEndsAt: new Date(now + 12 * 86400000).toISOString(), trialDaysLeft: 12 }
  }
  if (state === 'active') {
    return { ...base, currentPeriodEnd: new Date(now + 26 * 86400000).toISOString(), mpPreapprovalId: 'mock-12345' }
  }
  return base // no_subscription / expired / paused / cancelled
}
