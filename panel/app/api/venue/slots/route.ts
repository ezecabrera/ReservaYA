import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server-admin'
import { getAvailableTimeSlots } from '@/lib/shared'
import type { VenueConfig } from '@/lib/shared'

/**
 * GET /api/venue/slots?date=YYYY-MM-DD
 * Devuelve los slots de horario disponibles según los horarios de atención
 * del venue para la fecha pedida. Se usa en el form de reserva manual del panel.
 *
 * A diferencia del flujo del cliente, acá no descontamos cut_off_minutes para
 * fechas futuras — el staff puede cargar walk-ins en caliente.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: staffUser } = await admin
    .from('staff_users')
    .select('venue_id, venues(config_json)')
    .eq('id', user.id)
    .single() as { data: { venue_id: string; venues: { config_json: VenueConfig } } | null }

  if (!staffUser) return NextResponse.json({ error: 'Sin venue' }, { status: 403 })

  const date = request.nextUrl.searchParams.get('date')
    ?? new Date().toISOString().slice(0, 10)

  // Desde el panel no respetamos cut_off: permitimos cargar reservas "para ya"
  const slots = getAvailableTimeSlots(
    staffUser.venues.config_json,
    date,
    new Date(0), // epoch — fuerza a no excluir slots por cut_off del día actual
  )

  return NextResponse.json({ date, slots })
}
