import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!

/**
 * POST /api/webhooks/mp-subscription
 * Recibe notificaciones de MercadoPago sobre cambios en suscripciones.
 * MP envía: { type: "subscription_preapproval", data: { id: "..." } }
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as { type: string; data?: { id: string } }

  if (body.type !== 'subscription_preapproval' || !body.data?.id) {
    return NextResponse.json({ ok: true })
  }

  // Consultar el estado actual en MP
  const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${body.data.id}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
  })

  if (!mpRes.ok) return NextResponse.json({ error: 'MP fetch failed' }, { status: 502 })

  const preapproval = await mpRes.json() as {
    id: string
    status: string
    external_reference: string
    next_payment_date?: string
  }

  // Mapear estado MP → nuestro estado
  const statusMap: Record<string, string> = {
    authorized: 'active',
    paused:     'paused',
    cancelled:  'cancelled',
    pending:    'trial',
  }
  const newStatus = statusMap[preapproval.status] ?? 'trial'

  const supabase = await createClient()
  await supabase
    .from('venue_subscriptions')
    .update({
      status: newStatus,
      current_period_end: preapproval.next_payment_date ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', preapproval.external_reference)

  return NextResponse.json({ ok: true })
}
