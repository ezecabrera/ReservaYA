'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const NAVY = '#0F3460'

export default function JoinPage() {
  const router = useRouter()
  const supabase = createClient()

  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setError(null)

    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '')
    if (!normalizedCode.startsWith('UN-TOQUE-')) {
      setError('El código debe empezar con UN-TOQUE-')
      setState('error')
      return
    }

    // 1) Crear cuenta
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    })
    if (signUpError && !signUpError.message.includes('already registered')) {
      setError(signUpError.message); setState('error'); return
    }

    // 2) Sign in (si ya existía, entra; si se creó, también)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (signInError) {
      setError('Email o contraseña incorrectos.'); setState('error'); return
    }

    // 3) Aceptar la invitación con el código
    const res = await fetch('/api/staff/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalizedCode }),
    })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string }
    if (!res.ok || !data.ok) {
      setError(data.error ?? 'No pudimos sumarte al equipo')
      setState('error')
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-sf flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Sumarse al equipo
          </p>
          <h1 className="font-display text-[28px] text-tx leading-none tracking-tight">
            Pegá tu código
          </h1>
          <p className="text-tx2 text-[13px] mt-2">
            El owner te pasó un código por WhatsApp que empieza con <span className="font-mono">UN-TOQUE-</span>
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-6">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Field label="Código de invitación">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="UN-TOQUE-ABC12"
                required
                autoCapitalize="characters"
                autoFocus
                className={`${inputCls} font-mono tabular-nums tracking-wider`}
              />
            </Field>
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
            <Field label="Creá una contraseña">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
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
              {state === 'loading' ? 'Verificando…' : 'Entrar al equipo'}
            </button>
          </form>
        </div>

        <p className="text-center text-tx3 text-[11px] mt-5">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: NAVY }}>
            Iniciá sesión
          </Link>
        </p>
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
