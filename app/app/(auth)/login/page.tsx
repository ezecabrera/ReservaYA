'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type LoginStep = 'phone' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const supabase = createClient()

  function formatPhone(raw: string): string {
    // Normalizar número argentino a E.164: +549XXXXXXXXXX
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('549')) return `+${digits}`
    if (digits.startsWith('54')) return `+${digits}`
    if (digits.startsWith('0')) return `+549${digits.slice(1)}`
    return `+549${digits}`
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Ingresá tu nombre'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
      options: { data: { name: name.trim() } },
    })

    setLoading(false)
    if (error) {
      setError('No se pudo enviar el código. Verificá el número.')
      return
    }
    setStep('otp')
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: otp,
      type: 'sms',
    })

    setLoading(false)
    if (error) {
      setError('Código incorrecto o vencido. Intentá de nuevo.')
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <div className="screen-x pt-12 pb-6">
        {step === 'otp' && (
          <button
            onClick={() => { setStep('phone'); setError(null) }}
            className="mb-4 flex items-center gap-1.5 text-tx2 text-[14px]"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </button>
        )}
        <h1 className="font-display text-[28px] font-bold text-tx tracking-tight">
          {step === 'phone' ? 'Ingresá tu número' : 'Verificá tu número'}
        </h1>
        <p className="text-tx2 text-[14px] mt-1">
          {step === 'phone'
            ? 'Te enviamos un código para confirmar tu reserva.'
            : `Enviamos un código a ${phone}. Ingresalo acá.`}
        </p>
      </div>

      <div className="screen-x flex-1">
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Germán"
                autoComplete="given-name"
                required
                className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
                           px-4 py-3.5 text-[15px] text-tx outline-none
                           focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20
                           transition-all duration-[180ms]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
                Número de celular
              </label>
              <div className="flex items-center gap-2">
                <span className="text-tx2 font-semibold text-[15px] bg-sf border
                                 border-[rgba(0,0,0,0.1)] rounded-md px-3 py-3.5">
                  🇦🇷 +54
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9 11 1234-5678"
                  autoComplete="tel"
                  required
                  className="flex-1 rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
                             px-4 py-3.5 text-[15px] text-tx outline-none
                             focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20
                             transition-all duration-[180ms]"
                />
              </div>
            </div>

            {error && (
              <p className="text-[13px] text-[#D63646] bg-c1l rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2 disabled:opacity-60">
              {loading ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
                Código de verificación
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                autoComplete="one-time-code"
                required
                className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
                           px-4 py-4 text-[24px] font-display font-bold text-center
                           text-tx tracking-[0.2em] outline-none
                           focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20
                           transition-all duration-[180ms]"
              />
              <p className="text-tx3 text-[12px] mt-2 text-center">
                El código llega por SMS en segundos.
              </p>
            </div>

            {error && (
              <p className="text-[13px] text-[#D63646] bg-c1l rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || otp.length < 6}
              className="btn-secondary disabled:opacity-60">
              {loading ? 'Verificando…' : 'Confirmar'}
            </button>

            <button
              type="button"
              onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
              className="w-full text-center text-tx2 text-[13px] py-2"
            >
              ¿No recibiste el código? Reenviar →
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
