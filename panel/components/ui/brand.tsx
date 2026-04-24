'use client'

import { useTheme } from '@/components/theme/ThemeProvider'

/* ============================================================
   Helpers de marca UnToque — iconos, avatar, sparkline, pills
   Basado en el handoff de Claude Design (2026-04-24).
   ============================================================ */

const stroke = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

type IconProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'>

export const Ic = {
  tables:  (p: IconProps) => (
    <svg {...stroke} {...p}>
      <rect x="3" y="4" width="8" height="7" rx="2"/>
      <rect x="13" y="4" width="8" height="7" rx="2"/>
      <rect x="3" y="13" width="8" height="7" rx="2"/>
      <rect x="13" y="13" width="8" height="7" rx="2"/>
    </svg>
  ),
  orders:  (p: IconProps) => (
    <svg {...stroke} {...p}>
      <path d="M4 5h16l-1.5 12a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4 5z"/>
      <path d="M9 9v2M15 9v2"/>
    </svg>
  ),
  reserva: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 10h18M8 3v4M16 3v4"/>
    </svg>
  ),
  chat: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>
    </svg>
  ),
  dash: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <rect x="3" y="3" width="8" height="8" rx="2"/>
      <rect x="13" y="3" width="8" height="5" rx="2"/>
      <rect x="3" y="13" width="8" height="8" rx="2"/>
      <rect x="13" y="10" width="8" height="11" rx="2"/>
    </svg>
  ),
  book: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z"/>
      <path d="M4 16a4 4 0 0 1 4-4h12"/>
    </svg>
  ),
  settings: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>
    </svg>
  ),
  crm: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <circle cx="9" cy="8" r="3.5"/>
      <path d="M2 21c0-3.5 3-6 7-6s7 2.5 7 6"/>
      <circle cx="17" cy="7" r="2.5"/>
      <path d="M22 17c0-2-2-3-4-3"/>
    </svg>
  ),
  camp: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <path d="M3 11l15-6v14L3 13z"/>
      <path d="M7 13v5"/>
    </svg>
  ),
  stats: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>
    </svg>
  ),
  plan: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <rect x="3" y="6" width="18" height="13" rx="2"/>
      <path d="M3 10h18"/>
    </svg>
  ),
  search: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 18} height={p.height ?? 18}>
      <circle cx="11" cy="11" r="7"/>
      <path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  plus: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 16} height={p.height ?? 16}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  x: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 14} height={p.height ?? 14} strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  sun: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 16} height={p.height ?? 16}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>
    </svg>
  ),
  moon: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 16} height={p.height ?? 16}>
      <path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/>
    </svg>
  ),
  arrow: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 14} height={p.height ?? 14} strokeWidth={1.8}>
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  ),
  clock: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 14} height={p.height ?? 14}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  wa: (p: IconProps) => (
    <svg {...p} width={p.width ?? 14} height={p.height ?? 14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.4-.1-.6.1-.7.9-.8 1-.3.2-.5.1a8 8 0 0 1-2.3-1.4 9 9 0 0 1-1.6-2c-.2-.3 0-.4.1-.5l.4-.4.3-.5a.5.5 0 0 0 0-.5c0-.1-.6-1.5-.8-2s-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.8 1.9 3 4.7 4.2c1.7.7 2.3.7 3.1.6.5 0 1.6-.6 1.8-1.3s.2-1.2.2-1.3-.2-.2-.4-.3zM12 3a9 9 0 0 0-7.7 13.7L3 21l4.4-1.2A9 9 0 1 0 12 3z"/>
    </svg>
  ),
  cloud: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 16} height={p.height ?? 16}>
      <path d="M17 18a4 4 0 0 0 0-8 6 6 0 0 0-11.8 1A4 4 0 0 0 6 19h11z"/>
    </svg>
  ),
  bell: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 16} height={p.height ?? 16}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
    </svg>
  ),
  sparkle: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 14} height={p.height ?? 14}>
      <path d="M12 3l1.5 5L18 9.5 13.5 11 12 16l-1.5-5L6 9.5 10.5 8z"/>
    </svg>
  ),
  fire: (p: IconProps) => (
    <svg {...stroke} {...p} width={p.width ?? 14} height={p.height ?? 14}>
      <path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 4 3 3 3-1 0-2 0-3 0-5z"/>
    </svg>
  ),
  help: (p: IconProps) => (
    <svg {...stroke} {...p}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 1.8-2.5 3.5"/>
      <circle cx="12" cy="17" r="0.6" fill="currentColor"/>
    </svg>
  ),
}

/* ---------- Pastel avatar ---------- */
export const PASTELS = [
  'p-lilac',
  'p-mint',
  'p-sky',
  'p-pink',
  'p-periwink',
  'p-butter',
  'p-peach',
] as const

export type PastelKey = (typeof PASTELS)[number]

export function pickPastel(name = ''): PastelKey {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % PASTELS.length
  return PASTELS[h]
}

interface AvatarProps {
  name: string
  size?: number
  /** Override pastel si no se quiere el determinístico */
  pastel?: PastelKey
}

export function Avatar({ name, size = 28, pastel }: AvatarProps) {
  const c = pastel ?? pickPastel(name)
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `var(--${c})`,
        color: '#1A1B1F',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: size * 0.42,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
      aria-hidden
    >
      {initial}
    </div>
  )
}

/* ---------- Theme toggle (pill) ---------- */
export function ThemeSwitch({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        padding: '0 12px',
        background: 'var(--surface-2)',
        color: 'var(--text)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--r-pill)',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      {theme === 'dark' ? <Ic.moon /> : <Ic.sun />}
      {theme === 'dark' ? 'Oscuro' : 'Claro'}
    </button>
  )
}

/* ---------- Sparkline ---------- */
interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({
  data,
  color = 'var(--p-periwink)',
  width = 120,
  height = 32,
}: SparklineProps) {
  if (data.length === 0) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / (max - min || 1)) * height
    return [x, y] as const
  })
  const d = pts
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(' ')
  const area = `${d} L ${width} ${height} L 0 ${height} Z`
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden>
      <path d={area} fill={color} opacity={0.25} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  )
}

/* ---------- Weather pill ---------- */
interface WeatherPillProps {
  temp?: string
  condition?: string
  note?: string
}

export function WeatherPill({
  temp = '19°',
  condition = 'despejado',
  note = 'TERRAZA OK',
}: WeatherPillProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: 'var(--surface-2)',
        color: 'var(--text)',
        border: '1px solid var(--line-2)',
        borderRadius: 'var(--r-pill)',
        fontSize: 12,
      }}
    >
      <Ic.cloud style={{ color: 'var(--p-sky)' }} />
      <span style={{ fontWeight: 600 }}>{temp}</span>
      <span style={{ color: 'var(--text-3)', fontSize: 11 }}>· {condition}</span>
      {note && (
        <span
          style={{
            color: 'var(--text-3)',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
          }}
        >
          {note}
        </span>
      )}
    </div>
  )
}

/* ---------- LIVE badge/pill ---------- */
export function LivePill() {
  return (
    <span className="live-pill" role="status" aria-label="En vivo">
      <span className="live-dot" />
      LIVE
    </span>
  )
}
