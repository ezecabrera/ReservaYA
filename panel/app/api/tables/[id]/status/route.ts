import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Verificar que la mesa pertenece al venue del staff
  const { data: table } = await supabase
    .from('tables')
    .select('venue_id')
    .eq('id', params.id)
    .single()

  if (!table) return NextResponse.json({ error: 'Mesa no encontrada' }, { status: 404 })

  const isStaff = await supabase.rpc('is_staff_of', { vid: table.venue_id })
  if (!isStaff.data) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data, error } = await supabase
    .from('tables')
    .update({ is_occupied: body.is_occupied })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
