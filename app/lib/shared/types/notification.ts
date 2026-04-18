/**
 * Códigos de template HSM (High-Structured Message) pre-aprobados por Meta.
 * Cada código se mapea a un template_name + language_code en el helper Node.
 *
 * Reglas:
 *   - reservation_confirmed: se dispara al confirmar la reserva (pago OK / manual desde panel)
 *   - reminder_24h: 24h antes del turno
 *   - reminder_2h:  2h antes del turno
 *   - cancelled_by_venue: cuando el panel cancela unilateralmente
 *   - post_visit_review: 22h después del check-in — pide reseña
 */
export type NotificationTemplateCode =
  | 'reservation_confirmed'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'cancelled_by_venue'
  | 'post_visit_review'

export type NotificationChannel = 'whatsapp' | 'email' | 'sms'

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

/** Variables que acepta cada template — tipado permisivo por simplicidad V1. */
export interface NotificationPayload {
  name?: string
  venue_name?: string
  /** Fecha legible para humano, ej: "jueves 18/04" */
  date?: string
  /** Hora en formato "20:30" */
  time?: string
  party_size?: number
  /** URL absoluta al confirmación / reseña */
  link?: string
  /** Texto extra libre (para cancelaciones: motivo si el venue lo escribió) */
  extra?: string
}

export interface Notification {
  id: string
  reservation_id: string
  venue_id: string
  template_code: NotificationTemplateCode
  channel: NotificationChannel
  to_phone: string | null
  to_email: string | null
  payload_json: NotificationPayload
  status: NotificationStatus
  scheduled_at: string
  sent_at: string | null
  error: string | null
  external_id: string | null
  attempts: number
  created_at: string
}

/**
 * Metadatos de cada template usados por el helper de envío. Los `variable_order`
 * mapean posicionalmente las variables al orden en que Meta los aprobó.
 * Cambiar esto requiere re-aprobación del template — NO modificar sin pensar.
 */
export interface TemplateMeta {
  code: NotificationTemplateCode
  meta_name: string
  language_code: string
  variable_order: (keyof NotificationPayload)[]
  /** Minutos relativos al datetime de la reserva. Null = inmediato. */
  schedule_offset_minutes: number | null
}

export const TEMPLATE_REGISTRY: Record<NotificationTemplateCode, TemplateMeta> = {
  reservation_confirmed: {
    code: 'reservation_confirmed',
    meta_name: 'ry_reservation_confirmed',
    language_code: 'es_AR',
    // "Hola {{1}}, tu reserva en {{2}} para el {{3}} a las {{4}}hs está confirmada."
    variable_order: ['name', 'venue_name', 'date', 'time'],
    schedule_offset_minutes: null,
  },
  reminder_24h: {
    code: 'reminder_24h',
    meta_name: 'ry_reminder_24h',
    language_code: 'es_AR',
    // "Mañana {{1}} tenés reserva en {{2}} a las {{3}}hs. Respondé CANCELAR si no podés ir."
    variable_order: ['name', 'venue_name', 'time'],
    schedule_offset_minutes: -24 * 60,
  },
  reminder_2h: {
    code: 'reminder_2h',
    meta_name: 'ry_reminder_2h',
    language_code: 'es_AR',
    // "Tu reserva en {{1}} es en 2 horas ({{2}}hs). Te esperan."
    variable_order: ['venue_name', 'time'],
    schedule_offset_minutes: -2 * 60,
  },
  cancelled_by_venue: {
    code: 'cancelled_by_venue',
    meta_name: 'ry_cancelled_by_venue',
    language_code: 'es_AR',
    // "Lamentamos avisarte: {{1}} canceló tu reserva del {{2}}. Podés dejar reseña: {{3}}"
    variable_order: ['venue_name', 'date', 'link'],
    schedule_offset_minutes: null,
  },
  post_visit_review: {
    code: 'post_visit_review',
    meta_name: 'ry_post_visit_review',
    language_code: 'es_AR',
    // "Gracias por visitar {{1}}. ¿Cómo fue tu experiencia? {{2}}"
    variable_order: ['venue_name', 'link'],
    schedule_offset_minutes: 22 * 60, // 22h después del check-in
  },
}
