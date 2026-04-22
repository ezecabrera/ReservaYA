import 'server-only'
import { Resend } from 'resend'
import type { ReactElement } from 'react'

/**
 * Cliente Resend centralizado.
 *
 * Lazy-init para no romper el build si la env var no está (ej. preview sin
 * RESEND_API_KEY seteada todavía). La primera llamada a sendEmail() sí
 * exige que esté configurada.
 */

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (resendInstance) return resendInstance

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY no está configurada. Agregala en Vercel → Settings → Environment Variables.',
    )
  }
  resendInstance = new Resend(apiKey)
  return resendInstance
}

/** Alias de envío — mapea a addresses verificadas en Resend. */
export const EMAIL_FROM = {
  /** Transaccionales: confirmaciones, reminders, verificaciones. */
  noReply: 'UnToque <no-reply@deuntoque.com>',
  /** Comunicación comercial / onboarding. */
  hola: 'UnToque <hola@deuntoque.com>',
  /** Respuestas a tickets. */
  soporte: 'UnToque Soporte <soporte@deuntoque.com>',
  /** Facturación: cobros, vencimientos, cambios de plan. */
  facturacion: 'UnToque Facturación <facturacion@deuntoque.com>',
} as const

interface SendEmailParams {
  to: string | string[]
  subject: string
  /** React Email component. */
  react: ReactElement
  /** Alias FROM. Default: noReply. */
  from?: (typeof EMAIL_FROM)[keyof typeof EMAIL_FROM]
  /** Dónde va el reply — default: soporte@ para que reply-alls no vayan a no-reply. */
  replyTo?: string
  /** Headers custom (ej. List-Unsubscribe para newsletters). */
  headers?: Record<string, string>
  /** Tag Resend para tracking/analytics por tipo de email. */
  tags?: Array<{ name: string; value: string }>
}

/**
 * Envía un email transaccional via Resend.
 *
 * @example
 *   await sendEmail({
 *     to: user.email,
 *     subject: 'Tu reserva en La Vaca Loca',
 *     react: <ReservationConfirmation reservation={r} />,
 *     tags: [{ name: 'type', value: 'reservation-confirmation' }],
 *   })
 */
export async function sendEmail({
  to,
  subject,
  react,
  from = EMAIL_FROM.noReply,
  replyTo = 'soporte@deuntoque.com',
  headers,
  tags,
}: SendEmailParams) {
  const resend = getResend()

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    replyTo,
    headers,
    tags,
  })

  if (error) {
    // Log pero no reventar el request principal — email failing shouldn't kill
    // the reservation flow. Sentry captura el error si está configurado.
    console.error('[sendEmail] Resend error:', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}
