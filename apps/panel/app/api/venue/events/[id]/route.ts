import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

async function requireOwnerManager(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', userId)
    .single()
  if (!data || !['owner', 'manager'].includes(data.role)) return null
  return { venueId: data.venue_id as string }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const staff = await requireOwnerManager(user.id)
  if (!staff) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (typeof body.title === 'string') patch.title = body.title.trim().slice(0, 200)
  if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 2000) || null
  if (typeof body.date === 'string') patch.event_date = body.date
  if (typeof body.time === 'string') patch.event_time = body.time
  if (typeof body.type === 'string') patch.event_type = body.type
  if ('coverCharge' in body) patch.cover_charge = body.coverCharge ?? null
  if (typeof body.isPublished === 'boolean') patch.is_published = body.isPublished

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('venue_events')
    .update(patch)
    .eq('id', params.id)
    .eq('venue_id', staff.venueId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const staff = await requireOwnerManager(user.id)
  if (!staff) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('venue_events')
    .delete()
    .eq('id', params.id)
    .eq('venue_id', staff.venueId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
