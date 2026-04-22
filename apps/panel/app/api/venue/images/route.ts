import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * GET  /api/venue/images   — lista imágenes del venue
 * POST /api/venue/images   — agrega metadata de imagen ya subida a Storage
 *                            (la subida del archivo se hace client-side con
 *                            supabase-js contra el bucket 'venue-content')
 */

async function requireStaff(userId: string, allowedRoles: string[] = ['owner', 'manager']) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', userId)
    .single()
  if (!data || !allowedRoles.includes(data.role)) return null
  return { venueId: data.venue_id as string }
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
    .from('venue_images')
    .select('*')
    .eq('venue_id', staff.venueId)
    .order('sort_order', { ascending: true })

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
    storagePath?: string
    caption?: string
    sortOrder?: number
  } | null

  if (!body?.storagePath) {
    return NextResponse.json({ error: 'Falta storagePath' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('venue_images')
    .insert({
      venue_id: staff.venueId,
      storage_path: body.storagePath,
      caption: body.caption?.trim().slice(0, 500) || null,
      sort_order: body.sortOrder ?? 0,
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
