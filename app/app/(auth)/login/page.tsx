'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
  px-4 py-3.5 text-[15px] text-tx outline-none
  focus:border-wine focus:ring-2 focus:ring-[var(--wine)]/20
  transition-all duration-[180ms]`

function LoginContent() {
  const [mode, setMode]     = useState<Mode>('login')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? '/'
  const supabase     = createClient()

  async function ensureProfile() {
    await fetch('/api/auth/ensure-profile', { method: 'POST' })
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Confirmá tu email antes de ingresar.')
      } else {
        setError(error.message)
      }
      return
    }

    await ensureProfile()
    router.push(redirect)
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Ingresá tu nombre'); return }
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('Ese email ya está registrado. Iniciá sesión.')
      } else if (error.message.includes('Password should be') || error.message.includes('at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.')
      } else {
        setError(error.message)
      }
      return
    }

    if (data.session) {
      await ensureProfile()
      router.push(redirect)
      router.refresh()
    } else {
      setEmailSent(true)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-olive/15 border border-olive/30
                        flex items-center justify-center">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="var(--olive)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="font-display text-[22px] font-bold text-tx">Revisá tu email</h2>
        <p className="text-tx2 text-[14px] max-w-[280px]">
          Te enviamos un link de confirmación a <strong>{email}</strong>.
          Hacé clic en él para activar tu cuenta.
        </p>
        <button
          onClick={() => { setEmailSent(false); switchMode('login') }}
          className="mt-2 text-wine font-semibold text-[14px] hover:brightness-110 transition-all"
        >
          Ya confirmé → Iniciar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header */}
      <div className="screen-x pt-12 pb-6">
        <h1 className="font-display text-[28px] font-bold text-tx tracking-tight">
          {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
        </h1>
        <p className="text-tx2 text-[14px] mt-1">
          {mode === 'login'
            ? 'Ingresá para ver tus reservas y hacer nuevas.'
            : 'Registrate para reservar en tus lugares favoritos.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="screen-x mb-6">
        <div className="flex bg-sf rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-[180ms]
              ${mode === 'login'
                ? 'bg-bg text-tx shadow-sm'
                : 'text-tx2 hover:text-tx'}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all duration-[180ms]
              ${mode === 'register'
                ? 'bg-bg text-tx shadow-sm'
                : 'text-tx2 hover:text-tx'}`}
          >
            Crear cuenta
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="screen-x flex-1">
        <form
          onSubmit={mode === 'login' ? handleLogin : handleRegister}
          className="space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
                Tu nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Germán"
                autoComplete="given-name"
                required
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-[13px] text-wine bg-wine/10 border border-wine/25 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 disabled:opacity-60"
          >
            {loading
              ? (mode === 'login' ? 'Ingresando…' : 'Creando cuenta…')
              : (mode === 'login' ? 'Ingresar' : 'Crear cuenta')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
