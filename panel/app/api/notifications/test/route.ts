import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { sendWhatsAppTemplate } from '@/lib/notifications/metaClient'

/**
 * POST /api/notifications/test
 * Envía un mensaje de prueba (template reservation_confirmed) al número que
 * el staff elige. Sirve para validar credenciales Meta + calidad del template.
 *
 * Body: { to: "+54 9 11..." }
 *
 * En modo dev (sin credenciales Meta) responde con un external_id sintético
 * y NO envía nada — es útil para verificar que el endpoint y el flujo
 * funcionan sin gastar cupo de Meta.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, venues(name)')
    .eq('id', user.id)
    .single() as { data: { venue_id: string; venues: { name: string } } | null }

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  let body: { to?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const to = body.to?.trim()
  if (!to) return NextResponse.json({ error: 'Falta el número destino' }, { status: 400 })

  const result = await sendWhatsAppTemplate({
    to,
    templateCode: 'reservation_confirmed',
    payload: {
      name: 'Tester',
      venue_name: staffUser.venues.name,
      date: 'hoy',
      time: '20:00',
    },
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true, external_id: result.external_id })
}
