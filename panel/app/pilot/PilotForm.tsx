'use client'

import { useState, type FormEvent } from 'react'

type FormState = {
  restaurante: string
  ciudad: string
  mesas: string
  sistemaActual: string
  horario: string
  contacto: string
}

const INITIAL: FormState = {
  restaurante: '',
  ciudad: '',
  mesas: '',
  sistemaActual: '',
  horario: '',
  contacto: '',
}

export default function PilotForm() {
  const [state, setState] = useState<FormState>(INITIAL)

  function update<K extends keyof FormState>(key: K, value: string) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const subject = `Pilot — ${state.restaurante || 'sin nombre'}`
    const body = [
      `Restaurante: ${state.restaurante}`,
      `Ciudad: ${state.ciudad}`,
      `Mesas aprox: ${state.mesas}`,
      `Sistema actual: ${state.sistemaActual}`,
      `Mejor horario para llamar: ${state.horario}`,
      `Contacto (WhatsApp / mail): ${state.contacto}`,
      '',
      '— Enviado desde /pilot',
    ].join('\n')
    const href = `mailto:hola@deuntoque.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
    window.location.href = href
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-2, #1A1B1F)',
    color: 'var(--text, #F4F2EE)',
    border: '1px solid var(--line, #23252A)',
    borderRadius: 12,
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-2, #A9A8A2)',
    marginBottom: 6,
    letterSpacing: '0.02em',
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'grid',
        gap: 16,
      }}
    >
      <div>
        <label style={labelStyle} htmlFor="restaurante">
          Nombre del restaurante
        </label>
        <input
          id="restaurante"
          required
          value={state.restaurante}
          onChange={(e) => update('restaurante', e.target.value)}
          style={inputStyle}
          placeholder="Ej: Bodegón Central"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ciudad">
            Ciudad
          </label>
          <input
            id="ciudad"
            required
            value={state.ciudad}
            onChange={(e) => update('ciudad', e.target.value)}
            style={inputStyle}
            placeholder="CABA, Rosario, Mendoza..."
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="mesas">
            Mesas aprox.
          </label>
          <input
            id="mesas"
            required
            value={state.mesas}
            onChange={(e) => update('mesas', e.target.value)}
            style={inputStyle}
            placeholder="20"
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="sistemaActual">
          Sistema actual de reservas
        </label>
        <input
          id="sistemaActual"
          required
          value={state.sistemaActual}
          onChange={(e) => update('sistemaActual', e.target.value)}
          style={inputStyle}
          placeholder="TheFork / Maxirest / Fudo / Excel / WhatsApp / Ninguno"
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="horario">
          Mejor horario para llamarte
        </label>
        <input
          id="horario"
          required
          value={state.horario}
          onChange={(e) => update('horario', e.target.value)}
          style={inputStyle}
          placeholder="Lun-Vie 11-13h, o cualquier después de las 17h"
        />
      </div>

      <div>
        <label style={labelStyle} htmlFor="contacto">
          WhatsApp o mail de contacto
        </label>
        <input
          id="contacto"
          required
          value={state.contacto}
          onChange={(e) => update('contacto', e.target.value)}
          style={inputStyle}
          placeholder="+54 9 11 1234 5678 o vos@restaurante.com"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{
          height: 48,
          padding: '0 24px',
          borderRadius: 999,
          fontSize: 15,
          marginTop: 8,
          cursor: 'pointer',
        }}
      >
        Enviar postulación →
      </button>

      <p style={{ fontSize: 11, color: 'var(--text-3, #6D6C68)', margin: 0 }}>
        Al enviar abrís tu cliente de mail con los datos pre-cargados a hola@deuntoque.com. Sin
        trackers ni terceros.
      </p>
    </form>
  )
}
