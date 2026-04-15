import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!

/**
 * POST /api/billing/subscribe
 * Crea una suscripción en MercadoPago y devuelve el init_point.
 * Solo el owner puede activarla.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: staffUser } = await supabase
    .from('staff_users')
    .select('venue_id, role, email, name')
    .eq('id', user.id)
    .single()

  if (!staffUser || staffUser.role !== 'owner') {
    return NextResponse.json({ error: 'Solo el owner puede activar la suscripción' }, { status: 403 })
  }

  const { data: sub } = await supabase
    .from('venue_subscriptions')
    .select('id, mp_preapproval_id, plan_amount')
    .eq('venue_id', staffUser.venue_id)
    .single()

  if (!sub) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })

  const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL ?? 'http://localhost:3001'

  // Crear preapproval en MercadoPago
  const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: 'ReservaYA — Plan Mensual',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: sub.plan_amount,
        currency_id: 'ARS',
      },
      payer_email: staffUser.email,
      back_url: `${panelUrl}/dashboard/billing?subscribed=true`,
      external_reference: sub.id,
    }),
  })

  if (!mpRes.ok) {
    const err = await mpRes.json()
    return NextResponse.json({ error: err.message ?? 'Error en MercadoPago' }, { status: 502 })
  }

  const mpData = await mpRes.json() as { id: string; init_point: string }

  // Guardar el preapproval_id
  await supabase
    .from('venue_subscriptions')
    .update({ mp_preapproval_id: mpData.id })
    .eq('id', sub.id)

  return NextResponse.json({ init_point: mpData.init_point })
}
