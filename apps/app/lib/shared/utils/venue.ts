import type { VenueConfig, ServiceHours } from '../types/venue'

export type VenueMode = 'pre_service' | 'active_service' | 'closed'

export interface VenueModeResult {
  mode: VenueMode
  /** Turno activo o próximo */
  shift: ServiceHours | null
  /** Minutos restantes hasta que abra el próximo turno (solo en pre_service) */
  minutesUntilOpen: number | null
}

/**
 * Determina el modo operativo actual del venue según su configuración de horarios.
 * - active_service: entre (opens_at - cut_off_minutes) y closes_at
 * - pre_service: antes del corte
 * - closed: fuera de todos los turnos del día
 */
export function getVenueMode(
  config: VenueConfig,
  now: Date = new Date(),
): VenueModeResult {
  const dayOfWeek = now.getDay() as ServiceHours['day_of_week']
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const todayShifts = config.service_hours.filter(
    (sh) => sh.day_of_week === dayOfWeek && sh.is_open,
  )

  for (const shift of todayShifts) {
    const [openH, openM] = shift.opens_at.split(':').map(Number)
    const [closeH, closeM] = shift.closes_at.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM
    const cutOffMinutes = openMinutes - config.cut_off_minutes

    if (nowMinutes >= cutOffMinutes && nowMinutes <= closeMinutes) {
      return { mode: 'active_service', shift, minutesUntilOpen: null }
    }

    if (nowMinutes < cutOffMinutes) {
      return {
        mode: 'pre_service',
        shift,
        minutesUntilOpen: cutOffMinutes - nowMinutes,
      }
    }
  }

  return { mode: 'closed', shift: null, minutesUntilOpen: null }
}

/**
 * Genera los slots de horario disponibles para una fecha dada.
 * Intervalos de 30 minutos dentro del turno, excluyendo los que ya pasaron
 * (si la fecha es hoy) y respetando el corte.
 */
export function getAvailableTimeSlots(
  config: VenueConfig,
  date: string, // "YYYY-MM-DD"
  now: Date = new Date(),
): string[] {
  const [year, month, day] = date.split('-').map(Number)
  const selectedDate = new Date(year, month - 1, day)
  const isToday =
    selectedDate.toDateString() === now.toDateString()

  const dayOfWeek = selectedDate.getDay() as ServiceHours['day_of_week']
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const todayShifts = config.service_hours.filter(
    (sh) => sh.day_of_week === dayOfWeek && sh.is_open,
  )

  const slots: string[] = []

  for (const shift of todayShifts) {
    const [openH, openM] = shift.opens_at.split(':').map(Number)
    const [closeH, closeM] = shift.closes_at.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM
    // El último slot disponible es 1.5h antes del cierre
    const lastSlotMinutes = closeMinutes - 90

    let cursor = openMinutes
    while (cursor <= lastSlotMinutes) {
      // Si es hoy, excluir slots que ya pasaron el corte
      const cutOff = cursor - config.cut_off_minutes
      if (!isToday || nowMinutes < cutOff) {
        const h = Math.floor(cursor / 60)
          .toString()
          .padStart(2, '0')
        const m = (cursor % 60).toString().padStart(2, '0')
        slots.push(`${h}:${m}`)
      }
      cursor += 30
    }
  }

  return slots
}

/**
 * Genera los próximos N días disponibles a partir de hoy.
 */
export function getAvailableDates(
  config: VenueConfig,
  daysAhead = 14,
  from: Date = new Date(),
): string[] {
  const dates: string[] = []

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    const dow = d.getDay() as ServiceHours['day_of_week']
    const hasShift = config.service_hours.some(
      (sh) => sh.day_of_week === dow && sh.is_open,
    )
    if (hasShift) {
      dates.push(d.toISOString().split('T')[0])
    }
  }

  return dates
}
