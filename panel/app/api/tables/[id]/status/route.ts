import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * PATCH /api/tables/[id]/status
 * Body: { is_occupied: boolean }
 * Solo staff del venue puede ejecutar esta acción.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json() as { is_occupied: boolean }

  const admin = createAdminClient()

  // Verificar que el staff pertenece al mismo venue que la mesa
  const [tableResult, staffResult] = await Promise.all([
    admin.from('tables').select('venue_id').eq('id', params.id).single(),
    admin.from('staff_users').select('venue_id').eq('id', user.id).single(),
  ])

  const table = tableResult.data
  const staffUser = staffResult.data

  if (!table) return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })
  if (!staffUser || staffUser.venue_id !== table.venue_id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('tables')
    .update({ is_occupied: body.is_occupied })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
