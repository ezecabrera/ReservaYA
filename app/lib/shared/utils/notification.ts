import type {
  NotificationTemplateCode,
  NotificationPayload,
  NotificationChannel,
  TemplateMeta,
} from '../types/notification'
import { TEMPLATE_REGISTRY } from '../types/notification'
import { reservationDateTime } from './date'

/**
 * Datos mínimos de una reserva que necesitamos para construir payloads
 * de notification. Evita acoplar a la fila exacta de DB.
 */
export interface NotificationReservationCtx {
  id: string
  date: string                 // YYYY-MM-DD
  time_slot: string            // HH:MM
  party_size: number
  user_phone: string | null
  user_name: string | null
  guest_phone: string | null
  guest_name: string | null
  venue_name: string
}

/** Formatea una fecha como "jueves 18/04" (es-AR). */
export function formatReservationDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return `${dias[dt.getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export interface EnqueueRow {
  reservation_id: string
  venue_id: string
  template_code: NotificationTemplateCode
  channel: NotificationChannel
  to_phone: string | null
  to_email: string | null
  payload_json: NotificationPayload
  scheduled_at: string // ISO
}

/**
 * Construye las 4 filas de lifecycle para una reserva recién confirmada:
 *   - reservation_confirmed (inmediato)
 *   - reminder_24h (si hay tiempo)
 *   - reminder_2h (si hay tiempo)
 *   - post_visit_review (22h después del turno)
 *
 * Si la hora del evento ya pasó (ej: walk-in cargado justo al llegar),
 * no encola los reminders que quedan en el pasado.
 *
 * El canal default es WhatsApp; si no hay teléfono devuelve fila con
 * channel='email' para que el worker intente vía Resend (no V1 pero
 * deja el outbox listo).
 */
export function buildReservationLifecycle(
  venue_id: string,
  r: NotificationReservationCtx,
  now: Date = new Date(),
): EnqueueRow[] {
  const phone = (r.user_phone ?? r.guest_phone ?? '').trim() || null
  const email: string | null = null // todavía no guardamos emails de guest
  const channel: NotificationChannel = phone ? 'whatsapp' : 'email'
  const name = (r.user_name ?? r.guest_name ?? 'Cliente').split(' ')[0]
  const dtReserva = reservationDateTime(r.date, r.time_slot)

  const basePayload: NotificationPayload = {
    name,
    venue_name: r.venue_name,
    date: formatReservationDate(r.date),
    time: r.time_slot,
    party_size: r.party_size,
  }

  const rows: EnqueueRow[] = []
  const codes: NotificationTemplateCode[] = [
    'reservation_confirmed',
    'reminder_24h',
    'reminder_2h',
    'post_visit_review',
  ]

  for (const code of codes) {
    const meta = TEMPLATE_REGISTRY[code]
    const scheduledAt = computeScheduledAt(meta, dtReserva, now)
    // Si el reminder ya pasó, no tiene sentido encolarlo
    if (scheduledAt.getTime() <= now.getTime() && code.startsWith('reminder_')) continue

    rows.push({
      reservation_id: r.id,
      venue_id,
      template_code: code,
      channel,
      to_phone: phone,
      to_email: email,
      payload_json: basePayload,
      scheduled_at: scheduledAt.toISOString(),
    })
  }

  return rows
}

/** Payload específico para notificar cancelación unilateral. */
export function buildCancelledByVenueRow(
  venue_id: string,
  r: NotificationReservationCtx,
  reviewLink: string,
): EnqueueRow {
  const phone = (r.user_phone ?? r.guest_phone ?? '').trim() || null

  return {
    reservation_id: r.id,
    venue_id,
    template_code: 'cancelled_by_venue',
    channel: phone ? 'whatsapp' : 'email',
    to_phone: phone,
    to_email: null,
    payload_json: {
      name: (r.user_name ?? r.guest_name ?? 'Cliente').split(' ')[0],
      venue_name: r.venue_name,
      date: formatReservationDate(r.date),
      link: reviewLink,
    },
    scheduled_at: new Date().toISOString(),
  }
}

function computeScheduledAt(meta: TemplateMeta, dtReserva: Date, now: Date): Date {
  if (meta.schedule_offset_minutes === null) return now
  return new Date(dtReserva.getTime() + meta.schedule_offset_minutes * 60_000)
}

/**
 * Convierte el payload JSON en el array ordenado de variables que Meta
 * espera en el body del template. Usa el orden definido en TemplateMeta.
 * Valores faltantes van como string vacío para no romper el envío.
 */
export function payloadToVariables(meta: TemplateMeta, payload: NotificationPayload): string[] {
  return meta.variable_order.map((key) => {
    const v = payload[key]
    if (v === null || v === undefined) return ''
    return String(v)
  })
}
