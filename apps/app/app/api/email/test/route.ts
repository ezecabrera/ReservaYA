import { NextResponse, type NextRequest } from 'next/server'
import { sendEmail, EMAIL_FROM } from '@/lib/email'
import { Welcome } from '@/emails/Welcome'
import { ReservationConfirmation } from '@/emails/ReservationConfirmation'
import { SupportAck } from '@/emails/SupportAck'

export const runtime = 'nodejs'

/**
 * Endpoint para probar los templates de email en producción.
 *
 * Protegido por el query `?secret=...` que debe coincidir con
 * `RESEND_TEST_SECRET`. Setealo en Vercel (cualquier string random).
 *
 * Uso:
 *   GET /api/email/test?secret=xxx&template=welcome&to=tu@email.com
 *   GET /api/email/test?secret=xxx&template=reservation&to=tu@email.com
 *   GET /api/email/test?secret=xxx&template=support&to=tu@email.com
 *
 * Elegí template entre: welcome · reservation · support
 */
export async function GET(request: NextRequest) {
  const secret = process.env.RESEND_TEST_SECRET
  const url = new URL(request.url)
  const providedSecret = url.searchParams.get('secret')

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const template = url.searchParams.get('template') || 'welcome'
  const to = url.searchParams.get('to')

  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json(
      { error: 'Query param `to` inválido. Usá ?to=tu@email.com' },
      { status: 400 },
    )
  }

  try {
    let result
    switch (template) {
      case 'welcome':
        result = await sendEmail({
          to,
          from: EMAIL_FROM.hola,
          subject: '¡Bienvenido a UnToque! 🎉',
          react: Welcome({ firstName: 'Eze' }),
          tags: [{ name: 'type', value: 'welcome' }],
        })
        break

      case 'reservation':
        result = await sendEmail({
          to,
          from: EMAIL_FROM.noReply,
          subject: '¡Reserva confirmada! — La Vaca Loca',
          react: ReservationConfirmation({
            customerName: 'Eze',
            venueName: 'La Vaca Loca',
            venueAddress: 'Honduras 5000, Palermo, CABA',
            date: 'Sábado 18 de octubre',
            time: '21:30',
            partySize: 4,
            reservationUrl: 'https://deuntoque.com/mis-reservas',
          }),
          tags: [{ name: 'type', value: 'reservation-confirmation' }],
        })
        break

      case 'support':
        result = await sendEmail({
          to,
          from: EMAIL_FROM.soporte,
          subject: 'Recibimos tu mensaje · Ticket #UT-2026-04-21-001',
          react: SupportAck({
            firstName: 'Eze',
            ticketId: 'UT-2026-04-21-001',
            summary:
              'No me llega el QR de mi reserva en La Vaca Loca del sábado.',
          }),
          tags: [{ name: 'type', value: 'support-ack' }],
        })
        break

      default:
        return NextResponse.json(
          { error: `Template "${template}" desconocido. Opciones: welcome, reservation, support` },
          { status: 400 },
        )
    }

    return NextResponse.json({
      ok: true,
      template,
      to,
      resendId: result?.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
