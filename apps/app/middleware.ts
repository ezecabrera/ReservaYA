import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware de la PWA cliente.
 * - Holding page: si ENABLE_HOLDING_PAGE != '0', redirige todo a /proximamente
 *   salvo que exista la cookie `preview_access=1` (la setea el botón de la
 *   holding page por 60 segundos). Para abrir el sitio al público, setear
 *   ENABLE_HOLDING_PAGE=0 en Vercel y redeployar.
 * - Preview: si el usuario está en preview y quiere llegar a rutas que
 *   requieren auth o procesan un pago, lo mandamos a /preview-limite con un
 *   mensaje explicativo (en vez de /login, que sería confuso).
 * - Refresca la sesión de Supabase en cada request.
 * - Las rutas de reserva requieren auth (redirect a /login si no hay sesión).
 */

/** Rutas que requieren producto "de verdad" (auth, pago, etc.).
 *  En preview mode se interceptan y van a /preview-limite. */
const PREVIEW_BLOCKED_PATHS = [
  '/login',
  '/recuperar',
  '/onboarding',
  '/mis-reservas',
  '/perfil/configuracion',
  '/reserva/confirmar',
]

/** Patrones de rutas dinámicas que también se bloquean en preview. */
const PREVIEW_BLOCKED_PATTERNS = [
  /^\/reserva\/[^/]+\/pagar$/,
  /^\/reserva\/[^/]+\/confirmacion$/,
]

function isPreviewBlocked(pathname: string): boolean {
  if (PREVIEW_BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return true
  }
  return PREVIEW_BLOCKED_PATTERNS.some((re) => re.test(pathname))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Holding page ────────────────────────────────────────────────────────
  const holdingEnabled = process.env.ENABLE_HOLDING_PAGE !== '0'
  const hasPreviewCookie =
    request.cookies.get('preview_access')?.value === '1'
  const isHoldingPath = pathname === '/proximamente'
  const isPreviewLimitPath = pathname === '/preview-limite'
  const isExemptPath =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/offline'

  if (
    holdingEnabled &&
    !hasPreviewCookie &&
    !isHoldingPath &&
    !isPreviewLimitPath &&
    !isExemptPath
  ) {
    const holdingUrl = request.nextUrl.clone()
    holdingUrl.pathname = '/proximamente'
    holdingUrl.search = ''
    return NextResponse.redirect(holdingUrl)
  }

  // ── Bloqueo de rutas sensibles en preview ───────────────────────────────
  if (hasPreviewCookie && !isPreviewLimitPath && isPreviewBlocked(pathname)) {
    const limitUrl = request.nextUrl.clone()
    limitUrl.pathname = '/preview-limite'
    limitUrl.search = ''
    return NextResponse.redirect(limitUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refrescar sesión — crítico para que los Server Components tengan auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas que requieren autenticación de cliente
  const protectedRoutes = ['/reserva/confirmar', '/mis-reservas']
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
