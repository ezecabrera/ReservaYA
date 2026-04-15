export type VenueOperativeMode = 'pre_service' | 'active_service'

export interface ServiceHours {
  /** 0 = Sunday, 1 = Monday, ... 6 = Saturday */
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6
  opens_at: string  // "HH:MM"
  closes_at: string // "HH:MM"
  is_open: boolean
}

export interface VenueConfig {
  service_hours: ServiceHours[]
  /** Minutos antes de la apertura en que se cortan las reservas */
  cut_off_minutes: number
  /** "fixed" = monto fijo; "percentage" = % del subtotal */
  deposit_type: 'fixed' | 'percentage'
  deposit_amount: number
  /** Horas de gracia para cancelación gratuita */
  cancellation_grace_hours: number
  /** % de devolución fuera del período de gracia */
  cancellation_refund_percentage: number
  /** Horas antes del turno para enviar el recordatorio */
  reminder_hours_before: number
  zones_enabled: boolean
  /** Descuento para primeras reservas via app nativa */
  app_first_reservation_discount_percentage?: number
}

export interface Venue {
  id: string
  name: string
  address: string
  phone?: string | null
  description?: string | null
  image_url?: string | null
  config_json: VenueConfig
  cut_off_minutes: number
  is_active: boolean
  created_at: string
}

export interface Zone {
  id: string
  venue_id: string
  name: string
  prefix: string
  created_at: string
}
