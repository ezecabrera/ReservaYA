import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * POST /api/ratings/[id]/dispute
 * Apela una rating.
 *
 * Permisos:
 *   - Staff del venue puede apelar ratings direction='user_to_venue' (que los afectan públicamente)
 *   - Si la reserva tiene user_id, ese user puede apelar ratings direction='venue_to_user'
 *
 * Efecto:
 *   - Marca disputed = true, guarda reason + evidence (url opcional)
 *   - Setea dispute_created_at = now()
 *   - La rating queda visible igual pero los agregados públicos la EXCLUYEN
 *     mientras está en disputa (ver computeVenueRatingStats que filtra hidden).
 *
 * V1: sin moderación admin todavía — la disputa queda "activa" (disputed=true,
 * outcome=null) hasta que alguien decida. Cuando agreguemos panel admin, esa
 * UI setea outcome='upheld'|'dismissed' y hidden según el fallo.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { reason?: string; evidence?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const reason = body.reason?.trim()
  if (!reason || reason.length < 10) {
    return NextResponse.json(
      { error: 'Explicá el motivo con al menos 10 caracteres' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const { data: rating } = await admin
    .from('ratings')
    .select('id, venue_id, direction, disputed, reservation_id, user_id')
    .eq('id', id)
    .single()

  if (!rating) {
    return NextResponse.json({ error: 'Rating no encontrada' }, { status: 404 })
  }
  if (rating.disputed) {
    return NextResponse.json({ error: 'Ya está en disputa' }, { status: 409 })
  }

  // Validar permiso
  let allowed = false
  if (rating.direction === 'user_to_venue') {
    // Staff del venue puede apelar
    const { data: staff } = await admin
      .from('staff_users')
      .select('venue_id')
      .eq('id', user.id)
      .single()
    if (staff?.venue_id === rating.venue_id) allowed = true
  } else {
    // venue_to_user — el user target puede apelar si tiene cuenta
    if (rating.user_id === user.id) {
      allowed = true
    } else {
      // Fallback: si es guest (user_id null), buscar via reservation.user_id
      const { data: res } = await admin
        .from('reservations').select('user_id').eq('id', rating.reservation_id).single()
      if (res?.user_id === user.id) allowed = true
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Sin permisos para apelar esta rating' }, { status: 403 })
  }

  // Check ventana de 72 horas
  const { data: ratingFull } = await admin
    .from('ratings').select('created_at').eq('id', id).single()
  if (ratingFull?.created_at) {
    const ageHours = (Date.now() - new Date(ratingFull.created_at).getTime()) / 3_600_000
    if (ageHours > 72) {
      return NextResponse.json(
        { error: 'La ventana de 72hs para apelar venció' },
        { status: 400 },
      )
    }
  }

  const { error: updateError } = await admin
    .from('ratings')
    .update({
      disputed: true,
      dispute_reason: reason,
      dispute_evidence: body.evidence?.trim() || null,
      dispute_created_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
