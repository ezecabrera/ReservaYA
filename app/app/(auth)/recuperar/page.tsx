'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/**
 * Pantalla de recuperación de contraseña.
 * - Pide email
 * - Dispara supabase.auth.resetPasswordForEmail que envía link con token
 * - El link trae al user a /auth/reset-password donde define nueva pw
 *
 * Consumido como /recuperar (dentro del grupo (auth)).
 */
export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/reset-password`,
    })

    if (err) {
      setError(err.message || 'No pudimos enviar el email. Probá de nuevo.')
      setSending(false)
      return
    }
    setSent(true)
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="screen-x pt-12 pb-6">
        <Link
          href="/login"
          aria-label="Volver a iniciar sesión"
          className="inline-flex items-center gap-2 text-tx2 text-[13px] font-semibold"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Link>
      </header>

      <div className="screen-x flex-1 flex flex-col">
        {sent ? (
          <div className="text-center max-w-[320px] mx-auto pt-10">
            <div className="w-20 h-20 rounded-full bg-c2l mx-auto flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="var(--c2)" strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-display text-[24px] text-tx leading-tight">
              Revisá tu email
            </h1>
            <p className="text-tx2 text-[14px] mt-2 leading-relaxed">
              Te mandamos un link de recuperación a <b className="text-tx">{email.trim()}</b>.
              Abrí el email para definir una contraseña nueva.
            </p>
            <p className="text-tx3 text-[12px] mt-6 leading-relaxed">
              ¿No ves el email? Revisá la carpeta de spam.
              Puede tardar un par de minutos en llegar.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block btn-primary"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-[28px] text-tx leading-tight tracking-[-0.3px]">
              Recuperar contraseña
            </h1>
            <p className="text-tx2 text-[14px] mt-2 mb-6 leading-relaxed">
              Ingresá tu email y te enviamos un link para que definas una
              contraseña nueva.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="recuperar-email" className="block text-[13px] font-semibold text-tx2 mb-1.5">
                  Email
                </label>
                <input
                  id="recuperar-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoComplete="email"
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
                disabled={!email.trim() || sending}
                className="btn-primary disabled:opacity-60"
              >
                {sending ? 'Enviando…' : 'Enviar link de recuperación'}
              </button>
            </form>

            <p className="text-tx3 text-[12px] text-center mt-6">
              ¿Te acordaste?{' '}
              <Link href="/login" className="text-c1 font-semibold">
                Iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
