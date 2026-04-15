import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/staff — lista el staff del venue (solo owners/managers) */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: me } = await supabase
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!me || !['owner', 'manager'].includes(me.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data } = await supabase
    .from('staff_users')
    .select('id, name, email, role, created_at')
    .eq('venue_id', me.venue_id)
    .order('created_at')

  return NextResponse.json(data ?? [])
}

/** PATCH /api/staff — actualiza el rol de un miembro (solo owner) */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: me } = await supabase
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!me || me.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el owner puede cambiar roles' }, { status: 403 })
  }

  const body = await request.json() as { id: string; role: string }
  if (body.id === user.id) {
    return NextResponse.json({ error: 'No podés cambiar tu propio rol' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('staff_users')
    .update({ role: body.role })
    .eq('id', body.id)
    .eq('venue_id', me.venue_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
