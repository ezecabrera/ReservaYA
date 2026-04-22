/**
 * Genera el contenido de un archivo .ics para "Agregar al calendario"
 * Incluye alarma 60 minutos antes y el código de mesa en la descripción
 */
export function generateICS(params: {
  reservationId: string
  venueName: string
  venueAddress: string
  venuePhone?: string
  date: string        // "YYYY-MM-DD"
  timeSlot: string    // "HH:MM"
  tableLabel: string
  userName: string
}): string {
  const {
    reservationId,
    venueName,
    venueAddress,
    venuePhone,
    date,
    timeSlot,
    tableLabel,
    userName,
  } = params

  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = timeSlot.split(':').map(Number)

  const startDt = formatICSDate(new Date(year, month - 1, day, hour, minute))
  const endDt = formatICSDate(
    new Date(year, month - 1, day, hour + 2, minute), // duración estimada 2hs
  )
  const now = formatICSDate(new Date())

  const description = [
    `Código de mesa: ${userName} · ${tableLabel}`,
    `Presentate con este código en la entrada.`,
    venuePhone ? `Contacto: ${venuePhone}` : '',
  ]
    .filter(Boolean)
    .join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Un Toque//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reservationId}@untoque`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDt}`,
    `DTEND:${endDt}`,
    `SUMMARY:Reserva en ${venueName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${venueAddress}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Recordatorio: Reserva en ${venueName} en 1 hora`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function formatICSDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
}
