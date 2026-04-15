import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import MercadoPago, { Preference } from 'mercadopago'

/**
 * POST /api/reserva/[id]/pago
 *
 * Flujo Checkout Pro:
 * 1. Verifica que la reserva exista y pertenezca al usuario autenticado
 * 2. Crea o recupera el registro de Payment (idempotente)
 * 3. Llama a la API de MP para crear la preference
 * 4. Devuelve el init_point para redirigir al usuario a MP
 *
 * El usuario paga en MP y vuelve a:
 *   /reserva/[id]/confirmacion?status=approved&payment_id=xxx&external_reference=yyy
 *
 * La route de confirmación lee esos params y actualiza el Payment.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const reservationId = params.id

    // 1. Verificar la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*, tables(label, venues(name, address)), users(name, email)')
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .eq('status', 'pending_payment')
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada o ya procesada' },
        { status: 404 },
      )
    }

    const venue = reservation.tables?.venues as
      | { name: string; address: string }
      | null
    const tableLabel = (reservation.tables as { label: string } | null)?.label
    const userName = (reservation.users as { name: string } | null)?.name
    const payerEmail =
      (reservation.users as { email: string | null } | null)?.email ?? undefined

    // Obtener config del venue para saber el monto de la seña
    const { data: venueData } = await supabase
      .from('venues')
      .select('config_json')
      .eq('id', reservation.venue_id)
      .single()

    const config = venueData?.config_json as {
      deposit_type: 'fixed' | 'percentage'
      deposit_amount: number
    } | null

    const depositAmount =
      config?.deposit_type === 'fixed'
        ? config.deposit_amount
        : // percentage del total — por ahora no hay pre-pedido así que usamos monto fijo
          (config?.deposit_amount ?? 2000)

    // 2. Crear o recuperar el Payment (idempotente por reserva)
    let { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .eq('status', 'pending')
      .maybeSingle()

    if (!payment) {
      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          reservation_id: reservationId,
          amount: depositAmount,
          provider: 'mercadopago',
          status: 'pending',
        })
        .select()
        .single()

      if (paymentError || !newPayment) {
        return NextResponse.json(
          { error: 'Error al crear el pago' },
          { status: 500 },
        )
      }

      payment = newPayment
    }

    // Si ya tiene preference_id, devolver el mismo link (idempotente)
    if (payment.preference_id) {
      const mp = new MercadoPago({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      })
      const preference = new Preference(mp)
      const existing = await preference.get({ preferenceId: payment.preference_id })

      return NextResponse.json({
        init_point: existing.init_point,
        preference_id: payment.preference_id,
      })
    }

    // 3. Crear la preference en MP
    const mp = new MercadoPago({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })
    const preference = new Preference(mp)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const description = `Seña — ${venue?.name ?? 'Restaurante'} · ${tableLabel ?? 'Mesa'} · ${userName ?? ''}`

    const created = await preference.create({
      body: {
        items: [
          {
            id: reservationId,
            title: description,
            quantity: 1,
            unit_price: depositAmount,
            currency_id: 'ARS',
          },
        ],
        payer: payerEmail ? { email: payerEmail } : undefined,
        // external_reference = idempotency_key para identificar el pago al volver
        external_reference: payment.idempotency_key,
        back_urls: {
          success: `${appUrl}/reserva/${reservationId}/confirmacion?status=approved`,
          failure: `${appUrl}/reserva/${reservationId}/confirmacion?status=rejected`,
          pending: `${appUrl}/reserva/${reservationId}/confirmacion?status=pending`,
        },
        auto_return: 'approved',
        // El pago expira en 10 minutos (timer de la pantalla de pago)
        expiration_date_to: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    })

    // 4. Guardar preference_id en el Payment
    await supabase
      .from('payments')
      .update({ preference_id: created.id })
      .eq('id', payment.id)

    return NextResponse.json({
      init_point: created.init_point,
      preference_id: created.id,
    })
  } catch (error) {
    console.error('[pago/route]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
