/**
 * Formatea una fecha ISO al formato legible en español
 * "YYYY-MM-DD" → "Viernes 18 de abril"
 */
export function formatDateEs(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Formatea hora "HH:MM" a "HH:MM hs"
 */
export function formatTime(timeSlot: string): string {
  return `${timeSlot} hs`
}

/**
 * Devuelve si el momento actual está dentro del servicio activo
 * dado un turno (opens_at / closes_at en "HH:MM") y el cut_off_minutes
 */
export function isActiveService(
  opensAt: string,
  closesAt: string,
  cutOffMinutes: number,
): boolean {
  const now = new Date()
  const [openH, openM] = opensAt.split(':').map(Number)
  const [closeH, closeM] = closesAt.split(':').map(Number)

  const openTime = openH * 60 + openM - cutOffMinutes
  const closeTime = closeH * 60 + closeM
  const nowTime = now.getHours() * 60 + now.getMinutes()

  return nowTime >= openTime && nowTime <= closeTime
}

/**
 * Construye la fecha y hora de una reserva como objeto Date
 */
export function reservationDateTime(date: string, timeSlot: string): Date {
  return new Date(`${date}T${timeSlot}:00`)
}

/**
 * Devuelve true si la reserva es un no-show (más de 15 min sin check-in)
 */
export function isNoShow(date: string, timeSlot: string): boolean {
  const reservationTime = reservationDateTime(date, timeSlot)
  const noShowThreshold = new Date(reservationTime.getTime() + 15 * 60 * 1000)
  return new Date() > noShowThreshold
}
