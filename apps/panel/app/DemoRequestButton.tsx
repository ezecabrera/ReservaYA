'use client'

import { useState } from 'react'

const NAVY = '#0F3460'

interface Props {
  variant?: 'primary' | 'outline' | 'solid-white'
  label?: string
  source?: string
  className?: string
}

export function DemoRequestButton({
  variant = 'outline',
  label = 'Agendar demo',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)

  const btnClass =
    variant === 'primary'
      ? 'px-6 py-3.5 rounded-md bg-[#0F3460] text-white font-semibold text-[15px] hover:bg-[#0A2548] transition-colors'
      : variant === 'solid-white'
      ? 'px-7 py-4 rounded-md bg-transparent border border-white/30 text-white font-semibold text-[15px] hover:bg-white/10 hover:border-white/50 transition-colors'
      : 'px-6 py-3.5 rounded-md bg-white border border-[rgba(0,0,0,0.12)] text-tx font-semibold text-[15px] hover:border-[#0F3460]/40 hover:text-[#0F3460] transition-colors'

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${btnClass} ${className}`}>
        {label}
      </button>
      {open && <DemoSheet onClose={() => setOpen(false)} />}
    </>
  )
}

function DemoSheet({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [venueName, setVenueName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    if (!email || !email.includes('@')) {
      setErrorMsg('Ingresá un email válido.')
      return
    }
    setState('loading')
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, venueName, phone, message }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setState('error')
        setErrorMsg(data.error ?? 'No pudimos enviar tu solicitud. Probá de nuevo.')
        return
      }
      setState('sent')
    } catch {
      setState('error')
      setErrorMsg('Error de conexión. Probá de nuevo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-tx/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white border border-[rgba(0,0,0,0.08)] shadow-lg max-h-[90vh] overflow-y-auto">
        {state === 'sent' ? (
          <div className="p-8 text-center">
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 border"
              style={{ background: '#EAFDF6', borderColor: '#15A67A33' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#15A67A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-display text-[22px] text-tx leading-none mb-2">¡Listo!</h2>
            <p className="text-tx2 text-[14px] leading-relaxed mb-6">
              Te contactamos en las próximas 24 horas para agendar una demo en vivo.
              Revisá tu bandeja de entrada.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx2 font-semibold text-[13px] hover:bg-sf2 hover:text-tx transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-1">
                  Hablemos
                </p>
                <h2 className="font-display text-[24px] text-tx leading-none">Agendar demo</h2>
                <p className="text-tx2 text-[13px] mt-1.5">
                  15 minutos, video llamada, tu agenda.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx3 hover:text-tx hover:bg-sf2 flex items-center justify-center flex-shrink-0"
                aria-label="Cerrar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <Field label="Email" required>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@restaurante.com"
                autoFocus
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tu nombre">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Martín"
                  className={inputCls}
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+54 11 …"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Nombre del restaurante">
              <input
                type="text"
                value={venueName}
                onChange={e => setVenueName(e.target.value)}
                placeholder="Ej: La Cantina"
                className={inputCls}
              />
            </Field>

            <Field label="Contanos algo (opcional)">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="¿Qué te interesa ver? ¿Cuántas reservas recibís por semana?"
                rows={3}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </Field>

            {errorMsg && (
              <div
                className="flex items-start gap-2 rounded-md px-3 py-2 border"
                style={{ background: '#FFF1F2', borderColor: '#D6364626', color: '#D63646' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-[13px] font-medium leading-snug">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px] disabled:opacity-60 hover:bg-[#0A2548] transition-colors flex items-center justify-center gap-2"
            >
              {state === 'loading' ? (
                <>
                  <Spinner />
                  Enviando…
                </>
              ) : (
                'Solicitar demo'
              )}
            </button>

            <p className="text-center text-tx3 text-[11px] leading-relaxed">
              Al enviar aceptás nuestra{' '}
              <a href="/privacy" className="underline hover:text-tx2" style={{ color: NAVY }}>
                Política de Privacidad
              </a>
              . Sin spam, palabra.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                  px-3.5 py-2.5 text-[14px] text-tx placeholder-tx3 outline-none
                  focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                  transition-colors duration-[160ms]`

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-tx2 mb-1.5">
        {label}
        {required && <span className="text-[#D63646] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 00-9-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
