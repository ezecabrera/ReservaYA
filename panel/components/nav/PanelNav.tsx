'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar, Ic, ThemeSwitch } from '@/components/ui/brand'

/* ============================================================
   Sidebar nuevo (handoff Claude Design 2026-04-24)
   Logo pastel lilac + lista simple + turno staff + theme toggle.
   Bottom nav mobile para <lg.
   ============================================================ */

const ITEMS = [
  { href: '/dashboard',           label: 'Dashboard', icon: Ic.dash },
  { href: '/dashboard/mesas',     label: 'Mesas',     icon: Ic.tables },
  { href: '/dashboard/reservas',  label: 'Reservas',  icon: Ic.reserva },
  { href: '/dashboard/menu',      label: 'Menú',      icon: Ic.book },
  { href: '/dashboard/crm',       label: 'CRM',       icon: Ic.crm },
  { href: '/dashboard/campaigns', label: 'Campañas',  icon: Ic.camp },
  { href: '/dashboard/analytics', label: 'Stats',     icon: Ic.stats },
  { href: '/dashboard/handoff',   label: 'Handoff',   icon: Ic.chat },
  { href: '/dashboard/billing',   label: 'Plan',      icon: Ic.plan },
  { href: '/dashboard/config',    label: 'Config',    icon: Ic.settings },
  { href: '/dashboard/ayuda',     label: 'Ayuda',     icon: Ic.help },
] as const

type NavItem = (typeof ITEMS)[number]

const STAFF_DEMO: Array<{ name: string; role: string }> = [
  { name: 'Lucía M.', role: 'Encargada' },
  { name: 'Camila W.', role: 'Mozo' },
  { name: 'Javier P.', role: 'Runner' },
]

export function PanelNav() {
  const pathname = usePathname()
  return (
    <>
      <BottomNav pathname={pathname} />
      <SidebarNav pathname={pathname} />
    </>
  )
}

function BottomNav({ pathname }: { pathname: string }) {
  const MOBILE = [
    '/dashboard',
    '/dashboard/mesas',
    '/dashboard/crm',
    '/dashboard/analytics',
    '/dashboard/config',
  ]
  const items = ITEMS.filter((i) => MOBILE.includes(i.href as string))
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'var(--bg-2)',
        borderColor: 'var(--line)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around pt-2 px-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[60px] py-1 transition-transform duration-[180ms] active:scale-90"
              style={{ color: active ? 'var(--text)' : 'var(--text-3)' }}
            >
              <Icon style={{ color: 'currentColor' }} />
              <span className="caps" style={{ color: 'currentColor', fontSize: 9 }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 z-40 w-[220px] flex-col border-r"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center gap-2" style={{ padding: '20px 22px' }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'var(--p-lilac)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontStyle: 'italic',
            color: '#1A1B1F',
            fontSize: 16,
            letterSpacing: '-0.04em',
          }}
          aria-hidden
        >
          u
        </div>
        <div className="fr-900" style={{ fontSize: 20, color: 'var(--text)' }}>
          UnToque
        </div>
      </div>

      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
        {ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>

      <div style={{ padding: '16px 16px 20px', borderTop: '1px solid var(--line)' }}>
        <div className="caps" style={{ marginBottom: 10 }}>
          Turno
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {STAFF_DEMO.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar name={s.name} size={22} />
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.name}</span>
            </div>
          ))}
        </div>
        <ThemeSwitch />
      </div>
    </aside>
  )
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        margin: '2px 0',
        color: active ? 'var(--text)' : 'var(--text-2)',
        background: active ? 'var(--surface-2)' : 'transparent',
        borderRadius: 'calc(var(--r) * 0.5)',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        textDecoration: 'none',
        transition: 'background 120ms, color 120ms',
      }}
    >
      <Icon style={{ color: active ? 'var(--text)' : 'var(--text-3)' }} />
      <span>{item.label}</span>
    </Link>
  )
}

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}
