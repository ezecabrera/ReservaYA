export type PaymentStatus =
  | 'pending'    // preference creada, usuario todavía no pagó
  | 'approved'   // MP confirmó el pago (redirect con status=approved)
  | 'rejected'   // MP rechazó el pago
  | 'refunded'   // devolución ejecutada

export interface Payment {
  id: string
  reservation_id: string
  amount: number
  provider: 'mercadopago'
  /** ID de preferencia de Checkout Pro (pref_xxxx) */
  preference_id: string | null
  /** ID de pago de MP — llega en el redirect de vuelta */
  external_id: string | null
  status: PaymentStatus
  /**
   * UUID generado al crear el Payment.
   * Se usa como external_reference en la preference de MP,
   * lo que permite identificar qué pago corresponde a qué reserva
   * sin depender de webhooks.
   */
  idempotency_key: string
  created_at: string
}

/**
 * Params para crear una preference de Checkout Pro en MP.
 * POST /api/reserva/[id]/pago → devuelve init_point para redirect.
 */
export interface CreatePaymentPreferenceParams {
  reservation_id: string
  amount: number
  description: string       // ej: "Seña — La Cantina · Mesa T2"
  payer_email?: string
  back_urls: {
    success: string          // /reserva/[id]/confirmacion?status=approved
    failure: string          // /reserva/[id]/confirmacion?status=rejected
    pending: string          // /reserva/[id]/confirmacion?status=pending
  }
}

export interface CreatePaymentPreferenceResponse {
  preference_id: string
  init_point: string         // URL a la que redirigir al usuario
}
