import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware del panel del negocio.
 * - Todas las rutas excepto /login requieren sesión de staff.
 * - Refresca la sesión en cada request.
 */
export async function middleware(request: NextRequest) {
  // Dev-only preview bypass — solo activo si explicitamente habilitado por env
  // y nunca en producción. Usarlo requiere `ENABLE_DEV_PREVIEW=1` en .env.local
  const isDevPreview =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEV_PREVIEW === '1' &&
    request.nextUrl.searchParams.has('preview')
  if (isDevPreview) {
    const reqHeaders = new Headers(request.headers)
    reqHeaders.set('x-dev-preview', '1')
    return NextResponse.next({ request: { headers: reqHeaders } })
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = pathname === '/'
    || pathname === '/login'
    || pathname === '/terms'
    || pathname === '/privacy'
    || pathname === '/join'
    || pathname.startsWith('/onboarding')
    || pathname.startsWith('/accept-invite')
    || pathname.startsWith('/api/onboarding')
    || pathname.startsWith('/api/demo-requests')
    || pathname.startsWith('/api/staff/invites/accept')
    || pathname.startsWith('/api/health')
    || pathname.startsWith('/api/webhooks')
    || pathname.startsWith('/api/auth/signout')
    || pathname.startsWith('/api/debug-admin')

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Si el user ya tiene sesión y va al login, lo mandamos al dashboard.
  // La landing pública (/) queda visible siempre — el nav del hero tiene
  // el botón contextual "Ir al dashboard" cuando hay sesión.
  if (user && pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Gate de billing: usa service role (createServerClient compatible con Edge)
  // para evitar recursión RLS en staff_users
  const isDashboardRoute = pathname.startsWith('/dashboard') && pathname !== '/dashboard/billing'
  if (user && isDashboardRoute) {
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      },
    )
    const { data: staffUser } = await adminClient
      .from('staff_users')
      .select('venue_id')
      .eq('id', user.id)
      .maybeSingle()

    if (staffUser) {
      const { data: hasAccess } = await adminClient
        .rpc('venue_has_access', { vid: staffUser.venue_id })

      if (!hasAccess) {
        const billingUrl = request.nextUrl.clone()
        billingUrl.pathname = '/dashboard/billing'
        return NextResponse.redirect(billingUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
