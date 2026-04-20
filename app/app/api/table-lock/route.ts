import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * POST /api/table-lock
 * Body: { table_id: string }
 * Crea un lock de selección (3 min) sobre la mesa.
 *
 * Usa admin client (service_role) porque el wizard permite seleccionar mesa
 * ANTES del login (se pide login recién al confirmar). Con el cliente anon,
 * la policy RLS table_locks_auth_insert rechaza (auth.uid() IS NULL).
 * Este endpoint es el único path para insertar locks, así que el control
 * sigue siendo a través de esta route.
 */

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

export async function POST(request: NextRequest) {
  const admin = adminClient()

  const body = await request.json() as { table_id: string }
  if (!body.table_id) {
    return NextResponse.json({ error: 'table_id requerido' }, { status: 400 })
  }

  // Limpiar locks expirados (RPC existe server-side con security definer)
  await admin.rpc('cleanup_expired_locks')

  // Verificar que no haya lock activo sobre esta mesa
  const { data: existingLock } = await admin
    .from('table_locks')
    .select('id, expires_at')
    .eq('table_id', body.table_id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existingLock) {
    return NextResponse.json(
      { error: 'Mesa temporalmente reservada por otro usuario', expires_at: existingLock.expires_at },
      { status: 409 },
    )
  }

  const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()

  const { data: lock, error } = await admin
    .from('table_locks')
    .insert({
      table_id: body.table_id,
      type: 'selection',
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(lock)
}

/** DELETE /api/table-lock?lock_id= — liberar lock si el usuario cancela */
export async function DELETE(request: NextRequest) {
  const lockId = request.nextUrl.searchParams.get('lock_id')
  if (!lockId) return NextResponse.json({ ok: true })

  const admin = adminClient()
  await admin.from('table_locks').delete().eq('id', lockId)

  return NextResponse.json({ ok: true })
}
