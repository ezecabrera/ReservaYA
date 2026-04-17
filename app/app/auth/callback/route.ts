import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /auth/callback?code=...&redirect=/
 *
 * Endpoint de retorno de OAuth (Google). Supabase redirige acá después
 * del consentimiento del usuario en Google. Intercambiamos el code por
 * una sesión y redirigimos al destino final.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const redirect = url.searchParams.get('redirect') ?? '/'
  const error = url.searchParams.get('error')
  const errorDesc = url.searchParams.get('error_description')

  if (error) {
    const msg = encodeURIComponent(errorDesc ?? error)
    return NextResponse.redirect(new URL(`/login?error=${msg}`, url.origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Falta+el+código+de+autenticación', url.origin))
  }

  const supabase = await createClient()
  const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.session) {
    const msg = encodeURIComponent(exchangeError?.message ?? 'No se pudo completar el login')
    return NextResponse.redirect(new URL(`/login?error=${msg}`, url.origin))
  }

  try {
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } },
    )
    const u = data.user
    const name =
      (u?.user_metadata?.full_name as string | undefined) ??
      (u?.user_metadata?.name as string | undefined) ??
      u?.email?.split('@')[0] ??
      'Usuario'

    if (u) {
      await admin.from('users').upsert(
        { id: u.id, email: u.email ?? null, phone: u.phone ?? null, name },
        { onConflict: 'id', ignoreDuplicates: false },
      )
    }
  } catch {
    // No bloquear el login si la sincronización falla
  }

  return NextResponse.redirect(new URL(redirect, url.origin))
}
