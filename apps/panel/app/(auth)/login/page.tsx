'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'reset' | 'reset-sent'

// ── Paleta profesional ────────────────────────────────────────────────────────
// Primary navy: #0F3460 (estático, sin glow, sin sombra)
// Light surface: bg-sf (#F9FAFB) · Body text: tx (#0D0D0D) · Muted: tx2 (#5A5A6E)

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                  px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none
                  focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                  transition-colors duration-[160ms]`

const btnPrimary = `w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                    disabled:opacity-60 hover:bg-[#0A2548]
                    transition-colors duration-[160ms] flex items-center justify-center gap-2`

const btnSecondary = `w-full py-3 rounded-md bg-sf border border-[rgba(0,0,0,0.08)]
                      text-tx2 font-semibold text-[13px]
                      hover:bg-sf2 hover:text-tx
                      transition-colors duration-[160ms]`

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresá tu email primero.'); return }
    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    })

    setLoading(false)
    if (resetError) {
      setError('No pudimos enviar el mail. Probá de nuevo en un momento.')
      return
    }
    setMode('reset-sent')
  }

  function switchMode(next: Mode) {
    setError(null)
    setMode(next)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-sf">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
            Panel del negocio
          </p>
          <h1 className="font-display text-[34px] leading-none text-tx tracking-tight">
            Un <span className="text-[#0F3460]">Toque</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-6">
          {mode === 'login' && (
            <>
              <div className="mb-5">
                <h2 className="font-display text-[20px] text-tx">Ingresar</h2>
                <p className="text-tx2 text-[13px] mt-1">
                  Gestioná las reservas de tu restaurante
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@restaurante.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className={inputCls}
                  />
                </Field>

                <Field
                  label="Contraseña"
                  right={
                    <button
                      type="button"
                      onClick={() => switchMode('reset')}
                      className="text-[12px] font-semibold text-[#0F3460] hover:underline"
                    >
                      ¿La olvidaste?
                    </button>
                  }
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className={inputCls}
                  />
                </Field>

                {error && <ErrorBox>{error}</ErrorBox>}

                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? <Spinner /> : 'Ingresar'}
                </button>
              </form>
            </>
          )}

          {mode === 'reset' && (
            <>
              <div className="mb-5">
                <h2 className="font-display text-[20px] text-tx">Recuperar contraseña</h2>
                <p className="text-tx2 text-[13px] mt-1">
                  Te enviamos un link al email para crear una nueva.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@restaurante.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className={inputCls}
                  />
                </Field>

                {error && <ErrorBox>{error}</ErrorBox>}

                <button type="submit" disabled={loading} className={btnPrimary}>
                  {loading ? <Spinner /> : 'Enviar link'}
                </button>
                <button type="button" onClick={() => switchMode('login')} className={btnSecondary}>
                  ← Volver al login
                </button>
              </form>
            </>
          )}

          {mode === 'reset-sent' && (
            <div className="text-center py-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-c2l border border-c2/20 flex items-center justify-center mb-4">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M4 7l8 6 8-6M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7M4 7a2 2 0 012-2h12a2 2 0 012 2"
                    stroke="#15A67A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="font-display text-[18px] text-tx">Revisá tu email</h2>
              <p className="text-tx2 text-[13px] mt-2 leading-relaxed">
                Te enviamos el link a <span className="text-tx font-semibold">{email}</span>.
                <br />
                Si no lo ves, mirá en spam.
              </p>
              <button onClick={() => switchMode('login')} className={`${btnSecondary} mt-5`}>
                ← Volver al login
              </button>
            </div>
          )}
        </div>

        {/* CTA registro */}
        <div className="mt-6 text-center">
          <p className="text-tx2 text-[13px]">
            ¿Tu restaurante aún no está?{' '}
            <a href="/onboarding" className="text-[#0F3460] font-semibold hover:underline">
              Registralo gratis →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  right,
  children,
}: {
  label: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[12px] font-semibold text-tx2">
          {label}
        </label>
        {right}
      </div>
      {children}
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-c1l border border-[#D63646]/15 px-3 py-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
        <circle cx="12" cy="12" r="10" stroke="#D63646" strokeWidth="2" />
        <path d="M12 8v4M12 16h.01" stroke="#D63646" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-[13px] text-[#D63646] font-medium leading-snug">{children}</p>
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
