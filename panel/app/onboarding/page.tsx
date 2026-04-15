'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface TableRow { label: string; capacity: number }
interface ZoneRow  { name: string; prefix: string; tables: TableRow[] }
interface Turn     { opens_at: string; closes_at: string }

interface WizardState {
  // Step 1
  email: string
  password: string
  staffName: string
  // Step 2
  venueName: string
  venueAddress: string
  venuePhone: string
  venueDesc: string
  // Step 3
  days: number[]
  lunch: Turn | null
  dinner: Turn | null
  // Step 4
  zones: ZoneRow[]
  // Step 5
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function StepHeader({ step, title, sub }: { step: Step; title: string; sub: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        {([1,2,3,4,5] as Step[]).map(s => (
          <div key={s}
            className={`h-1 flex-1 rounded-full transition-all duration-300
                        ${s <= step ? 'bg-c1' : 'bg-white/15'}`}
          />
        ))}
      </div>
      <p className="text-white/40 text-[12px] font-bold uppercase tracking-wider mb-1">
        Paso {step} de 5
      </p>
      <h2 className="font-display text-[22px] font-bold text-white">{title}</h2>
      <p className="text-white/50 text-[13px] mt-0.5">{sub}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = `w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3.5
                  text-[14px] text-white placeholder-white/30 outline-none
                  focus:border-c1/50 focus:ring-2 focus:ring-c1/20 transition-all`

// ── Componente principal ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [s, setS] = useState<WizardState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function update(patch: Partial<WizardState>) {
    setS(prev => ({ ...prev, ...patch }))
  }

  // ── Paso 1: Crear cuenta ─────────────────────────────────────────────────
  async function handleStep1() {
    if (!s.email || !s.password || !s.staffName) { setError('Completá todos los campos'); return }
    setLoading(true); setError(null)
    const { error: signUpError } = await supabase.auth.signUp({
      email: s.email,
      password: s.password,
    })
    setLoading(false)
    if (signUpError) { setError(signUpError.message); return }
    setStep(2)
  }

  // ── Paso 5: Enviar todo ───────────────────────────────────────────────────
  async function handleFinish() {
    if (s.zones.every(z => z.tables.length === 0)) {
      setError('Agregá al menos una mesa'); return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      router.replace('/dashboard')
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  // ── Helpers de mesas ─────────────────────────────────────────────────────
  function addTable(zoneIdx: number) {
    const zone = s.zones[zoneIdx]
    const next = zone.tables.length + 1
    const label = `${zone.prefix}${next}`
    const newZones = s.zones.map((z, i) =>
      i === zoneIdx
        ? { ...z, tables: [...z.tables, { label, capacity: 2 }] }
        : z
    )
    update({ zones: newZones })
  }

  function removeTable(zoneIdx: number, tableIdx: number) {
    const newZones = s.zones.map((z, i) =>
      i === zoneIdx
        ? { ...z, tables: z.tables.filter((_, ti) => ti !== tableIdx) }
        : z
    )
    update({ zones: newZones })
  }

  function updateTable(zoneIdx: number, tableIdx: number, patch: Partial<TableRow>) {
    const newZones = s.zones.map((z, i) =>
      i === zoneIdx
        ? { ...z, tables: z.tables.map((t, ti) => ti === tableIdx ? { ...t, ...patch } : t) }
        : z
    )
    update({ zones: newZones })
  }

  function addZone() {
    const prefixes = ['S','T','V','P','B','G']
    const used = s.zones.map(z => z.prefix)
    const prefix = prefixes.find(p => !used.includes(p)) ?? String.fromCharCode(65 + s.zones.length)
    update({ zones: [...s.zones, { name: `Zona ${s.zones.length + 1}`, prefix, tables: [] }] })
  }

  function toggleDay(day: number) {
    const days = s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day]
    update({ days })
  }

  // ── Renders por paso ─────────────────────────────────────────────────────

  const btnNext = (onClick: () => void, label = 'Continuar →', disabled = false) => (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full py-4 rounded-xl bg-c1 text-white font-bold text-[15px]
                 shadow-[0_4px_20px_rgba(255,71,87,0.3)] disabled:opacity-50
                 active:scale-[0.97] transition-all duration-[180ms] mt-2"
    >
      {loading ? 'Un momento…' : label}
    </button>
  )

  const btnBack = () => (
    <button
      onClick={() => { setStep(s => (s - 1) as Step); setError(null) }}
      className="w-full py-3 rounded-xl bg-white/5 text-white/50 text-[14px] font-semibold
                 active:scale-[0.97] transition-transform"
    >
      ← Volver
    </button>
  )

  return (
    <div className="min-h-screen pb-10 px-5"
      style={{ background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)' }}>

      <div className="max-w-md mx-auto pt-14 space-y-4">

        {/* Logo / marca */}
        {step === 1 && (
          <div className="text-center mb-8">
            <h1 className="font-display text-[32px] font-bold text-white tracking-tight">
              Reserva<span className="text-c1">YA</span>
            </h1>
            <p className="text-white/45 text-[14px] mt-1">Panel para restaurantes</p>
          </div>
        )}

        {error && (
          <div className="bg-c1/15 border border-c1/30 rounded-xl px-4 py-3 text-c1 text-[13px] font-semibold">
            {error}
          </div>
        )}

        {/* ── PASO 1: Cuenta ── */}
        {step === 1 && (
          <>
            <StepHeader step={1}
              title="Creá tu cuenta"
              sub="Con esto accedés al panel de tu restaurante" />
            <div className="space-y-3">
              <Field label="Tu nombre">
                <input value={s.staffName} onChange={e => update({ staffName: e.target.value })}
                  placeholder="Ej: Martín García" className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={s.email} onChange={e => update({ email: e.target.value })}
                  placeholder="tu@email.com" className={inputCls} autoComplete="email" />
              </Field>
              <Field label="Contraseña">
                <input type="password" value={s.password} onChange={e => update({ password: e.target.value })}
                  placeholder="Mínimo 6 caracteres" className={inputCls} autoComplete="new-password" />
              </Field>
            </div>
            {btnNext(handleStep1)}
            <p className="text-center text-white/30 text-[12px]">
              ¿Ya tenés cuenta?{' '}
              <a href="/login" className="text-c1 font-semibold">Iniciá sesión</a>
            </p>
          </>
        )}

        {/* ── PASO 2: Restaurante ── */}
        {step === 2 && (
          <>
            <StepHeader step={2}
              title="Tu restaurante"
              sub="Esta info aparece en la app para los clientes" />
            <div className="space-y-3">
              <Field label="Nombre del restaurante">
                <input value={s.venueName} onChange={e => update({ venueName: e.target.value })}
                  placeholder="Ej: La Cantina" className={inputCls} />
              </Field>
              <Field label="Dirección">
                <input value={s.venueAddress} onChange={e => update({ venueAddress: e.target.value })}
                  placeholder="Av. Corrientes 1234, CABA" className={inputCls} />
              </Field>
              <Field label="Teléfono (opcional)">
                <input type="tel" value={s.venuePhone} onChange={e => update({ venuePhone: e.target.value })}
                  placeholder="+54 11 4567-8901" className={inputCls} />
              </Field>
              <Field label="Descripción breve (opcional)">
                <textarea value={s.venueDesc} onChange={e => update({ venueDesc: e.target.value })}
                  placeholder="Qué tipo de cocina, ambiente, especialidad…"
                  rows={2} className={`${inputCls} resize-none`} />
              </Field>
            </div>
            <div className="space-y-2 pt-1">
              {btnNext(() => {
                if (!s.venueName || !s.venueAddress) { setError('Nombre y dirección son obligatorios'); return }
                setError(null); setStep(3)
              })}
              {btnBack()}
            </div>
          </>
        )}

        {/* ── PASO 3: Horarios ── */}
        {step === 3 && (
          <>
            <StepHeader step={3}
              title="Días y turnos"
              sub="¿Cuándo atiende tu restaurante?" />

            {/* Días */}
            <Field label="Días que abrís">
              <div className="flex gap-2 flex-wrap mt-1">
                {DAYS_ES.map((d, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full font-bold text-[13px] border-2 transition-all
                                ${s.days.includes(i)
                                  ? 'bg-c1 border-c1 text-white'
                                  : 'bg-white/5 border-white/15 text-white/40'
                                }`}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            {/* Almuerzo */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-[14px]">Almuerzo</span>
                <button
                  onClick={() => update({ lunch: s.lunch ? null : { opens_at: '12:00', closes_at: '15:30' } })}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative
                              ${s.lunch ? 'bg-c1' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200
                                    ${s.lunch ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {s.lunch && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Apertura">
                    <input type="time" value={s.lunch.opens_at}
                      onChange={e => update({ lunch: { ...s.lunch!, opens_at: e.target.value } })}
                      className={inputCls} style={{ colorScheme: 'dark' }} />
                  </Field>
                  <Field label="Cierre">
                    <input type="time" value={s.lunch.closes_at}
                      onChange={e => update({ lunch: { ...s.lunch!, closes_at: e.target.value } })}
                      className={inputCls} style={{ colorScheme: 'dark' }} />
                  </Field>
                </div>
              )}
            </div>

            {/* Cena */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-[14px]">Cena</span>
                <button
                  onClick={() => update({ dinner: s.dinner ? null : { opens_at: '20:00', closes_at: '23:30' } })}
                  className={`w-11 h-6 rounded-full transition-all duration-200 relative
                              ${s.dinner ? 'bg-c1' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200
                                    ${s.dinner ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {s.dinner && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Apertura">
                    <input type="time" value={s.dinner.opens_at}
                      onChange={e => update({ dinner: { ...s.dinner!, opens_at: e.target.value } })}
                      className={inputCls} style={{ colorScheme: 'dark' }} />
                  </Field>
                  <Field label="Cierre">
                    <input type="time" value={s.dinner.closes_at}
                      onChange={e => update({ dinner: { ...s.dinner!, closes_at: e.target.value } })}
                      className={inputCls} style={{ colorScheme: 'dark' }} />
                  </Field>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {btnNext(() => {
                if (!s.lunch && !s.dinner) { setError('Activá al menos un turno'); return }
                if (s.days.length === 0) { setError('Seleccioná al menos un día'); return }
                setError(null); setStep(4)
              })}
              {btnBack()}
            </div>
          </>
        )}

        {/* ── PASO 4: Mesas ── */}
        {step === 4 && (
          <>
            <StepHeader step={4}
              title="Mesas y zonas"
              sub="Configurá el layout de tu restaurante" />

            <div className="space-y-4">
              {s.zones.map((zone, zi) => (
                <div key={zi} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  {/* Cabecera de zona */}
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Nombre de la zona">
                      <input value={zone.name}
                        onChange={e => {
                          const z = [...s.zones]; z[zi] = { ...z[zi], name: e.target.value }
                          update({ zones: z })
                        }}
                        placeholder="Ej: Salón"
                        className={inputCls} />
                    </Field>
                    <Field label="Prefijo">
                      <input value={zone.prefix} maxLength={2}
                        onChange={e => {
                          const z = [...s.zones]; z[zi] = { ...z[zi], prefix: e.target.value.toUpperCase() }
                          update({ zones: z })
                        }}
                        placeholder="S"
                        className={inputCls} />
                    </Field>
                  </div>

                  {/* Mesas */}
                  <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider">
                    Mesas ({zone.tables.length})
                  </p>
                  <div className="space-y-2">
                    {zone.tables.map((table, ti) => (
                      <div key={ti} className="flex items-center gap-2">
                        <input value={table.label}
                          onChange={e => updateTable(zi, ti, { label: e.target.value })}
                          className="w-16 rounded-lg bg-white/10 border border-white/15 px-2 py-2
                                     text-[13px] text-white text-center outline-none focus:border-c1/50"
                        />
                        <div className="flex items-center gap-1.5 flex-1">
                          {[2, 4, 6, 8].map(cap => (
                            <button key={cap} onClick={() => updateTable(zi, ti, { capacity: cap })}
                              className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-all
                                          ${table.capacity === cap ? 'bg-c1 text-white' : 'bg-white/10 text-white/40'}`}>
                              {cap}👤
                            </button>
                          ))}
                        </div>
                        <button onClick={() => removeTable(zi, ti)}
                          className="w-8 h-8 rounded-lg bg-c1/15 text-c1 flex items-center justify-center
                                     text-[16px] active:scale-90 transition-transform flex-shrink-0">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => addTable(zi)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/20
                               text-white/40 text-[13px] font-semibold active:scale-[0.97] transition-transform">
                    + Agregar mesa
                  </button>
                </div>
              ))}

              <button onClick={addZone}
                className="w-full py-3 rounded-xl border border-dashed border-c1/30
                           text-c1 text-[13px] font-semibold active:scale-[0.97] transition-transform">
                + Agregar zona (terraza, privado…)
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {btnNext(() => {
                const totalTables = s.zones.reduce((sum, z) => sum + z.tables.length, 0)
                if (totalTables === 0) { setError('Agregá al menos una mesa'); return }
                setError(null); setStep(5)
              })}
              {btnBack()}
            </div>
          </>
        )}

        {/* ── PASO 5: Seña ── */}
        {step === 5 && (
          <>
            <StepHeader step={5}
              title="Seña y reservas"
              sub="El monto que paga el cliente para confirmar" />

            <div className="space-y-4">
              <Field label="Monto de la seña ($)">
                <input type="number" value={s.depositAmount}
                  onChange={e => update({ depositAmount: Number(e.target.value) })}
                  className={inputCls} />
                <p className="text-white/30 text-[11px] mt-1.5">
                  Se descuenta del consumo al llegar. Pagado via Mercado Pago.
                </p>
              </Field>

              <Field label="Cierre de reservas (minutos antes del turno)">
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map(min => (
                    <button key={min} onClick={() => update({ cutOffMinutes: min })}
                      className={`flex-1 py-3 rounded-xl text-[13px] font-bold border-2 transition-all
                                  ${s.cutOffMinutes === min
                                    ? 'bg-c1 border-c1 text-white'
                                    : 'bg-white/5 border-white/15 text-white/50'
                                  }`}>
                      {min}m
                    </button>
                  ))}
                </div>
                <p className="text-white/30 text-[11px] mt-1.5">
                  Recomendado: 60 min. Así el restaurante puede prepararse.
                </p>
              </Field>

              {/* Resumen */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider mb-2">Resumen</p>
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Restaurante</span>
                  <span className="text-white font-semibold">{s.venueName}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Mesas</span>
                  <span className="text-white font-semibold">
                    {s.zones.reduce((sum, z) => sum + z.tables.length, 0)} en {s.zones.length} zona{s.zones.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Turnos</span>
                  <span className="text-white font-semibold">
                    {[s.lunch && 'almuerzo', s.dinner && 'cena'].filter(Boolean).join(' + ')}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-white/50">Seña</span>
                  <span className="text-white font-semibold">${s.depositAmount.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {btnNext(handleFinish, '¡Empezar a recibir reservas! →')}
              {btnBack()}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
