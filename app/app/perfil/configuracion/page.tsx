'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProfileConfig {
  name: string
  surname: string
  nickname: string
  email: string
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const [data, setData] = useState<ProfileConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // form
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    fetch('/api/perfil')
      .then(r => {
        if (r.status === 401) { router.replace('/login?redirect=/perfil/configuracion'); return null }
        return r.json()
      })
      .then((d: ProfileConfig | null) => {
        if (!d) return
        setData(d)
        setName(d.name)
        setSurname(d.surname)
        setNickname(d.nickname)
      })
      .finally(() => setLoading(false))
  }, [router])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          surname: surname.trim(),
          nickname: nickname.trim(),
        }),
      })
      if (!res.ok) throw new Error('No se pudo guardar')
      setToast('Cambios guardados ✓')
      setTimeout(() => setToast(null), 2200)
    } catch {
      setToast('No pudimos guardar. Probá de nuevo.')
      setTimeout(() => setToast(null), 2500)
    } finally {
      setSaving(false)
    }
  }

  const dirty =
    data !== null &&
    (name !== data.name || surname !== data.surname || nickname !== data.nickname)

  return (
    <div className="min-h-screen bg-bg pb-28">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80]
                        bg-tx text-white px-4 py-2.5 rounded-full shadow-lg
                        text-[13px] font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="screen-x pt-14 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            aria-label="Volver al perfil"
            className="w-10 h-10 rounded-full bg-sf flex items-center justify-center
                       border border-[var(--br)] active:scale-95 transition-transform"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-tx3 text-[11px] font-bold uppercase tracking-wider">
              Perfil
            </p>
            <h1 className="font-display text-[24px] font-bold text-tx leading-none">
              Configuración
            </h1>
          </div>
        </div>
      </header>

      <div className="screen-x space-y-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-14 skeleton rounded-xl" />
            <div className="h-14 skeleton rounded-xl" />
            <div className="h-14 skeleton rounded-xl" />
          </div>
        ) : data ? (
          <>
            {/* Card datos personales */}
            <div className="card p-4 space-y-4">
              <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
                Datos personales
              </p>

              <Field
                label="Nombre"
                value={name}
                onChange={setName}
                placeholder="Germán"
                autoComplete="given-name"
              />
              <Field
                label="Apellido"
                value={surname}
                onChange={setSurname}
                placeholder="García"
                autoComplete="family-name"
              />
              <Field
                label="Sobrenombre"
                hint="Cómo te saluda la app (opcional)"
                value={nickname}
                onChange={setNickname}
                placeholder="Ger"
                autoComplete="nickname"
              />
            </div>

            {/* Card cuenta */}
            <div className="card p-4 space-y-2">
              <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider">
                Cuenta
              </p>
              <div className="flex items-center justify-between py-1">
                <span className="text-[13px] text-tx2">Email</span>
                <span className="text-[13px] font-semibold text-tx truncate max-w-[60%]">
                  {data.email}
                </span>
              </div>
              <p className="text-[11.5px] text-tx3">
                El email no se puede cambiar desde acá por seguridad.
              </p>
            </div>

            {/* CTA Guardar */}
            <button
              onClick={handleSave}
              disabled={!dirty || saving || !name.trim()}
              className="w-full py-4 rounded-full bg-c1 text-white font-bold text-[15px]
                         shadow-[0_8px_24px_rgba(255,71,87,0.28)]
                         active:scale-[0.98] transition-transform duration-[180ms]
                         disabled:opacity-40 disabled:shadow-none"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>

            {nickname.trim() && (
              <p className="text-center text-[12px] text-tx3">
                La app te va a saludar como <b className="text-tx">{nickname.trim()}</b>.
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, hint, autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-tx">{label}</span>
      {hint && <span className="block text-[11.5px] text-tx3 mt-0.5">{hint}</span>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-sf border border-[var(--br)]
                   text-[15px] text-tx placeholder:text-tx3 outline-none
                   focus:border-c1/40 focus:ring-2 focus:ring-c1/15 transition-all"
      />
    </label>
  )
}
