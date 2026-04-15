import type { QRTokenPayload } from '../types/reservation'

/**
 * Genera el payload del QR JWT.
 * La firma se realiza server-side con QR_JWT_SECRET.
 * El QR expira 4 horas después de la hora de reserva.
 */
export function buildQRPayload(
  reservationId: string,
  venueId: string,
  reservationDate: string,
  timeSlot: string,
): QRTokenPayload {
  const [year, month, day] = reservationDate.split('-').map(Number)
  const [hour, minute] = timeSlot.split(':').map(Number)
  const reservationTime = new Date(year, month - 1, day, hour, minute)
  const expTime = new Date(reservationTime.getTime() + 4 * 60 * 60 * 1000)

  return {
    reservation_id: reservationId,
    venue_id: venueId,
    exp: Math.floor(expTime.getTime() / 1000),
  }
}

/**
 * Construye la URL del QR que codifica el check-in
 * panelUrl/check-in?token=...
 */
export function buildQRUrl(panelUrl: string, token: string): string {
  return `${panelUrl}/check-in?token=${encodeURIComponent(token)}`
}
