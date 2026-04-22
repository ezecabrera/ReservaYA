import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * DELETE  /api/staff/invites/:id  — cancelar invitación (solo owner)
 * PATCH   /api/staff/invites/:id  — acciones: resend / cancel / regenerate-code
 */

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!staffUser || staffUser.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el owner puede cancelar invitaciones' }, { status: 403 })
  }

  const { error } = await admin
    .from('staff_invitations')
    .update({ status: 'cancelled' })
    .eq('id', params.id)
    .eq('venue_id', staffUser.venue_id)

  if (error) {
    console.error('[staff/invites][DELETE]', error.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null) as { action?: string } | null
  const action = body?.action

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, role')
    .eq('id', user.id)
    .single()

  if (!staffUser || staffUser.role !== 'owner') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  if (action === 'resend') {
    const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString()
    const { error } = await admin
      .from('staff_invitations')
      .update({ expires_at: expiresAt })
      .eq('id', params.id)
      .eq('venue_id', staffUser.venue_id)
      .eq('status', 'pending')

    if (error) return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
}
