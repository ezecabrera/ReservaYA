'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { NotificationsSheet, useUnreadCount } from '@/components/lab/NotificationsSheet'
import { usePreviewMode } from '@/lib/preview'

/**
 * DesktopShell — layout exclusivo desktop (≥1024px) para la PWA cliente.
 *
 * En <1024px: renderiza `{children}` sin envolverlo (mobile intacto).
 * En ≥1024px: sidebar oscura fija a la izquierda + topbar sticky + content
 *             centrado. Contenido respira `lg:ml-[260px]` para que el BottomNav
 *             mobile se oculte y la sidebar ocupe su lugar.
 *
 * Ocultar el bottom nav mobile en desktop: `.lg:hidden` en el componente BottomNav.
 */

interface NavItem {
  href: string
  label: string
  icon: (color: string) => React.ReactNode
  match?: (pathname: string) => boolean
  badge?: number
}

const CORAL = '#FF4757'
const CORAL_HOVER = '#ED3847'

const DESCUBRIR: NavItem[] = [
  {
    href: '/',
    label: 'Inicio',
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5l9-7 9 7v10a1.5 1.5 0 01-1.5 1.5h-4.5v-7h-6v7H4.5A1.5 1.5 0 013 20.5v-10z"
          stroke={c} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    match: (p) => p === '/',
  },
  {
    href: '/buscar',
    label: 'Explorar',
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={c} strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    match: (p) => p.startsWith('/buscar'),
  },
  {
    href: '/guias',
    label: 'Guías',
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 4.5A1.5 1.5 0 015.5 3H19a1 1 0 011 1v15.5A1.5 1.5 0 0118.5 21H6a2 2 0 01-2-2V4.5z"
          stroke={c} strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 7h7M9 11h7M9 15h4" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    match: (p) => p.startsWith('/guias'),
  },
]

const CUENTA: NavItem[] = [
  {
    href: '/mis-reservas',
    label: 'Mis reservas',
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="16" height="16" rx="2" stroke={c} strokeWidth="2" />
        <path d="M8 3v4M16 3v4M4 11h16" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    match: (p) => p.startsWith('/mis-reservas'),
  },
  {
    href: '/favoritos',
    label: 'Favoritos',
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 20.5s-7.5-4.1-7.5-9.5A4.5 4.5 0 0112 6.5 4.5 4.5 0 0119.5 11c0 5.4-7.5 9.5-7.5 9.5z"
          stroke={c} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    match: (p) => p.startsWith('/favoritos'),
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (c) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="2" />
        <path d="M4 21a8 8 0 0116 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    match: (p) => p.startsWith('/perfil'),
  },
]

// Rutas donde NO queremos mostrar el shell (onboarding, auth, embed, legal)
const EXCLUDED_PREFIXES = ['/login', '/recuperar', '/onboarding', '/embed', '/terms', '/privacy', '/offline']

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const hideShell = EXCLUDED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const [notifsOpen, setNotifsOpen] = useState(false)
  const unreadCount = useUnreadCount()
  const isPreview = usePreviewMode()

  if (hideShell) {
    // Paginas que ya son standalone (no queremos sidebar dentro del login, etc.)
    return <>{children}</>
  }

  return (
    <>
      {/* Sidebar — solo en lg+ */}
      <aside
        className="hidden lg:flex dk-side fixed left-0 top-0 h-screen flex-col overflow-y-auto z-40"
        style={{ width: 'var(--dk-side-w, 260px)', padding: '22px 16px' }}
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 px-1 pb-5 no-underline">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-display text-white"
            style={{
              background: 'linear-gradient(135deg, #FF4757 0%, #FF7A6B 100%)',
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            U
          </div>
          <div className="leading-tight">
            <div className="font-display text-white text-[18px] font-black tracking-tight">
              UnToque
            </div>
            <div className="text-[10px] text-white/40 tracking-[0.16em] uppercase font-bold">
              Desktop
            </div>
          </div>
        </Link>

        <div className="section-label">Descubrir</div>
        <nav className="flex flex-col gap-1">
          {DESCUBRIR.map(it => {
            const active = it.match ? it.match(pathname) : pathname === it.href
            return (
              <Link key={it.href} href={it.href} className={`nav-item no-underline ${active ? 'active' : ''}`}>
                {it.icon('currentColor')}
                {it.label}
              </Link>
            )
          })}
        </nav>

        <div className="section-label">Tu cuenta</div>
        <nav className="flex flex-col gap-1">
          {CUENTA.map(it => {
            const active = it.match ? it.match(pathname) : pathname === it.href
            return (
              <Link key={it.href} href={it.href} className={`nav-item no-underline ${active ? 'active' : ''}`}>
                {it.icon('currentColor')}
                {it.label}
                {it.badge ? <span className="badge">{it.badge}</span> : null}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto" />

        {/* Footer de sidebar — link a terms/privacy */}
        <div className="pt-5 mt-4 border-t border-white/[0.08] flex items-center justify-between gap-2 text-[11px]">
          <Link href="/terms" className="text-white/40 hover:text-white/70 no-underline">Términos</Link>
          <Link href="/privacy" className="text-white/40 hover:text-white/70 no-underline">Privacidad</Link>
        </div>
      </aside>

      {/* Wrapper del contenido — en lg, se empuja 260px a la derecha */}
      <div className="lg:ml-[260px]">
        <DesktopTopbar
          pathname={pathname}
          onNotificationsClick={() => setNotifsOpen(true)}
          unreadCount={unreadCount}
          hideActions={isPreview}
        />
        {children}
      </div>

      {/* Sheet de notificaciones del desktop — el mobile tiene el suyo en HomeClient.
          El sheet ajusta a modal centrado-derecha en lg+ via clases del propio sheet. */}
      <NotificationsSheet open={notifsOpen} onClose={() => setNotifsOpen(false)} />
    </>
  )
}

function DesktopTopbar({
  pathname,
  onNotificationsClick,
  unreadCount,
  hideActions = false,
}: {
  pathname: string
  onNotificationsClick: () => void
  unreadCount: number
  /** Si `true`, oculta search, notificaciones y botón Reservar (modo preview). */
  hideActions?: boolean
}) {
  const titleMap: Record<string, string> = {
    '/': 'Inicio',
    '/buscar': 'Explorar restaurantes',
    '/guias': 'Guías curadas',
    '/mis-reservas': 'Mis reservas',
    '/favoritos': 'Favoritos',
    '/perfil': 'Tu perfil',
  }
  const title = titleMap[pathname] ?? (pathname.startsWith('/') ? 'Restaurante' : 'Inicio')

  return (
    <header
      className="hidden lg:flex sticky top-0 z-30 items-center gap-4 bg-bg/85 backdrop-blur-md border-b border-[rgba(0,0,0,0.07)]"
      style={{ padding: '14px 40px', height: 'var(--dk-topbar-h)' }}
    >
      <nav className="flex items-center gap-1.5 text-[13px] font-semibold text-tx3">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M3 10.5l9-7 9 7v10a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 20.5v-10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <span>/</span>
        <span className="text-tx">{title}</span>
      </nav>

      {!hideActions && <div className="flex-1 flex items-center max-w-[520px]">
        <label
          htmlFor="dk-topbar-search"
          className="flex-1 flex items-center gap-2.5 bg-sf border border-[rgba(0,0,0,0.08)] rounded-md px-3.5 py-2.5 text-tx3 hover:border-[#FF4757]/30 transition-colors cursor-text"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="dk-topbar-search"
            type="search"
            placeholder="Buscar restaurantes, barrios, cocina…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-tx placeholder:text-tx3 font-body"
            onFocus={(e) => {
              // Dejamos la search inline por ahora — si el user ya navegó a buscar, deep-link directo.
              // Futuro: abrir un command-k modal.
              e.currentTarget.blur()
              window.location.href = '/buscar'
            }}
          />
          <span className="hidden xl:inline text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-bg border border-[rgba(0,0,0,0.08)] text-tx3">
            ⌘K
          </span>
        </label>
      </div>}

      {hideActions && <div className="flex-1" />}

      {!hideActions && <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative w-10 h-10 rounded-md bg-sf border border-[rgba(0,0,0,0.08)] text-tx hover:bg-sf2 flex items-center justify-center transition-colors"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 8a6 6 0 1112 0v4l1.5 3h-15L6 12V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 18a3 3 0 006 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ background: '#FF4757', border: '2px solid var(--bg, white)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#FF4757] hover:bg-[#ED3847] text-white font-semibold text-[13px] transition-colors no-underline"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l2.5 5.5L20 9l-4.5 4 1 6-4.5-2.5L7 19l1-6L3.5 9l5.5-.5L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Reservar
        </Link>
      </div>}
    </header>
  )
}
