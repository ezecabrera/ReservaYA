import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/staff/invites/accept
 *
 * Acepta una invitación al equipo. Dos flujos:
 *   - token en URL: vino por email, ya está en la URL completa
 *   - code por WhatsApp: el user lo pega en /join
 *
 * Requiere: sesión activa (user ya creó su cuenta en Supabase Auth).
 * El email de la sesión debe coincidir con el email de la invitación.
 */

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`invite-accept:${ip}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá un minuto.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null) as {
    token?: string
    code?: string
  } | null

  if (!body || (!body.token && !body.code)) {
    return NextResponse.json({ error: 'Falta token o código' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Iniciá sesión primero' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Buscar la invitación por token o código
  const query = admin.from('staff_invitations').select('*').eq('status', 'pending')
  const { data: invites } = body.token
    ? await query.eq('token', body.token).limit(1)
    : await query.eq('code', body.code).limit(1)

  const invite = invites?.[0]
  if (!invite) {
    return NextResponse.json({ error: 'Invitación no encontrada o vencida' }, { status: 404 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    await admin.from('staff_invitations').update({ status: 'expired' }).eq('id', invite.id)
    return NextResponse.json({ error: 'La invitación venció. Pedile al owner una nueva.' }, { status: 410 })
  }

  // Validar que el email del user coincide con el de la invitación
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: `Esta invitación es para ${invite.email}. Iniciá sesión con esa cuenta.` },
      { status: 403 },
    )
  }

  // Crear staff_user vinculado al venue de la invitación
  const { error: insertError } = await admin
    .from('staff_users')
    .upsert({
      id: user.id,
      venue_id: invite.venue_id,
      email: user.email,
      name: invite.name ?? (user.user_metadata?.name as string | undefined) ?? user.email.split('@')[0],
      role: invite.role,
    }, { onConflict: 'id' })

  if (insertError) {
    console.error('[invites/accept] staff_users insert:', insertError.message)
    return NextResponse.json({ error: 'No pudimos sumarte al equipo' }, { status: 500 })
  }

  // Marcar la invitación como aceptada
  await admin
    .from('staff_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ ok: true, venueId: invite.venue_id })
}
