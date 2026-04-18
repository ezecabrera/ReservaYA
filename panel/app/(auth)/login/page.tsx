'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-ink relative overflow-hidden">
      {/* Accent radial — wine top-left, olive bottom-right. Da identidad sin ruido. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 0% 0%, rgba(161,49,67,0.22) 0%, transparent 60%),' +
            'radial-gradient(55% 45% at 100% 100%, rgba(79,138,95,0.14) 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-[34px] font-bold text-ink-text tracking-tight">
            Reserva<span className="text-wine-soft">Ya</span>
          </h1>
          <p className="text-ink-text-3 text-[13px] mt-1 uppercase tracking-[0.14em] font-semibold">
            Panel del negocio
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-ink-2 border border-ink-line rounded-2xl p-6
                        shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55)]">
          <h2 className="font-display text-[22px] font-bold text-ink-text mb-5">
            Ingresar
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-ink-text-3 uppercase tracking-[0.1em] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@restaurante.com"
                required
                className="w-full rounded-xl bg-ink border border-ink-line-2
                           px-4 py-3 text-[14px] text-ink-text placeholder-ink-text-3 outline-none
                           focus:border-wine/50 focus:ring-2 focus:ring-wine/20
                           transition-all duration-[180ms]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-text-3 uppercase tracking-[0.1em] mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl bg-ink border border-ink-line-2
                           px-4 py-3 text-[14px] text-ink-text placeholder-ink-text-3 outline-none
                           focus:border-wine/50 focus:ring-2 focus:ring-wine/20
                           transition-all duration-[180ms]"
              />
            </div>

            {error && (
              <p className="text-[13px] text-wine-soft bg-wine/15 border border-wine/30
                            rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-wine text-white font-bold text-[15px]
                         shadow-[0_8px_24px_-6px_rgba(161,49,67,0.55)]
                         disabled:opacity-60
                         hover:brightness-110 active:scale-[0.97]
                         transition-all duration-[180ms]"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-ink-text-3 text-[12.5px] mt-6">
          ¿Tu restaurante aún no está?{' '}
          <a href="/onboarding" className="text-wine-soft font-semibold
                                           hover:brightness-110 transition-all">
            Registralo gratis →
          </a>
        </p>
      </div>
    </div>
  )
}
