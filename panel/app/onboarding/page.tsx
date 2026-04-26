'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface TableRow { label: string; capacity: number }
interface ZoneRow  { name: string; prefix: string; tables: TableRow[] }
interface Turn     { opens_at: string; closes_at: string }

interface WizardState {
  email: string
  password: string
  staffName: string
  venueName: string
  venueAddress: string
  venuePhone: string
  venueDesc: string
  days: number[]
  lunch: Turn | null
  dinner: Turn | null
  zones: ZoneRow[]
  depositAmount: number
  cutOffMinutes: number
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const WEEKDAYS = [1, 2, 3, 4, 5]

const INITIAL: WizardState = {
  email: '', password: '', staffName: '',
  venueName: '', venueAddress: '', venuePhone: '', venueDesc: '',
  days: WEEKDAYS,
  lunch:  { opens_at: '12:00', closes_at: '15:30' },
  dinner: { opens_at: '20:00', closes_at: '23:30' },
  zones: [{ name: 'Salón', prefix: 'S', tables: [
    { label: 'S1', capacity: 2 },
    { label: 'S2', capacity: 2 },
    { label: 'S3', capacity: 4 },
    { label: 'S4', capacity: 4 },
  ]}],
  depositAmount: 2000,
  cutOffMinutes: 60,
}

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS: Record<Step, { title: string; sub: string; emoji?: string }> = {
  1: { title: 'Creá tu cuenta', sub: 'Con esto accedés al panel de tu restaurante.' },
  2: { title: 'Tu restaurante', sub: 'Esta info aparece en la app para los clientes.' },
  3: { title: 'Días y turnos', sub: '¿Cuándo atiende tu restaurante?' },
  4: { title: 'Mesas y zonas', sub: 'Configurá el layout. Después podés ajustarlo en el plano visual.' },
  5: { title: 'Seña y reservas', sub: 'El monto que paga el cliente para confirmar.' },
}

// ── Estilos centralizados (tokens del design system, 100% opacos) ────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 14px',
  background: 'var(--surface-3, #2C2D34)',
  border: '1px solid var(--line-2, #2E3036)',
  borderRadius: 12,
  color: 'var(--text, #F4F2EE)',
  fontSize: 14,
  fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
  outline: 'none',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: 'auto',
  padding: '12px 14px',
  resize: 'none' as const,
  fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
  lineHeight: 1.5,
}

// ── Iconos SVG (no emojis) ───────────────────────────────────────────────────

const IconUsers = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconCheck = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconTrash = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const IconArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconArrowLeft = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const IconPlus = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Brand() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--p-lilac, #E4CDED)',
          color: '#1A1B1F',
          display: 'inline-grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display, "Fraunces", serif)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 18,
        }}
        aria-hidden
      >
        u
      </span>
      <span
        className="fr-900"
        style={{
          fontSize: 22,
          letterSpacing: '-0.02em',
          color: 'var(--text)',
        }}
      >
        UnToque
      </span>
    </div>
  )
}

function StepProgress({ step }: { step: Step }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-label={`Paso ${step} de 5`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
        marginBottom: 28,
      }}
    >
      {([1, 2, 3, 4, 5] as Step[]).map((s) => {
        const isDone = s < step
        const isActive = s === step
        return (
          <div
            key={s}
            style={{
              height: 4,
              borderRadius: 99,
              background: isDone
                ? 'var(--wine, #A13143)'
                : isActive
                  ? 'var(--p-lilac, #E4CDED)'
                  : 'var(--line, #23252A)',
              transition: 'background-color 280ms ease',
            }}
          />
        )
      })}
    </div>
  )
}

function StepHeader({ step }: { step: Step }) {
  const meta = STEP_LABELS[step]
  return (
    <div style={{ marginBottom: 24 }}>
      <p
        className="caps"
        style={{
          color: 'var(--text-3, #6D6C68)',
          marginBottom: 8,
        }}
      >
        Paso {step} de 5
      </p>
      <h1
        className="fr-900"
        style={{
          fontSize: 'clamp(28px, 4vw, 36px)',
          letterSpacing: '-0.02em',
          color: 'var(--text)',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {meta.title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-2, #A9A8A2)',
          marginTop: 8,
          lineHeight: 1.6,
          maxWidth: 60 + 'ch',
        }}
      >
        {meta.sub}
      </p>
    </div>
  )
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label
        htmlFor={htmlFor}
        className="caps"
        style={{
          color: 'var(--text-3, #6D6C68)',
          fontSize: 12,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-3, #6D6C68)',
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean
  onChange: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={onChange}
      style={{
        width: 48,
        height: 28,
        borderRadius: 99,
        background: on ? 'var(--wine, #A13143)' : 'var(--surface-3, #2C2D34)',
        border: `1px solid ${on ? 'var(--wine, #A13143)' : 'var(--line-2, #2E3036)'}`,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 200ms ease',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 22 : 2,
          width: 22,
          height: 22,
          borderRadius: 99,
          background: '#F5E9EB',
          transition: 'left 200ms ease',
        }}
      />
    </button>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [s, setS] = useState<WizardState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function update(patch: Partial<WizardState>) {
    setS((prev) => ({ ...prev, ...patch }))
  }

  // ── Paso 1: Crear cuenta ─────────────────────────────────────────────────
  async function handleStep1() {
    if (!s.email || !s.password || !s.staffName) {
      setError('Completá todos los campos.')
      return
    }
    if (s.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email: s.email,
      password: s.password,
    })

    if (signUpError && !signUpError.message.includes('already registered')) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: s.email,
      password: s.password,
    })

    setLoading(false)
    if (signInError || !signInData.session) {
      setError('Revisá tu email y confirmá tu cuenta antes de continuar.')
      return
    }
    setAccessToken(signInData.session.access_token)
    setStep(2)
  }

  // ── Paso 5: Enviar todo ───────────────────────────────────────────────────
  async function handleFinish() {
    if (s.zones.every((z) => z.tables.length === 0)) {
      setError('Agregá al menos una mesa.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token ?? accessToken

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          staffName: s.staffName,
          venue: {
            name: s.venueName,
            address: s.venueAddress,
            phone: s.venuePhone,
            description: s.venueDesc,
          },
          schedule: { days: s.days, lunch: s.lunch, dinner: s.dinner },
          zones: s.zones,
          deposit: { amount: s.depositAmount, cutOffMinutes: s.cutOffMinutes },
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!data.ok) {
        setError(data.error ?? 'Error al guardar.')
        setLoading(false)
        return
      }
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión.')
      setLoading(false)
    }
  }

  function addTable(zoneIdx: number) {
    const zone = s.zones[zoneIdx]
    const next = zone.tables.length + 1
    const label = `${zone.prefix}${next}`
    const newZones = s.zones.map((z, i) =>
      i === zoneIdx
        ? { ...z, tables: [...z.tables, { label, capacity: 2 }] }
        : z,
    )
    update({ zones: newZones })
  }

  function removeTable(zoneIdx: number, tableIdx: number) {
    const newZones = s.zones.map((z, i) =>
      i === zoneIdx
        ? { ...z, tables: z.tables.filter((_, ti) => ti !== tableIdx) }
        : z,
    )
    update({ zones: newZones })
  }

  function updateTable(zoneIdx: number, tableIdx: number, patch: Partial<TableRow>) {
    const newZones = s.zones.map((z, i) =>
      i === zoneIdx
        ? { ...z, tables: z.tables.map((t, ti) => (ti === tableIdx ? { ...t, ...patch } : t)) }
        : z,
    )
    update({ zones: newZones })
  }

  function addZone() {
    const prefixes = ['S', 'T', 'V', 'P', 'B', 'G']
    const used = s.zones.map((z) => z.prefix)
    const prefix = prefixes.find((p) => !used.includes(p)) ?? String.fromCharCode(65 + s.zones.length)
    update({ zones: [...s.zones, { name: `Zona ${s.zones.length + 1}`, prefix, tables: [] }] })
  }

  function toggleDay(day: number) {
    const days = s.days.includes(day) ? s.days.filter((d) => d !== day) : [...s.days, day]
    update({ days })
  }

  // ── Botones primarios y secundarios ──────────────────────────────────────

  const PrimaryButton = ({
    onClick,
    label = 'Continuar',
    disabled = false,
    final = false,
  }: {
    onClick: () => void
    label?: string
    disabled?: boolean
    final?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="btn btn-wine"
      style={{
        width: '100%',
        height: 52,
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        gap: 8,
      }}
    >
      {loading ? 'Un momento…' : (
        <>
          {label}
          {!final && <IconArrowRight size={14} />}
        </>
      )}
    </button>
  )

  const SecondaryButton = ({ onClick, label = 'Volver' }: { onClick: () => void; label?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="btn"
      style={{
        width: '100%',
        height: 44,
        borderRadius: 14,
        fontSize: 14,
        background: 'var(--surface-2, #22232A)',
        color: 'var(--text-2, #A9A8A2)',
        cursor: 'pointer',
        gap: 8,
      }}
    >
      <IconArrowLeft size={14} />
      {label}
    </button>
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #111315)',
        color: 'var(--text, #F4F2EE)',
        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
        paddingBottom: 64,
      }}
    >
      {/* Top brand bar */}
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--line, #23252A)',
          background: 'var(--bg, #111315)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Brand />
        <a
          href="/login"
          style={{
            fontSize: 13,
            color: 'var(--text-2, #A9A8A2)',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: 99,
          }}
        >
          ¿Ya tenés cuenta? <strong style={{ color: 'var(--text)' }}>Iniciar sesión</strong>
        </a>
      </header>

      <main
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: '40px 24px 0',
        }}
      >
        <StepProgress step={step} />
        <StepHeader step={step} />

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--wine-bg, #3A2128)',
              border: '1px solid var(--wine, #A13143)',
              borderRadius: 12,
              padding: '12px 14px',
              color: 'var(--wine-soft, #C36878)',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* ── PASO 1: Cuenta ── */}
        {step === 1 && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Tu nombre" htmlFor="onb-name">
              <input
                id="onb-name"
                name="staffName"
                value={s.staffName}
                onChange={(e) => update({ staffName: e.target.value })}
                placeholder="Ej: Martín García"
                style={inputStyle}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Email" htmlFor="onb-email">
              <input
                id="onb-email"
                name="email"
                type="email"
                value={s.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="tu@email.com"
                style={inputStyle}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Contraseña" hint="Mínimo 6 caracteres." htmlFor="onb-password">
              <input
                id="onb-password"
                name="password"
                type="password"
                value={s.password}
                onChange={(e) => update({ password: e.target.value })}
                placeholder="••••••••"
                style={inputStyle}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </Field>
            <div style={{ marginTop: 12 }}>
              <PrimaryButton onClick={handleStep1} label="Crear cuenta" />
            </div>
          </div>
        )}

        {/* ── PASO 2: Restaurante ── */}
        {step === 2 && (
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Nombre del restaurante">
              <input
                value={s.venueName}
                onChange={(e) => update({ venueName: e.target.value })}
                placeholder="Ej: La Cantina"
                style={inputStyle}
              />
            </Field>
            <Field label="Dirección">
              <input
                value={s.venueAddress}
                onChange={(e) => update({ venueAddress: e.target.value })}
                placeholder="Av. Corrientes 1234, CABA"
                style={inputStyle}
              />
            </Field>
            <Field label="Teléfono · opcional">
              <input
                type="tel"
                value={s.venuePhone}
                onChange={(e) => update({ venuePhone: e.target.value })}
                placeholder="+54 11 4567-8901"
                style={inputStyle}
                autoComplete="tel"
              />
            </Field>
            <Field label="Descripción breve · opcional" hint="Cocina, ambiente, especialidad. Aparece en la ficha pública.">
              <textarea
                value={s.venueDesc}
                onChange={(e) => update({ venueDesc: e.target.value })}
                placeholder="Cocina italiana de barrio, mesas chicas, vino por copa…"
                rows={3}
                style={textareaStyle}
              />
            </Field>
            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              <PrimaryButton
                onClick={() => {
                  if (!s.venueName || !s.venueAddress) {
                    setError('Nombre y dirección son obligatorios.')
                    return
                  }
                  setError(null)
                  setStep(3)
                }}
              />
              <SecondaryButton onClick={() => { setStep(1); setError(null) }} />
            </div>
          </div>
        )}

        {/* ── PASO 3: Horarios ── */}
        {step === 3 && (
          <div style={{ display: 'grid', gap: 18 }}>
            {/* Días */}
            <Field label="Días que abrís">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DAYS_ES.map((d, i) => {
                  const active = s.days.includes(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      aria-pressed={active}
                      aria-label={`${active ? 'Desactivar' : 'Activar'} ${d}`}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 99,
                        fontSize: 13,
                        fontWeight: 700,
                        border: `1px solid ${active ? 'var(--wine, #A13143)' : 'var(--line-2, #2E3036)'}`,
                        background: active ? 'var(--wine, #A13143)' : 'var(--surface-2, #22232A)',
                        color: active ? '#F5E9EB' : 'var(--text-3, #6D6C68)',
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease, border-color 200ms ease',
                        fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Almuerzo */}
            <div className="card" style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="fr-900"
                  style={{ fontSize: 16, color: 'var(--text)' }}
                >
                  Almuerzo
                </span>
                <Toggle
                  on={!!s.lunch}
                  ariaLabel="Activar turno de almuerzo"
                  onChange={() =>
                    update({ lunch: s.lunch ? null : { opens_at: '12:00', closes_at: '15:30' } })
                  }
                />
              </div>
              {s.lunch && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Apertura">
                    <input
                      type="time"
                      value={s.lunch.opens_at}
                      onChange={(e) =>
                        update({ lunch: { ...s.lunch!, opens_at: e.target.value } })
                      }
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </Field>
                  <Field label="Cierre">
                    <input
                      type="time"
                      value={s.lunch.closes_at}
                      onChange={(e) =>
                        update({ lunch: { ...s.lunch!, closes_at: e.target.value } })
                      }
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Cena */}
            <div className="card" style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className="fr-900"
                  style={{ fontSize: 16, color: 'var(--text)' }}
                >
                  Cena
                </span>
                <Toggle
                  on={!!s.dinner}
                  ariaLabel="Activar turno de cena"
                  onChange={() =>
                    update({ dinner: s.dinner ? null : { opens_at: '20:00', closes_at: '23:30' } })
                  }
                />
              </div>
              {s.dinner && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Apertura">
                    <input
                      type="time"
                      value={s.dinner.opens_at}
                      onChange={(e) =>
                        update({ dinner: { ...s.dinner!, opens_at: e.target.value } })
                      }
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </Field>
                  <Field label="Cierre">
                    <input
                      type="time"
                      value={s.dinner.closes_at}
                      onChange={(e) =>
                        update({ dinner: { ...s.dinner!, closes_at: e.target.value } })
                      }
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              <PrimaryButton
                onClick={() => {
                  if (!s.lunch && !s.dinner) {
                    setError('Activá al menos un turno.')
                    return
                  }
                  if (s.days.length === 0) {
                    setError('Seleccioná al menos un día.')
                    return
                  }
                  setError(null)
                  setStep(4)
                }}
              />
              <SecondaryButton onClick={() => { setStep(2); setError(null) }} />
            </div>
          </div>
        )}

        {/* ── PASO 4: Mesas ── */}
        {step === 4 && (
          <div style={{ display: 'grid', gap: 16 }}>
            {s.zones.map((zone, zi) => (
              <div key={zi} className="card" style={{ padding: 16, display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
                  <Field label="Nombre de la zona">
                    <input
                      value={zone.name}
                      onChange={(e) => {
                        const z = [...s.zones]
                        z[zi] = { ...z[zi], name: e.target.value }
                        update({ zones: z })
                      }}
                      placeholder="Salón / Terraza / Privado"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Prefijo">
                    <input
                      value={zone.prefix}
                      maxLength={2}
                      onChange={(e) => {
                        const z = [...s.zones]
                        z[zi] = { ...z[zi], prefix: e.target.value.toUpperCase() }
                        update({ zones: z })
                      }}
                      placeholder="S"
                      style={{ ...inputStyle, textAlign: 'center', fontWeight: 700 }}
                    />
                  </Field>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="caps" style={{ color: 'var(--text-3, #6D6C68)' }}>
                    Mesas · {zone.tables.length}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {zone.tables.map((table, ti) => (
                    <div
                      key={ti}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <input
                        value={table.label}
                        onChange={(e) => updateTable(zi, ti, { label: e.target.value })}
                        aria-label={`Etiqueta mesa ${ti + 1}`}
                        style={{
                          ...inputStyle,
                          width: 64,
                          height: 44,
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      />
                      <div
                        role="radiogroup"
                        aria-label={`Capacidad mesa ${table.label}`}
                        style={{ display: 'flex', gap: 6, flex: 1 }}
                      >
                        {[2, 4, 6, 8].map((cap) => {
                          const active = table.capacity === cap
                          return (
                            <button
                              key={cap}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => updateTable(zi, ti, { capacity: cap })}
                              style={{
                                flex: 1,
                                height: 44,
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 700,
                                border: `1px solid ${active ? 'var(--wine, #A13143)' : 'var(--line-2, #2E3036)'}`,
                                background: active ? 'var(--wine, #A13143)' : 'var(--surface-3, #2C2D34)',
                                color: active ? '#F5E9EB' : 'var(--text-2, #A9A8A2)',
                                cursor: 'pointer',
                                transition: 'background-color 200ms ease, border-color 200ms ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                fontFamily: 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
                              }}
                            >
                              {cap}
                              <IconUsers size={12} />
                            </button>
                          )
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTable(zi, ti)}
                        aria-label={`Eliminar mesa ${table.label}`}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 10,
                          background: 'var(--wine-bg, #3A2128)',
                          border: '1px solid var(--wine, #A13143)',
                          color: 'var(--wine-soft, #C36878)',
                          display: 'inline-grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'background-color 200ms ease',
                        }}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addTable(zi)}
                  className="btn"
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 12,
                    fontSize: 13,
                    background: 'transparent',
                    border: '1px dashed var(--line-3, #3B3E45)',
                    color: 'var(--text-2, #A9A8A2)',
                    cursor: 'pointer',
                    gap: 8,
                  }}
                >
                  <IconPlus size={14} />
                  Agregar mesa
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addZone}
              className="btn"
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                background: 'transparent',
                border: '1px dashed var(--wine, #A13143)',
                color: 'var(--wine-soft, #C36878)',
                cursor: 'pointer',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <IconPlus size={14} />
              Agregar zona · terraza, privado, barra…
            </button>

            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              <PrimaryButton
                onClick={() => {
                  const totalTables = s.zones.reduce((sum, z) => sum + z.tables.length, 0)
                  if (totalTables === 0) {
                    setError('Agregá al menos una mesa.')
                    return
                  }
                  setError(null)
                  setStep(5)
                }}
              />
              <SecondaryButton onClick={() => { setStep(3); setError(null) }} />
            </div>
          </div>
        )}

        {/* ── PASO 5: Seña + Resumen ── */}
        {step === 5 && (
          <div style={{ display: 'grid', gap: 18 }}>
            <Field
              label="Monto de la seña · ARS"
              hint="Se descuenta del consumo cuando llega el cliente. Se cobra vía Mercado Pago."
            >
              <input
                type="number"
                value={s.depositAmount}
                onChange={(e) => update({ depositAmount: Number(e.target.value) })}
                style={{
                  ...inputStyle,
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontWeight: 600,
                  fontSize: 16,
                }}
                min={0}
                step={500}
              />
            </Field>

            <Field
              label="Cierre de reservas online · minutos antes del turno"
              hint="Recomendado 60 minutos. Da margen para preparar la mesa."
            >
              <div role="radiogroup" style={{ display: 'flex', gap: 8 }}>
                {[30, 60, 90, 120].map((min) => {
                  const active = s.cutOffMinutes === min
                  return (
                    <button
                      key={min}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update({ cutOffMinutes: min })}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        border: `1px solid ${active ? 'var(--wine, #A13143)' : 'var(--line-2, #2E3036)'}`,
                        background: active ? 'var(--wine, #A13143)' : 'var(--surface-2, #22232A)',
                        color: active ? '#F5E9EB' : 'var(--text-2, #A9A8A2)',
                        cursor: 'pointer',
                        transition: 'background-color 200ms ease, border-color 200ms ease',
                        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                      }}
                    >
                      {min}m
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Resumen */}
            <div
              style={{
                padding: 18,
                background: 'var(--p-lilac, #E4CDED)',
                borderRadius: 14,
                color: '#1A1B1F',
                display: 'grid',
                gap: 12,
              }}
            >
              <p
                className="caps"
                style={{
                  color: 'rgba(26,27,31,0.6)',
                  margin: 0,
                }}
              >
                Resumen
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                <SummaryRow label="Restaurante" value={s.venueName || '—'} />
                <SummaryRow
                  label="Mesas"
                  value={`${s.zones.reduce((sum, z) => sum + z.tables.length, 0)} en ${s.zones.length} zona${s.zones.length !== 1 ? 's' : ''}`}
                />
                <SummaryRow
                  label="Turnos"
                  value={
                    [s.lunch && 'almuerzo', s.dinner && 'cena']
                      .filter(Boolean)
                      .join(' + ') || '—'
                  }
                />
                <SummaryRow
                  label="Días"
                  value={`${s.days.length} día${s.days.length !== 1 ? 's' : ''} por semana`}
                />
                <SummaryRow
                  label="Seña"
                  value={`$${s.depositAmount.toLocaleString('es-AR')}`}
                  mono
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
              <PrimaryButton
                onClick={handleFinish}
                label="Empezar a recibir reservas"
                final
              />
              <SecondaryButton onClick={() => { setStep(4); setError(null) }} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 14,
        fontSize: 14,
      }}
    >
      <span style={{ color: 'rgba(26,27,31,0.6)' }}>{label}</span>
      <span
        style={{
          color: '#1A1B1F',
          fontWeight: 700,
          fontFamily: mono
            ? 'var(--font-mono, "JetBrains Mono", monospace)'
            : 'var(--font-body, "Plus Jakarta Sans", sans-serif)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}
