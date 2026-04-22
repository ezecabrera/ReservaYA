'use client'

import { useState, useMemo } from 'react'

// ─── Validaciones ────────────────────────────────────────────────────────

/** Algoritmo de Luhn — valida que el número de tarjeta sea plausible */
export function isValidLuhn(numDigitsOnly: string): boolean {
  if (!/^\d{12,19}$/.test(numDigitsOnly)) return false
  let sum = 0
  let alt = false
  for (let i = numDigitsOnly.length - 1; i >= 0; i--) {
    let n = parseInt(numDigitsOnly[i], 10)
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

type Brand = 'visa' | 'mastercard' | 'amex' | 'cabal' | 'unknown'

/** Detección de marca por prefijo */
function detectBrand(num: string): Brand {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(60|58|62|50)/.test(n)) return 'cabal'
  return 'unknown'
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  // Amex: 4-6-5 · Otros: 4-4-4-4
  if (/^3[47]/.test(digits)) {
    return digits.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*$/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    )
  }
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length < 3) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function isValidExpiry(exp: string): boolean {
  const m = exp.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const month = parseInt(m[1], 10)
  const year = 2000 + parseInt(m[2], 10)
  if (month < 1 || month > 12) return false
  const last = new Date(year, month, 0, 23, 59, 59) // último día del mes
  return last.getTime() > Date.now()
}

// ─── UI ──────────────────────────────────────────────────────────────────

interface Props {
  amount: number
  onSubmit: (card: {
    number: string          // sólo dígitos
    expiry: string          // MM/YY
    cvv: string
    name: string
    brand: Brand
  }) => void
  submitting?: boolean
  errorMessage?: string | null
}

function BrandIcon({ brand }: { brand: Brand }) {
  if (brand === 'unknown') {
    return (
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" rx="3" fill="#E5E7EB" />
        <rect x="2" y="7" width="10" height="2" fill="#9CA3AF" />
      </svg>
    )
  }
  const bg = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    amex: '#2E77BC',
    cabal: '#0077C8',
  }[brand]
  const label = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
    cabal: 'CABAL',
  }[brand]
  return (
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
          style={{ backgroundColor: bg, minWidth: 40 }}>
      {label}
    </span>
  )
}

export function CreditCardForm({ amount, onSubmit, submitting, errorMessage }: Props) {
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const digitsOnly = useMemo(() => number.replace(/\s/g, ''), [number])
  const brand = useMemo(() => detectBrand(digitsOnly), [digitsOnly])
  const cvvLen = brand === 'amex' ? 4 : 3

  const errors = {
    number: digitsOnly.length > 0 && !isValidLuhn(digitsOnly)
      ? 'Número de tarjeta inválido' : null,
    expiry: expiry.length > 0 && !isValidExpiry(expiry)
      ? 'Fecha inválida o vencida' : null,
    cvv: cvv.length > 0 && cvv.length < cvvLen
      ? `Debe tener ${cvvLen} dígitos` : null,
    name: name.length > 0 && name.trim().length < 3
      ? 'Ingresá el nombre completo' : null,
  }

  const canSubmit =
    isValidLuhn(digitsOnly) &&
    isValidExpiry(expiry) &&
    cvv.length === cvvLen &&
    name.trim().length >= 3 &&
    !submitting

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ number: true, expiry: true, cvv: true, name: true })
    if (!canSubmit) return
    onSubmit({ number: digitsOnly, expiry, cvv, name: name.trim(), brand })
  }

  const inputCls = `w-full rounded-md border bg-sf px-4 py-3 text-[15px] text-tx
    outline-none transition-all duration-[180ms] font-medium tracking-wide`

  const errCls = (err: string | null, t: boolean) =>
    err && t ? 'border-c1 focus:ring-2 focus:ring-c1/20' : 'border-[rgba(0,0,0,0.1)] focus:border-c4 focus:ring-2 focus:ring-[var(--c4)]/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card preview */}
      <div className="relative aspect-[16/10] max-h-[180px] rounded-2xl p-5
                      bg-gradient-to-br from-[#1A1F71] via-[#2A2F8F] to-[#0D0D3F]
                      shadow-lg overflow-hidden">
        <div className="absolute top-4 right-4">
          <BrandIcon brand={brand} />
        </div>
        <svg className="absolute top-5 left-5" width="34" height="26" viewBox="0 0 34 26" fill="none">
          <rect width="34" height="26" rx="4" fill="#F5C542" />
          <rect x="4" y="7" width="26" height="2" fill="#C19A2B" />
          <rect x="4" y="11" width="26" height="2" fill="#C19A2B" />
        </svg>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-white/90 font-mono text-[17px] tracking-[0.12em]">
            {number || '•••• •••• •••• ••••'}
          </p>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-wider">Titular</p>
              <p className="text-white text-[12px] font-semibold truncate max-w-[180px]">
                {name.toUpperCase() || 'NOMBRE APELLIDO'}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-wider">Vence</p>
              <p className="text-white text-[12px] font-semibold font-mono">
                {expiry || 'MM/AA'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Número */}
      <div>
        <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
          Número de tarjeta
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          onBlur={() => setTouched((t) => ({ ...t, number: true }))}
          maxLength={23}
          className={`${inputCls} ${errCls(errors.number, !!touched.number)} font-mono`}
          required
        />
        {errors.number && touched.number && (
          <p className="text-[12px] text-[#D63646] mt-1">{errors.number}</p>
        )}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
            Vencimiento
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
            maxLength={5}
            className={`${inputCls} ${errCls(errors.expiry, !!touched.expiry)} font-mono`}
            required
          />
          {errors.expiry && touched.expiry && (
            <p className="text-[12px] text-[#D63646] mt-1">{errors.expiry}</p>
          )}
        </div>
        <div>
          <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
            CVV
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === 'amex' ? '4 dígitos' : '3 dígitos'}
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, cvvLen))}
            onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
            maxLength={cvvLen}
            className={`${inputCls} ${errCls(errors.cvv, !!touched.cvv)} font-mono`}
            required
          />
          {errors.cvv && touched.cvv && (
            <p className="text-[12px] text-[#D63646] mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Titular */}
      <div>
        <label className="block text-[13px] font-semibold text-tx2 mb-1.5">
          Nombre del titular
        </label>
        <input
          type="text"
          autoComplete="cc-name"
          placeholder="Como figura en la tarjeta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          className={`${inputCls} ${errCls(errors.name, !!touched.name)}`}
          required
        />
        {errors.name && touched.name && (
          <p className="text-[12px] text-[#D63646] mt-1">{errors.name}</p>
        )}
      </div>

      {errorMessage && (
        <div className="bg-c1l border border-c1/20 rounded-lg p-3">
          <p className="text-[13px] text-[#D63646] font-semibold">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando…
          </>
        ) : (
          <>Pagar ${amount.toLocaleString('es-AR')}</>
        )}
      </button>

      <p className="text-center text-tx3 text-[11px] flex items-center justify-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="2" />
        </svg>
        Pago seguro · Tus datos se envían encriptados a Mercado Pago
      </p>
    </form>
  )
}
