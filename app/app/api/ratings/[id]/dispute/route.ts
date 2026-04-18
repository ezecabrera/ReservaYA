import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'

/**
 * POST /api/ratings/[id]/dispute (app cliente)
 * El user apela una rating `venue_to_user` que el venue le puso.
 * Misma lógica que panel pero validación: solo el user dueño puede apelar.
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
  try { body = await request.json() } catch {
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
    .select('id, venue_id, direction, disputed, reservation_id, user_id, created_at')
    .eq('id', id)
    .single()

  if (!rating) return NextResponse.json({ error: 'Rating no encontrada' }, { status: 404 })
  if (rating.disputed) return NextResponse.json({ error: 'Ya está en disputa' }, { status: 409 })

  if (rating.direction !== 'venue_to_user') {
    return NextResponse.json(
      { error: 'Desde la app sólo podés apelar ratings de venues hacia vos' },
      { status: 400 },
    )
  }

  // Validar permiso: el user target o dueño de la reserva
  let allowed = rating.user_id === user.id
  if (!allowed) {
    const { data: res } = await admin
      .from('reservations').select('user_id').eq('id', rating.reservation_id).single()
    if (res?.user_id === user.id) allowed = true
  }
  if (!allowed) return NextResponse.json({ error: 'No es tu rating' }, { status: 403 })

  // Ventana 72hs
  const ageHours = (Date.now() - new Date(rating.created_at).getTime()) / 3_600_000
  if (ageHours > 72) {
    return NextResponse.json({ error: 'La ventana de 72hs venció' }, { status: 400 })
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
