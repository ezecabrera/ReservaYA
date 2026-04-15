'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  {
    href: '/dashboard',
    label: 'Mesas',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'} strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1.5"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'} strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1.5"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'} strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="1.5"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/reservas',
    label: 'Reservas',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'} strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/menu',
    label: 'Menú',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="2" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'} strokeWidth="2" />
        <path d="M9 12h6M9 16h4"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/check-in',
    label: 'Check-in',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/analytics',
    label: 'Stats',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6"
          stroke={active ? 'var(--c1)' : 'rgba(255,255,255,0.25)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export function PanelNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#1A1A2E',
        paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-around pt-2 px-2">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[60px] py-1
                         transition-transform duration-[180ms] active:scale-90"
            >
              {item.icon(active)}
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? 'var(--c1)' : 'rgba(255,255,255,0.25)' }}
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
