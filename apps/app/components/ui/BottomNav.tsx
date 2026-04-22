'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke={active ? 'var(--c1)' : 'var(--tx3)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M9 21V12h6v9" stroke={active ? 'var(--c1)' : 'var(--tx3)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/favoritos',
    label: 'Favoritos',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill={active ? 'var(--c1)' : 'none'} viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          stroke={active ? 'var(--c1)' : 'var(--tx3)'} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/mis-reservas',
    label: 'Reservas',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"
          stroke={active ? 'var(--c1)' : 'var(--tx3)'} strokeWidth="2" />
        <path d="M16 2v4M8 2v4M3 10h18"
          stroke={active ? 'var(--c1)' : 'var(--tx3)'}
          strokeWidth="2" strokeLinecap="round" />
        {active && <circle cx="12" cy="15" r="1.5" fill="var(--c1)" />}
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4"
          stroke={active ? 'var(--c1)' : 'var(--tx3)'} strokeWidth="2" />
        <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
          stroke={active ? 'var(--c1)' : 'var(--tx3)'}
          strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--br)]
                 bg-bg/95 backdrop-blur-md"
      style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around pt-1.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[60px] py-1
                         transition-transform duration-[180ms] active:scale-90"
            >
              {item.icon(active)}
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? 'var(--c1)' : 'var(--tx3)' }}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-c1" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
