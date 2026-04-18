'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NewReservationTrigger } from '@/components/reservas/NewReservationTrigger'

/**
 * Left sidebar navigation para desktop (≥ lg).
 *
 * Estilo CosyPOS reference:
 *   - Brand arriba con logo + wordmark
 *   - Menu items sin iconos, texto only, con active state
 *   - Shift section abajo con avatars del staff en piso
 *   - Width fijo 240px, border-right sutil
 *
 * Se oculta en < lg donde aparece el bottom nav (PanelNav).
 */

interface NavItem {
  href: string
  label: string
}

const ITEMS: NavItem[] = [
  { href: '/dashboard',           label: 'Piso' },
  { href: '/dashboard/reservas',  label: 'Reservas' },
  { href: '/dashboard/crm',       label: 'Comensales' },
  { href: '/dashboard/menu',      label: 'Menú' },
  { href: '/check-in',            label: 'Check-in' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/billing',   label: 'Plan' },
  { href: '/dashboard/config',    label: 'Config' },
]

/** Avatar inicial con color según hash del nombre. */
function avatarColor(name: string): string {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  const palette = ['#A13143', '#4F8A5F', '#C99130', '#D66A3F', '#8565C4', '#4678C4']
  return palette[Math.abs(h) % palette.length]
}

interface Props {
  staffOnShift?: Array<{ name: string; id: string }>
  venueName?: string
}

export function DesktopSidebar({ staffOnShift = [], venueName }: Props) {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex flex-col w-[240px] flex-shrink-0
                 bg-ink border-r border-ink-line
                 h-screen sticky top-0"
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-ink-line">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-wine flex items-center justify-center
                          shadow-[0_3px_10px_-2px_rgba(161,49,67,0.55)]">
            <span className="font-display font-bold text-[13px] text-white">R</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-bold text-[14px] text-ink-text tracking-tight">
              ReservaYa
            </span>
            {venueName && (
              <span className="text-[10.5px] text-ink-text-3 truncate max-w-[160px]">
                {venueName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nueva reserva — CTA persistente siempre visible */}
      <div className="px-4 pt-4">
        <NewReservationTrigger variant="pill" />
      </div>

      {/* Menu items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {ITEMS.map((item) => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-[13px] font-medium
                          transition-colors
                          ${active
                            ? 'bg-ink-3 text-ink-text'
                            : 'text-ink-text-2 hover:text-ink-text hover:bg-ink-2'}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Shift */}
      {staffOnShift.length > 0 && (
        <div className="px-5 py-4 border-t border-ink-line">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-text-3 mb-2.5">
            En piso
          </p>
          <div className="space-y-1.5">
            {staffOnShift.map((s) => {
              const initial = s.name[0]?.toUpperCase() ?? '?'
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center
                               font-bold text-[10.5px] text-white"
                    style={{ background: avatarColor(s.name) }}
                  >
                    {initial}
                  </span>
                  <span className="text-[12px] text-ink-text-2 truncate">
                    {s.name.split(' ')[0]} {s.name.split(' ')[1]?.[0] ?? ''}.
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-5 py-3 border-t border-ink-line">
        <p className="text-[10px] text-ink-text-3">© 2026 ReservaYa</p>
      </div>
    </aside>
  )
}
