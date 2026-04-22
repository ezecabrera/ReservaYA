'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * Landing del link de email de recuperación.
 * Supabase valida el token automáticamente al cargar la página (vía URL hash
 * / detectSessionInUrl). Si la sesión es válida el user puede setear nueva pw.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase-js detecta el session del URL hash y emite SIGNED_IN/PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true)
      }
    })
    // Fallback: en algunos casos no llega el evento — chequeamos session directo
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message || 'No pudimos guardar la contraseña.')
      setSaving(false)
      return
    }
    setDone(true)
    setSaving(false)
    // Rebota al home después de 2s
    setTimeout(() => router.replace('/'), 2000)
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-c1/20 border-t-c1 rounded-full animate-spin" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-c2l flex items-center justify-center mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="var(--c2)" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-[24px] text-tx">Contraseña actualizada</h1>
        <p className="text-tx2 text-[14px] mt-2 max-w-[280px] leading-relaxed">
          Listo. Te llevamos al inicio…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="screen-x pt-12 pb-6 flex-1 flex flex-col">
        <h1 className="font-display text-[28px] text-tx leading-tight tracking-[-0.3px]">
          Nueva contraseña
        </h1>
        <p className="text-tx2 text-[14px] mt-2 mb-6 leading-relaxed">
          Elegí una contraseña nueva para tu cuenta. Mínimo 6 caracteres.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-pw" className="block text-[13px] font-semibold text-tx2 mb-1.5">
              Contraseña nueva
            </label>
            <input
              id="new-pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full px-4 py-3.5 rounded-xl bg-sf border border-[rgba(0,0,0,0.1)]
                         text-[15px] text-tx placeholder:text-tx3 outline-none
                         focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20 transition-all"
            />
          </div>
          <div>
            <label htmlFor="new-pw-2" className="block text-[13px] font-semibold text-tx2 mb-1.5">
              Repetí la contraseña
            </label>
            <input
              id="new-pw-2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Repetir"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full px-4 py-3.5 rounded-xl bg-sf border border-[rgba(0,0,0,0.1)]
                         text-[15px] text-tx placeholder:text-tx3 outline-none
                         focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20 transition-all"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-c1l px-3 py-2 text-[13px] text-c1 font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>

        <p className="text-tx3 text-[12px] text-center mt-6">
          <Link href="/login" className="text-c1 font-semibold">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
