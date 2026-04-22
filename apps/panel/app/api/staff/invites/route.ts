import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { randomBytes } from 'node:crypto'

/**
 * GET    /api/staff/invites        — lista invitaciones del venue del owner logueado
 * POST   /api/staff/invites        — crea una invitación (solo owner)
 *
 * Las invitaciones tienen dos canales:
 *   - email: Supabase Auth puede mandar un magic link con el token
 *   - code:  string UN-TOQUE-XXXXX para compartir por WhatsApp
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = ['owner', 'manager', 'receptionist']

function generateToken(): string {
  return randomBytes(24).toString('base64url')
}

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `UN-TOQUE-${s}`
}

async function getOwnerVenue(userId: string): Promise<{ venue_id: string; email: string } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('staff_users')
    .select('venue_id, email, role')
    .eq('id', userId)
    .single()
  if (!data || data.role !== 'owner') return null
  return { venue_id: data.venue_id, email: data.email }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!staffUser || !['owner', 'manager'].includes(staffUser.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: invites, error } = await admin
    .from('staff_invitations')
    .select('id, email, name, role, status, code, expires_at, created_at')
    .eq('venue_id', staffUser.venue_id)
    .in('status', ['pending'])
    .order('created_at', { ascending: false })

  // Fallback si la tabla no existe aún
  if (error && (error.message.includes('does not exist') || error.message.includes('schema cache'))) {
    return NextResponse.json([])
  }
  if (error) {
    console.error('[staff/invites][GET]', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  return NextResponse.json(invites ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const owner = await getOwnerVenue(user.id)
  if (!owner) return NextResponse.json({ error: 'Solo el owner puede invitar' }, { status: 403 })

  const body = await req.json().catch(() => null) as {
    email?: string
    name?: string
    role?: string
  } | null

  if (!body) return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })

  const email = (body.email ?? '').trim().toLowerCase()
  const name = (body.name ?? '').trim().slice(0, 120) || null
  const role = (body.role ?? '').trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }
  if (email === owner.email) {
    return NextResponse.json({ error: 'Ese email ya está en el equipo' }, { status: 400 })
  }

  const admin = createAdminClient()
  const token = generateToken()
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString()

  const { data: inserted, error } = await admin
    .from('staff_invitations')
    .insert({
      venue_id: owner.venue_id,
      invited_by: user.id,
      email,
      name,
      role,
      token,
      code,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id, email, name, role, status, code, expires_at, created_at')
    .single()

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('does not exist') || msg.includes('schema cache')) {
      return NextResponse.json(
        { error: 'La tabla de invitaciones aún no está aplicada. Aplicá la migración 008 en Supabase.' },
        { status: 503 },
      )
    }
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Ya existe una invitación para ese email.' }, { status: 409 })
    }
    console.error('[staff/invites][POST]', msg)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  // TODO: integrar Supabase Auth admin.inviteUserByEmail o Resend
  // Por ahora la invitación existe en DB, el owner copia el código para WhatsApp.

  return NextResponse.json(inserted)
}
