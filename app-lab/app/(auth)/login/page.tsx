'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
  px-4 py-3.5 text-[15px] text-tx outline-none
  focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20
  transition-all duration-[180ms]`

function LoginContent() {
  const [mode, setMode]     = useState<Mode>('login')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? '/'
  const oauthError   = searchParams.get('error')
  const supabase     = createClient()

  async function ensureProfile() {
    await fetch('/api/auth/ensure-profile', { method: 'POST' })
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError(null)
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('redirect', redirect)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })
    if (error) {
      setGoogleLoading(false)
      setError(error.message)
    }
    // Si no hay error, el browser está redirigiendo a Google — no resetear loading
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Ingresá tu email primero y te mandamos el link de recuperación.')
      return
    }
    setError(null)
    const redirectUrl = new URL('/auth/callback', window.location.origin).toString()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    })
    if (error) {
      setError(error.message)
      return
    }
    setEmailSent(true)
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
        <div className="w-16 h-16 rounded-full bg-c2/15 flex items-center justify-center">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="var(--c2)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="font-display text-[22px] font-bold text-tx">Revisá tu email</h2>
        <p className="text-tx2 text-[14px] max-w-[280px]">
          Te enviamos un link de confirmación a <strong>{email}</strong>.
          Hacé clic en él para activar tu cuenta.
        </p>
        <button
          onClick={() => { setEmailSent(false); switchMode('login') }}
          className="mt-2 text-c4 font-semibold text-[14px]"
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

      {/* Google OAuth */}
      <div className="screen-x mb-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-white border
                     border-[rgba(0,0,0,0.12)] text-tx font-semibold text-[14px]
                     py-3.5 rounded-md shadow-sm active:scale-[0.98]
                     transition-transform duration-[180ms] disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.183l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.164 6.656 3.58 9 3.58z"/>
          </svg>
          {googleLoading ? 'Redirigiendo a Google…' : 'Continuar con Google'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-5 mb-1">
          <div className="flex-1 h-px bg-[var(--br)]" />
          <span className="text-[11px] text-tx3 font-semibold uppercase tracking-wider">
            O con email
          </span>
          <div className="flex-1 h-px bg-[var(--br)]" />
        </div>
      </div>

      {/* OAuth error */}
      {oauthError && !error && (
        <div className="screen-x mb-3">
          <p className="text-[13px] text-[#D63646] bg-c1l rounded-lg px-3 py-2">
            {oauthError}
          </p>
        </div>
      )}

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
            <p className="text-[13px] text-[#D63646] bg-c1l rounded-lg px-3 py-2">
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

          {mode === 'login' && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="block w-full text-center text-tx2 text-[13px] font-semibold
                         py-2 underline underline-offset-2"
            >
              Olvidé mi contraseña
            </button>
          )}
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
