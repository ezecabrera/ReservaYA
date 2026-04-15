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
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(145deg, #1A1A2E 0%, #16213E 60%, #0F3460 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-[32px] font-black text-white tracking-tight">
            ReservaYa
          </h1>
          <p className="text-white/55 text-[14px] mt-1">Panel del negocio</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="font-display text-[22px] font-bold text-tx mb-5">
            Ingresar
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@restaurante.com"
                required
                className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
                           px-4 py-3 text-[14px] text-tx outline-none
                           focus:border-c4 focus:ring-2 focus:ring-c4/20
                           transition-all duration-[180ms]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-sf
                           px-4 py-3 text-[14px] text-tx outline-none
                           focus:border-c4 focus:ring-2 focus:ring-c4/20
                           transition-all duration-[180ms]"
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#D63646] bg-c1l rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-[13px] mt-6">
          ¿Tu restaurante aún no está?{' '}
          <a href="/onboarding" className="text-c1 font-semibold">
            Registralo gratis →
          </a>
        </p>
      </div>
    </div>
  )
}
