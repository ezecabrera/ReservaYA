import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET  /api/venue/events       — lista eventos del venue del user logueado
 * POST /api/venue/events       — crea un evento (solo owner/manager)
 */

const VALID_TYPES = ['show', 'dj', 'karaoke', 'teatro', 'gastronomia', 'otro']

async function requireStaff(userId: string, allowedRoles: string[] = ['owner', 'manager']) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', userId)
    .single()
  if (!data || !allowedRoles.includes(data.role)) return null
  return { venueId: data.venue_id as string, role: data.role as string }
}

function isTableMissing(msg: string) {
  return msg.includes('does not exist') || msg.includes('schema cache')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const staff = await requireStaff(user.id, ['owner', 'manager', 'receptionist'])
  if (!staff) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('venue_events')
    .select('*')
    .eq('venue_id', staff.venueId)
    .order('event_date', { ascending: true })

  if (error) {
    if (isTableMissing(error.message)) return NextResponse.json([])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const staff = await requireStaff(user.id)
  if (!staff) return NextResponse.json({ error: 'Solo owner/manager' }, { status: 403 })

  const body = await req.json().catch(() => null) as {
    title?: string
    description?: string
    date?: string
    time?: string
    type?: string
    coverCharge?: number | null
  } | null

  if (!body?.title || !body.date || !body.time || !body.type) {
    return NextResponse.json({ error: 'Campos requeridos: title, date, time, type' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: 'Tipo de evento inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('venue_events')
    .insert({
      venue_id: staff.venueId,
      title: body.title.trim().slice(0, 200),
      description: body.description?.trim().slice(0, 2000) || null,
      event_date: body.date,
      event_time: body.time,
      event_type: body.type,
      cover_charge: body.coverCharge ?? null,
      is_published: true,
    })
    .select('*')
    .single()

  if (error) {
    if (isTableMissing(error.message)) {
      return NextResponse.json(
        { error: 'Aplicá la migración 009 en Supabase primero.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
