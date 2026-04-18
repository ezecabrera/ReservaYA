/**
 * Numeric display — todos los datos numéricos del panel.
 *
 * Usa JetBrains Mono tabular numbers con kerning apretado. El "reloj suizo"
 * de los datos: horas, mesas, personas, precios, tasas. Le da al panel
 * ese feel "crafted" que distingue producto premium de SaaS genérico.
 *
 * Uso:
 *   <NumericText>21:30</NumericText>         → fonte mono, tracking -0.02em
 *   <NumericText large>47</NumericText>      → display serif bold para hero stats
 *   <NumericText label>cubiertos</NumericText> → small caps label uppercase
 */

import type { HTMLAttributes } from 'react'

interface NumericTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  /** Tamaño grande tipo "big number" — usa Fraunces serif */
  large?: boolean
  /** Etiqueta small caps (uppercase) */
  label?: boolean
  /** Color override (default hereda) */
  tone?: 'default' | 'muted' | 'wine' | 'olive' | 'gold' | 'terracotta'
}

const TONES: Record<NonNullable<NumericTextProps['tone']>, string> = {
  default:    '',
  muted:      'text-ink-text-2',
  wine:       'text-wine-soft',
  olive:      'text-olive',
  gold:       'text-gold',
  terracotta: 'text-terracotta',
}

export function NumericText({
  children,
  large,
  label,
  tone = 'default',
  className = '',
  ...rest
}: NumericTextProps) {
  if (label) {
    return (
      <span
        {...rest}
        className={`text-[10.5px] font-bold uppercase tracking-[0.12em] ${TONES[tone]} ${className}`}
      >
        {children}
      </span>
    )
  }

  if (large) {
    return (
      <span
        {...rest}
        className={`font-display font-bold tabular-nums tracking-[-0.02em] ${TONES[tone]} ${className}`}
      >
        {children}
      </span>
    )
  }

  return (
    <span
      {...rest}
      className={`font-mono tabular-nums tracking-[-0.01em] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
