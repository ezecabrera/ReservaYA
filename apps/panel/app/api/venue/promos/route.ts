import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

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
    .from('venue_promos')
    .select('*')
    .eq('venue_id', staff.venueId)
    .order('valid_from', { ascending: false })

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
    discountPct?: number | null
    discountAmount?: number | null
    validFrom?: string
    validUntil?: string
    days?: number[]
  } | null

  if (!body?.title || !body.validFrom || !body.validUntil) {
    return NextResponse.json({ error: 'Campos requeridos: title, validFrom, validUntil' }, { status: 400 })
  }
  if (body.discountPct && body.discountAmount) {
    return NextResponse.json({ error: 'Elegí tipo % o monto fijo, no ambos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('venue_promos')
    .insert({
      venue_id: staff.venueId,
      title: body.title.trim().slice(0, 200),
      description: body.description?.trim().slice(0, 2000) || null,
      discount_pct: body.discountPct ?? null,
      discount_amount: body.discountAmount ?? null,
      valid_from: body.validFrom,
      valid_until: body.validUntil,
      days_of_week: body.days ?? [0,1,2,3,4,5,6],
      is_active: true,
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
