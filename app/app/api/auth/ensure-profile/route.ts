import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/auth/ensure-profile
 * Crea el registro en public.users si no existe todavía.
 * Se llama desde el cliente después de login o signup con email+password.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )

  const name: string =
    (user.user_metadata?.name as string | undefined)
    ?? user.email?.split('@')[0]
    ?? 'Usuario'

  const { error } = await admin.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
