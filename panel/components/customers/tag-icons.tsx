/**
 * UnToque · SVG icons inline para CustomerTags (Lucide-style, stroke 2).
 * 100% opacos, sin deps. `aria-hidden` por defecto — los chips llevan aria-label.
 */

import type { SVGProps } from 'react'
import type { CustomerTagKind } from '@/lib/shared/types/customer-tag'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number
  filled?: boolean
}

function Base({
  size = 14,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ── Tag kind icons ─────────────────────────────────────── */

export function AlertCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </Base>
  )
}

export function BanIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </Base>
  )
}

export function SaladIcon(props: IconProps) {
  // leaf-style fallback (Salad in Lucide is complex, this is editorial)
  return (
    <Base {...props}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.6.8c0 4.92-1.5 8.2-5.5 11.5C12.4 18 11.7 19.6 11 20Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </Base>
  )
}

export function StarIcon({ filled, ...props }: IconProps) {
  return (
    <Base {...props} fill={filled ? 'currentColor' : 'none'}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Base>
  )
}

export function CakeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
      <path d="M2 21h20" />
      <path d="M7 8v3" />
      <path d="M12 8v3" />
      <path d="M17 8v3" />
      <path d="M7 4h.01" />
      <path d="M12 4h.01" />
      <path d="M17 4h.01" />
    </Base>
  )
}

export function PartyPopperIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-1.7.3a2.89 2.89 0 0 0-2.42 2.4l-.3 1.7" />
      <path d="M18.5 4.5 9 14" />
    </Base>
  )
}

export function WheatIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 22 16 8" />
      <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
    </Base>
  )
}

/* ── UI utility icons ────────────────────────────────────── */

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Base>
  )
}

export function Trash2Icon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Base>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Base>
  )
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Base>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Base>
  )
}

/* ── Helper: icono según kind ────────────────────────────── */

export function TagKindIcon({
  kind,
  size = 14,
  filled,
  ...rest
}: IconProps & { kind: CustomerTagKind }) {
  switch (kind) {
    case 'allergy':
      return <AlertCircleIcon size={size} {...rest} />
    case 'restriction':
      return <BanIcon size={size} {...rest} />
    case 'dietary':
      return <SaladIcon size={size} {...rest} />
    case 'vip':
      return <StarIcon size={size} filled={filled} {...rest} />
    case 'celebration':
      return <CakeIcon size={size} {...rest} />
    case 'preference':
      return <StarIcon size={size} {...rest} />
    case 'note':
      return <EditIcon size={size} {...rest} />
    default:
      return null
  }
}

/**
 * Color pastel asociado a cada kind (token CSS).
 * Usar como background para chips/items activos. Texto siempre #1A1B1F sobre pastel.
 */
export const TAG_KIND_COLOR: Record<CustomerTagKind, string> = {
  allergy: 'var(--p-pink)',
  restriction: 'var(--wine)',
  dietary: 'var(--p-mint)',
  vip: 'var(--p-butter)',
  celebration: 'var(--p-peach)',
  preference: 'var(--p-lilac)',
  note: 'var(--p-sky)',
}

export const TAG_KIND_LABEL: Record<CustomerTagKind, string> = {
  allergy: 'Alergias',
  restriction: 'Restricciones',
  dietary: 'Dieta',
  vip: 'VIP',
  celebration: 'Celebración',
  preference: 'Preferencias',
  note: 'Notas',
}
