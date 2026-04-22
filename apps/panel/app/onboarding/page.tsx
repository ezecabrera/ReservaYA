'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const STEP_TITLES = ['Tu cuenta', 'Tu local', 'Horarios', 'Mesas', 'Seña']

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

// ── Estilos ──────────────────────────────────────────────────────────────────

const inputCls = `w-full rounded-md border border-[rgba(0,0,0,0.1)] bg-white
                  px-4 py-3 text-[14px] text-tx placeholder-tx3 outline-none
                  focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                  transition-colors duration-[160ms]`

const btnPrimaryCls = `w-full py-3 rounded-md bg-[#0F3460] text-white font-semibold text-[14px]
                       disabled:opacity-60 hover:bg-[#0A2548]
                       transition-colors duration-[160ms] flex items-center justify-center gap-2`

const btnSecondaryCls = `w-full py-3 rounded-md bg-sf border border-[rgba(0,0,0,0.08)]
                         text-tx2 font-semibold text-[13px]
                         hover:bg-sf2 hover:text-tx disabled:opacity-40
                         transition-colors duration-[160ms]`

// ── Componente principal ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sf" />}>
      <OnboardingInner />
    </Suspense>
  )
}

function OnboardingInner() {
  const [step, setStep] = useState<Step>(1)
  const [s, setS] = useState<WizardState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Dev-only: ?step=N para ver la UI sin signup real
  useEffect(() => {
    const n = Number(searchParams.get('step'))
    if (process.env.NODE_ENV !== 'production' && n >= 1 && n <= 5) {
      setStep(n as Step)
    }
  }, [searchParams])

  function update(patch: Partial<WizardState>) {
    setS(prev => ({ ...prev, ...patch }))
  }

  async function handleStep1() {
    if (!s.email || !s.password || !s.staffName) { setError('Completá todos los campos'); return }
    if (s.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true); setError(null)

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

  async function handleFinish() {
    if (s.zones.every(z => z.tables.length === 0)) {
      setError('Agregá al menos una mesa'); return
    }
    setLoading(true); setError(null)
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
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!data.ok) { setError(data.error ?? 'Error al guardar'); setLoading(false); return }
      router.replace('/dashboard/billing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
      setLoading(false)
    }
  }

  function addTable(zoneIdx: number) {
    const zone = s.zones[zoneIdx]
    const next = zone.tables.length + 1
    const label = `${zone.prefix}${next}`
    update({
      zones: s.zones.map((z, i) =>
        i === zoneIdx ? { ...z, tables: [...z.tables, { label, capacity: 2 }] } : z
      ),
    })
  }

  function removeTable(zoneIdx: number, tableIdx: number) {
    update({
      zones: s.zones.map((z, i) =>
        i === zoneIdx ? { ...z, tables: z.tables.filter((_, ti) => ti !== tableIdx) } : z
      ),
    })
  }

  function updateTable(zoneIdx: number, tableIdx: number, patch: Partial<TableRow>) {
    update({
      zones: s.zones.map((z, i) =>
        i === zoneIdx ? { ...z, tables: z.tables.map((t, ti) => ti === tableIdx ? { ...t, ...patch } : t) } : z
      ),
    })
  }

  function addZone() {
    const prefixes = ['S','T','V','P','B','G']
    const used = s.zones.map(z => z.prefix)
    const prefix = prefixes.find(p => !used.includes(p)) ?? String.fromCharCode(65 + s.zones.length)
    update({ zones: [...s.zones, { name: `Zona ${s.zones.length + 1}`, prefix, tables: [] }] })
  }

  function removeZone(idx: number) {
    if (s.zones.length === 1) return
    update({ zones: s.zones.filter((_, i) => i !== idx) })
  }

  function toggleDay(day: number) {
    const days = s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day]
    update({ days })
  }

  const btnNext = (onClick: () => void, label = 'Continuar') => (
    <button onClick={onClick} disabled={loading} className={btnPrimaryCls}>
      {loading ? <Spinner /> : label}
    </button>
  )

  const btnBack = () => (
    <button
      onClick={() => { setStep(p => (p - 1) as Step); setError(null) }}
      disabled={loading}
      className={btnSecondaryCls}
    >
      ← Volver
    </button>
  )

  return (
    <div className="min-h-screen bg-sf pb-10 px-5">
      <div className="max-w-md mx-auto pt-10 space-y-5">

        {/* Logo — solo paso 1 */}
        {step === 1 && (
          <div className="text-center mb-1">
            <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
              Panel del negocio
            </p>
            <h1 className="font-display text-[32px] leading-none text-tx tracking-tight">
              Un <span className="text-[#0F3460]">Toque</span>
            </h1>
          </div>
        )}

        {/* Stepper */}
        <StepperHeader step={step} />

        {/* Titular del paso */}
        <div>
          <p className="text-tx3 text-[11px] font-semibold uppercase tracking-wider mb-1">
            Paso {step} de 5 · {STEP_TITLES[step - 1]}
          </p>
          <h2 className="font-display text-[22px] text-tx leading-tight">
            {headlineFor(step)}
          </h2>
          <p className="text-tx2 text-[13px] mt-1">{subtitleFor(step)}</p>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        {/* Card contenedora del contenido */}
        <div className="bg-white rounded-lg border border-[rgba(0,0,0,0.07)] p-5 space-y-4">

          {/* ── PASO 1: Cuenta ── */}
          {step === 1 && (
            <>
              <Field label="Tu nombre">
                <input
                  value={s.staffName}
                  onChange={e => update({ staffName: e.target.value })}
                  placeholder="Ej: Martín García"
                  className={inputCls}
                  autoFocus
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={s.email}
                  onChange={e => update({ email: e.target.value })}
                  placeholder="tu@restaurante.com"
                  className={inputCls}
                  autoComplete="email"
                />
              </Field>
              <Field label="Contraseña">
                <input
                  type="password"
                  value={s.password}
                  onChange={e => update({ password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  className={inputCls}
                  autoComplete="new-password"
                />
              </Field>
            </>
          )}

          {/* ── PASO 2: Local ── */}
          {step === 2 && (
            <>
              <Field label="Nombre del restaurante">
                <input
                  value={s.venueName}
                  onChange={e => update({ venueName: e.target.value })}
                  placeholder="Ej: La Cantina"
                  className={inputCls}
                  autoFocus
                />
              </Field>
              <Field label="Dirección">
                <input
                  value={s.venueAddress}
                  onChange={e => update({ venueAddress: e.target.value })}
                  placeholder="Av. Corrientes 1234, CABA"
                  className={inputCls}
                />
              </Field>
              <Field label="Teléfono (opcional)">
                <input
                  type="tel"
                  value={s.venuePhone}
                  onChange={e => update({ venuePhone: e.target.value })}
                  placeholder="+54 11 4567-8901"
                  className={inputCls}
                />
              </Field>
              <Field label="Descripción breve (opcional)">
                <textarea
                  value={s.venueDesc}
                  onChange={e => update({ venueDesc: e.target.value })}
                  placeholder="Qué tipo de cocina, ambiente, especialidad…"
                  rows={2}
                  className={`${inputCls} resize-none leading-relaxed`}
                />
              </Field>
            </>
          )}

          {/* ── PASO 3: Horarios ── */}
          {step === 3 && (
            <>
              <Field label="Días que abrís">
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_ES.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`w-10 h-10 rounded-md text-[13px] font-semibold border transition-colors duration-[160ms]
                                  ${s.days.includes(i)
                                    ? 'bg-[#0F3460] border-[#0F3460] text-white'
                                    : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                                  }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              <TurnCard
                title="Almuerzo"
                turn={s.lunch}
                onToggle={() => update({ lunch: s.lunch ? null : { opens_at: '12:00', closes_at: '15:30' } })}
                onChange={(t) => update({ lunch: t })}
              />
              <TurnCard
                title="Cena"
                turn={s.dinner}
                onToggle={() => update({ dinner: s.dinner ? null : { opens_at: '20:00', closes_at: '23:30' } })}
                onChange={(t) => update({ dinner: t })}
              />
            </>
          )}

          {/* ── PASO 4: Mesas ── */}
          {step === 4 && (
            <>
              {s.zones.map((zone, zi) => (
                <div
                  key={zi}
                  className="rounded-md border border-[rgba(0,0,0,0.08)] bg-sf p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="grid grid-cols-[1fr_72px] gap-2 flex-1">
                      <Field label="Nombre de la zona">
                        <input
                          value={zone.name}
                          onChange={e => {
                            const z = [...s.zones]; z[zi] = { ...z[zi], name: e.target.value }
                            update({ zones: z })
                          }}
                          placeholder="Ej: Salón"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Prefijo">
                        <input
                          value={zone.prefix}
                          maxLength={2}
                          onChange={e => {
                            const z = [...s.zones]; z[zi] = { ...z[zi], prefix: e.target.value.toUpperCase() }
                            update({ zones: z })
                          }}
                          placeholder="S"
                          className={`${inputCls} text-center font-mono`}
                        />
                      </Field>
                    </div>
                    {s.zones.length > 1 && (
                      <button
                        onClick={() => removeZone(zi)}
                        className="mt-[26px] w-9 h-9 rounded-md bg-white border border-[rgba(0,0,0,0.08)]
                                   text-tx3 hover:text-[#D63646] hover:border-[#D63646]/30
                                   transition-colors flex-shrink-0 flex items-center justify-center"
                        aria-label="Eliminar zona"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] font-semibold text-tx3 uppercase tracking-wider">
                    Mesas ({zone.tables.length})
                  </p>
                  <div className="space-y-2">
                    {zone.tables.map((table, ti) => (
                      <div key={ti} className="flex items-center gap-2">
                        <input
                          value={table.label}
                          onChange={e => updateTable(zi, ti, { label: e.target.value })}
                          className="w-16 rounded-md bg-white border border-[rgba(0,0,0,0.1)] px-2 py-2
                                     text-[13px] text-tx text-center font-mono outline-none
                                     focus:border-[#0F3460] focus:ring-2 focus:ring-[#0F3460]/15
                                     transition-colors duration-[160ms]"
                        />
                        <div className="flex items-center gap-1 flex-1">
                          {[2, 4, 6, 8].map(cap => (
                            <button
                              key={cap}
                              onClick={() => updateTable(zi, ti, { capacity: cap })}
                              className={`flex-1 py-2 rounded-md text-[12px] font-semibold border transition-colors duration-[160ms]
                                          ${table.capacity === cap
                                            ? 'bg-[#0F3460] border-[#0F3460] text-white'
                                            : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                                          }`}
                            >
                              {cap}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => removeTable(zi, ti)}
                          className="w-8 h-8 rounded-md bg-white border border-[rgba(0,0,0,0.08)]
                                     text-tx3 hover:text-[#D63646] hover:border-[#D63646]/30
                                     flex items-center justify-center transition-colors flex-shrink-0"
                          aria-label="Eliminar mesa"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addTable(zi)}
                    className="w-full py-2.5 rounded-md border border-dashed border-[rgba(0,0,0,0.15)]
                               text-tx2 text-[13px] font-semibold bg-white
                               hover:border-[#0F3460]/40 hover:text-tx transition-colors"
                  >
                    + Agregar mesa
                  </button>
                </div>
              ))}

              <button
                onClick={addZone}
                className="w-full py-3 rounded-md border border-dashed border-[#0F3460]/30
                           text-[#0F3460] text-[13px] font-semibold bg-white
                           hover:border-[#0F3460]/60 hover:bg-[#0F3460]/[0.03] transition-colors"
              >
                + Agregar zona (terraza, barra, privado…)
              </button>
            </>
          )}

          {/* ── PASO 5: Seña ── */}
          {step === 5 && (
            <>
              <Field label="Monto de la seña">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tx2 text-[14px] font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    value={s.depositAmount}
                    onChange={e => update({ depositAmount: Number(e.target.value) })}
                    className={`${inputCls} pl-7 font-mono tabular-nums`}
                  />
                </div>
                <p className="text-tx3 text-[12px] mt-1.5 leading-relaxed">
                  Se descuenta del consumo al llegar. Se cobra via Mercado Pago.
                </p>
              </Field>

              <Field label="Cierre de reservas (min antes del turno)">
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map(min => (
                    <button
                      key={min}
                      onClick={() => update({ cutOffMinutes: min })}
                      className={`py-2.5 rounded-md text-[13px] font-semibold border transition-colors duration-[160ms]
                                  ${s.cutOffMinutes === min
                                    ? 'bg-[#0F3460] border-[#0F3460] text-white'
                                    : 'bg-white border-[rgba(0,0,0,0.1)] text-tx2 hover:border-[#0F3460]/40 hover:text-tx'
                                  }`}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
                <p className="text-tx3 text-[12px] mt-1.5 leading-relaxed">
                  Recomendado: 60 min.
                </p>
              </Field>

              {/* Resumen */}
              <div className="rounded-md bg-sf border border-[rgba(0,0,0,0.06)] p-4 space-y-2">
                <p className="text-[11px] font-semibold text-tx3 uppercase tracking-wider mb-1">
                  Resumen
                </p>
                <SummaryRow label="Restaurante" value={s.venueName || '—'} />
                <SummaryRow
                  label="Mesas"
                  value={`${s.zones.reduce((sum, z) => sum + z.tables.length, 0)} en ${s.zones.length} zona${s.zones.length !== 1 ? 's' : ''}`}
                />
                <SummaryRow
                  label="Turnos"
                  value={[s.lunch && 'almuerzo', s.dinner && 'cena'].filter(Boolean).join(' + ') || '—'}
                />
                <SummaryRow label="Días" value={`${s.days.length} días/sem`} />
                <SummaryRow
                  label="Seña"
                  value={<span className="font-mono tabular-nums">${s.depositAmount.toLocaleString('es-AR')}</span>}
                />
              </div>
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-2">
          {step === 1 && btnNext(handleStep1)}
          {step === 2 && <>
            {btnNext(() => {
              if (!s.venueName || !s.venueAddress) { setError('Nombre y dirección son obligatorios'); return }
              setError(null); setStep(3)
            })}
            {btnBack()}
          </>}
          {step === 3 && <>
            {btnNext(() => {
              if (!s.lunch && !s.dinner) { setError('Activá al menos un turno'); return }
              if (s.days.length === 0) { setError('Seleccioná al menos un día'); return }
              setError(null); setStep(4)
            })}
            {btnBack()}
          </>}
          {step === 4 && <>
            {btnNext(() => {
              const total = s.zones.reduce((sum, z) => sum + z.tables.length, 0)
              if (total === 0) { setError('Agregá al menos una mesa'); return }
              setError(null); setStep(5)
            })}
            {btnBack()}
          </>}
          {step === 5 && <>
            {btnNext(handleFinish, 'Crear mi restaurante')}
            {btnBack()}
          </>}
        </div>

        {step === 1 && (
          <div className="pt-2 space-y-3">
            <p className="text-center text-tx2 text-[13px]">
              ¿Ya tenés cuenta?{' '}
              <a href="/login" className="text-[#0F3460] font-semibold hover:underline">
                Iniciá sesión
              </a>
            </p>
            <p className="text-center text-tx3 text-[11px] leading-relaxed max-w-[320px] mx-auto">
              Al crear tu cuenta aceptás nuestros{' '}
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F3460] hover:underline"
              >
                Términos y Condiciones
              </a>{' '}
              y{' '}
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F3460] hover:underline"
              >
                Política de Privacidad
              </a>.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Helpers de contenido ─────────────────────────────────────────────────────

function headlineFor(step: Step) {
  switch (step) {
    case 1: return 'Creá tu cuenta'
    case 2: return 'Contanos del local'
    case 3: return 'Cuándo atendés'
    case 4: return 'Mesas y zonas'
    case 5: return 'Seña y reservas'
  }
}

function subtitleFor(step: Step) {
  switch (step) {
    case 1: return 'Con esto accedés al panel de tu restaurante'
    case 2: return 'Esta info aparece en Un Toque para los clientes'
    case 3: return 'Días y turnos donde recibís reservas'
    case 4: return 'Configurá el layout — podés ajustarlo después'
    case 5: return 'El monto que paga el cliente para confirmar'
  }
}

// ── Componentes ──────────────────────────────────────────────────────────────

function StepperHeader({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(i => {
        const done = i < step
        const active = i === step
        return (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-300
                        ${done || active ? 'bg-[#0F3460]' : 'bg-[rgba(0,0,0,0.08)]'}`}
          />
        )
      })}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-tx2 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function TurnCard({
  title,
  turn,
  onToggle,
  onChange,
}: {
  title: string
  turn: Turn | null
  onToggle: () => void
  onChange: (t: Turn) => void
}) {
  return (
    <div className="rounded-md border border-[rgba(0,0,0,0.08)] bg-sf p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-tx font-semibold text-[14px]">{title}</span>
        <button
          onClick={onToggle}
          aria-label={`Activar ${title}`}
          className={`w-10 h-6 rounded-full transition-colors duration-200 relative
                      ${turn ? 'bg-[#0F3460]' : 'bg-[rgba(0,0,0,0.15)]'}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200
                        ${turn ? 'left-[18px]' : 'left-0.5'}`}
          />
        </button>
      </div>
      {turn && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Apertura">
            <input
              type="time"
              value={turn.opens_at}
              onChange={e => onChange({ ...turn, opens_at: e.target.value })}
              className={`${inputCls} font-mono`}
            />
          </Field>
          <Field label="Cierre">
            <input
              type="time"
              value={turn.closes_at}
              onChange={e => onChange({ ...turn, closes_at: e.target.value })}
              className={`${inputCls} font-mono`}
            />
          </Field>
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center text-[13px]">
      <span className="text-tx2">{label}</span>
      <span className="text-tx font-semibold">{value}</span>
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
