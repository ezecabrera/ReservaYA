import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/** DELETE /api/staff/[id] — elimina un miembro del staff (solo owner) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: me } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!me || me.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el owner puede eliminar staff' }, { status: 403 })
  }

  if (params.id === user.id) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
  }

  const { error } = await admin
    .from('staff_users')
    .delete()
    .eq('id', params.id)
    .eq('venue_id', me.venue_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
