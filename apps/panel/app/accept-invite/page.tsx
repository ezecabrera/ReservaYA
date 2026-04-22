'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAVY = '#0F3460'

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sf" />}>
      <AcceptInviteInner />
    </Suspense>
  )
}

function AcceptInviteInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Si ya hay sesión, intentamos aceptar directamente
  useEffect(() => {
    if (!token) return
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await acceptInvite()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function acceptInvite() {
    if (!token) return
    setState('loading')
    setError(null)
    const res = await fetch('/api/staff/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string }
    if (!res.ok || !data.ok) {
      setError(data.error ?? 'No pudimos procesar tu invitación')
      setState('error')
      return
    }
    router.replace('/dashboard')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setError(null)

    if (mode === 'register') {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      })
      if (signUpError && !signUpError.message.includes('already registered')) {
        setError(signUpError.message); setState('error'); return
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (signInError) {
      setError('Email o contraseña incorrectos.'); setState('error'); return
    }

    await acceptInvite()
  }

  if (!token) {
    return (
      <EmptyState
        title="Link inválido"
        body="Este link de invitación no tiene token. Pedile al owner que te reenvíe."
      />
    )
  }

  return (
    <div className="min-h-screen bg-sf flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Te sumaron al equipo
          </p>
          <h1 className="font-display text-[32px] text-tx leading-none tracking-tight">
            Bienvenido a <span style={{ color: NAVY }}>Un Toque</span>
          </h1>
        </div>

        <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-6">
          <div className="flex gap-1 bg-sf rounded-md p-1 mb-5">
            <button
              onClick={() => { setMode('register'); setError(null) }}
              className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-colors
                          ${mode === 'register' ? 'bg-white text-tx border border-[rgba(0,0,0,0.08)]' : 'text-tx2'}`}
            >
              Crear cuenta
            </button>
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-colors
                          ${mode === 'login' ? 'bg-white text-tx border border-[rgba(0,0,0,0.08)]' : 'text-tx2'}`}
            >
              Ya tengo cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <Field label="Tu nombre">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Sofía"
                  required
                  className={inputCls}
                />
              </Field>
            )}
            <Field label="Email (el de la invitación)">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                required
                minLength={6}
                className={inputCls}
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-c1l border border-[#D63646]/15 px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="#D63646" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="#D63646" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-[13px] text-[#D63646] font-medium leading-snug">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                         disabled:opacity-60 hover:bg-[#0A2548]
                         transition-colors duration-[160ms]"
            >
              {state === 'loading'
                ? 'Un momento…'
                : mode === 'register' ? 'Crear cuenta y aceptar' : 'Iniciar sesión y aceptar'}
            </button>
          </form>
        </div>

        <p className="text-center text-tx3 text-[11px] mt-5">
          ¿Problemas con el link?{' '}
          <Link href="/join" className="font-semibold" style={{ color: NAVY }}>
            Pegá tu código manualmente
          </Link>
        </p>
      </div>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-sf flex items-center justify-center p-5">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#ABABBA" strokeWidth="2" />
            <path d="M12 8v4M12 16h.01" stroke="#ABABBA" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-[22px] text-tx mb-2">{title}</h1>
        <p className="text-tx2 text-[14px] leading-relaxed mb-6">{body}</p>
        <Link
          href="/"
          className="inline-block px-5 py-3 rounded-md bg-white border border-[rgba(0,0,0,0.12)]
                     text-tx2 font-semibold text-[13px] hover:bg-sf hover:text-tx transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-tx2 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                  px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none
                  focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                  transition-colors duration-[160ms]`
