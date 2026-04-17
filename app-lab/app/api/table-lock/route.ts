import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/table-lock
 * Body: { table_id: string }
 * Crea un lock de selección (3 min) sobre la mesa.
 * Llama a la función PostgreSQL lock_table_for_selection que usa SELECT FOR UPDATE.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json() as { table_id: string }

  if (!body.table_id) {
    return NextResponse.json({ error: 'table_id requerido' }, { status: 400 })
  }

  // Limpiar locks expirados antes de intentar
  await supabase.rpc('cleanup_expired_locks')

  // Verificar que no haya lock activo
  const { data: existingLock } = await supabase
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

  const { data: lock, error } = await supabase
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

  const supabase = await createClient()
  await supabase.from('table_locks').delete().eq('id', lockId)

  return NextResponse.json({ ok: true })
}
