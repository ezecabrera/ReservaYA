'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * Onboarding primer uso — 3 pantallas.
 * Se muestra sólo si user_metadata.onboarded !== true.
 * Al finalizar setea onboarded=true + preferencias (ocasión, sobrenombre)
 * vía supabase.auth.updateUser.
 *
 * Acceso:
 *  - Tras signup exitoso (desde login)
 *  - Directo vía /onboarding si el user quiere rehacerlo (skip siempre opcional)
 */

type Step = 0 | 1 | 2

const OCCASIONS = [
  { key: 'cita',   label: 'Para cita',       emoji: '💕' },
  { key: 'grupo',  label: 'Grupos grandes',  emoji: '🎉' },
  { key: 'aire',   label: 'Al aire libre',   emoji: '🌿' },
  { key: 'premium',label: 'Cortes premium',  emoji: '🥩' },
  { key: 'casual', label: 'Algo casual',     emoji: '🍕' },
  { key: 'todo',   label: 'Todo un poco',    emoji: '✨' },
]

export default function OnboardingPage() {
  // useSearchParams requiere Suspense boundary (Next 14 build-time CSR bailout)
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <OnboardingInner />
    </Suspense>
  )
}

function OnboardingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'
  const supabase = createClient()
  const [step, setStep] = useState<Step>(0)
  const [nickname, setNickname] = useState('')
  const [occasions, setOccasions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState<string | null>(null)

  // Prefill nickname con el primer nombre si está seteado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const n = (data.user?.user_metadata?.name ?? '') as string
      const first = n.trim().split(/\s+/)[0]
      if (first) setFirstName(first)
      const existing = (data.user?.user_metadata?.nickname ?? '') as string
      if (existing) setNickname(existing)
    })
  }, [supabase])

  function toggleOccasion(key: string) {
    setOccasions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await supabase.auth.updateUser({
        data: {
          onboarded: true,
          nickname: nickname.trim() || undefined,
          preferred_occasions: occasions,
        },
      })
    } catch { /* silencioso — el user no debe trabarse por error de metadata */ }
    router.replace(redirectTo)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress indicator top */}
      <div className="screen-x pt-12 pb-4">
        <div className="flex gap-1 mb-2">
          {[0, 1, 2].map((i) => (
            <div key={i}
                 className={`h-1 flex-1 rounded-full transition-colors duration-300
                            ${i <= step ? 'bg-c1' : 'bg-sf2'}`} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
            Paso {step + 1} de 3
          </p>
          <Link
            href={redirectTo}
            className="text-[12px] text-tx3 font-semibold hover:text-tx2"
          >
            Saltar
          </Link>
        </div>
      </div>

      <div className="screen-x flex-1 flex flex-col pt-4">
        {step === 0 && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[340px] mx-auto">
              <div className="w-24 h-24 rounded-full bg-c1 flex items-center justify-center mb-6
                              shadow-[0_12px_32px_rgba(255,71,87,0.3)]">
                <span className="text-[48px]" aria-hidden>👋</span>
              </div>
              <h1 className="font-display text-[32px] text-tx leading-tight tracking-[-0.4px]">
                {firstName ? `¡Bienvenido, ${firstName}!` : '¡Bienvenido a Un Toque!'}
              </h1>
              <p className="text-tx2 text-[15px] mt-3 leading-relaxed">
                Reservá mesa en los mejores restaurantes de Buenos Aires,
                pagá la seña al toque y listo. Nada de llamar.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="btn-primary mb-4"
            >
              Empezar →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex-1 flex flex-col pt-4">
              <h1 className="font-display text-[26px] text-tx leading-tight tracking-[-0.3px]">
                ¿Cómo preferís que te llamemos?
              </h1>
              <p className="text-tx2 text-[14px] mt-2 leading-relaxed">
                Te saludamos así en el home. Podés cambiarlo cuando quieras
                desde tu perfil.
              </p>

              <div className="mt-5">
                <label htmlFor="onb-nick" className="block text-[13px] font-semibold text-tx2 mb-1.5">
                  Sobrenombre
                </label>
                <input
                  id="onb-nick"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={firstName ?? 'Ger'}
                  autoComplete="nickname"
                  className="w-full px-4 py-3.5 rounded-xl bg-sf border border-[rgba(0,0,0,0.1)]
                             text-[15px] text-tx placeholder:text-tx3 outline-none
                             focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20 transition-all"
                />
                {nickname.trim() && (
                  <p className="text-[12px] text-tx3 mt-2">
                    Te vamos a saludar como <b className="text-tx">{nickname.trim()}</b>.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStep(0)}
                className="btn btn-surface"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn btn-primary"
              >
                Siguiente →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex-1 flex flex-col pt-4">
              <h1 className="font-display text-[26px] text-tx leading-tight tracking-[-0.3px]">
                ¿Qué salidas te gustan?
              </h1>
              <p className="text-tx2 text-[14px] mt-2 leading-relaxed">
                Elegí lo que disfrutás — te priorizamos esos lugares en el home.
                Podés elegir varias o ninguna.
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                {OCCASIONS.map((o) => {
                  const active = occasions.includes(o.key)
                  return (
                    <button
                      key={o.key}
                      onClick={() => toggleOccasion(o.key)}
                      className={`flex flex-col items-center justify-center gap-1.5
                                  rounded-xl py-5 border-2 transition-all
                                  active:scale-[0.97]
                                  ${active
                                    ? 'bg-c1l border-c1 shadow-[0_0_0_3px_rgba(255,71,87,0.12)]'
                                    : 'bg-white border-[var(--br)]'}`}
                    >
                      <span className="text-[28px]" aria-hidden>{o.emoji}</span>
                      <span className={`text-[13px] font-bold
                                        ${active ? 'text-c1' : 'text-tx'}`}>
                        {o.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStep(1)}
                className="btn btn-surface"
                disabled={saving}
              >
                Atrás
              </button>
              <button
                onClick={handleFinish}
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Terminar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
