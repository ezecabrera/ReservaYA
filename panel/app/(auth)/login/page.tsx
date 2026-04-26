'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateTime, setDateTime] = useState<{ date: string; time: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Render fecha/hora solo en client para evitar hydration mismatch
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setDateTime({
        date: now.toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
        time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      })
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-body)',
        padding: 40,
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      {/* Left — brand + welcome */}
      <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--p-lilac)',
              color: '#1A1B1F',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: 18,
              letterSpacing: '-0.04em',
            }}
          >
            u
          </div>
          <div className="fr-900" style={{ fontSize: 28 }}>
            UnToque
          </div>
        </div>

        <div
          className="caps"
          suppressHydrationWarning
          style={{ marginBottom: 16, minHeight: 14 }}
        >
          {dateTime ? `${dateTime.date} · ${dateTime.time}` : ' '}
        </div>

        <h1
          className="fr-900"
          style={{ margin: 0, fontSize: 'clamp(40px, 5vw, 72px)', maxWidth: 520 }}
        >
          Bienvenido,{' '}
          <span className="fr-900-italic" style={{ color: 'var(--p-lilac)' }}>
            hola
          </span>
          .
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-2)',
            marginTop: 12,
            maxWidth: 480,
            lineHeight: 1.55,
          }}
        >
          Panel del negocio. Ingresá con tu email para ver mesas, reservas y campañas.
        </p>
      </div>

      {/* Right — login card */}
      <div
        style={{
          width: 460,
          maxWidth: '100%',
          background: 'var(--bg-2)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className="caps" style={{ marginBottom: 10 }}>
          Ingresá al panel
        </div>
        <h2 className="fr-900" style={{ margin: '0 0 26px', fontSize: 28 }}>
          Tu cuenta
        </h2>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="login-email" className="field-label">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@restaurante.com"
              required
              autoComplete="email"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="field-label">Contraseña</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="field-input"
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--wine-bg)',
                border: '1px solid var(--wine)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--wine-soft)',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              height: 48,
              justifyContent: 'center',
              borderRadius: 'var(--r-pill)',
              fontSize: 14,
              marginTop: 4,
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar →'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 12,
            marginTop: 18,
          }}
        >
          ¿Tu restaurante aún no está?{' '}
          <a
            href="/onboarding"
            style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'none' }}
          >
            Registralo gratis →
          </a>
        </p>
      </div>
    </div>
  )
}
