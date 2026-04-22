'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Nav inferior del panel — look light + navy ───────────────────────────────

const ACTIVE = '#0F3460'
const INACTIVE = '#ABABBA' // tx3

interface NavItem {
  href: string
  label: string
  icon: (color: string) => React.ReactNode
}

const ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Mesas',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/reservas',
    label: 'Reservas',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/menu',
    label: 'Menú',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke={c} strokeWidth="2" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke={c} strokeWidth="2" />
        <path d="M9 12h6M9 16h4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/venue',
    label: 'Local',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/check-in',
    label: 'Check-in',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
          stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/analytics',
    label: 'Stats',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6"
          stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/billing',
    label: 'Plan',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/config',
    label: 'Config',
    icon: (c) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
          stroke={c} strokeWidth="2" />
      </svg>
    ),
  },
]

export function PanelNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around pt-2 px-2">
        {ITEMS.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          const color = active ? ACTIVE : INACTIVE
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[54px] py-1.5 relative"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                  style={{ background: ACTIVE }}
                />
              )}
              {item.icon(color)}
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
