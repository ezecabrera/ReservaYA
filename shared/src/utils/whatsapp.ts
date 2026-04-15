/**
 * Genera el mensaje de WhatsApp pre-armado para guardar la reserva.
 * Es texto plano — funciona offline en el check-in.
 */
export function buildWhatsAppMessage(params: {
  venueName: string
  date: string        // "YYYY-MM-DD"
  timeSlot: string    // "HH:MM"
  userName: string
  tableLabel: string
  venueAddress: string
}): string {
  const { venueName, date, timeSlot, userName, tableLabel, venueAddress } =
    params

  const dateFormatted = formatDateEs(date)

  return (
    `Reserva confirmada en ${venueName} 🍽\n` +
    `📅 ${dateFormatted} · ${timeSlot} hs\n` +
    `👤 ${userName} · ${tableLabel}\n` +
    `📍 ${venueAddress}\n\n` +
    `Mostrá este mensaje en la entrada\n` +
    `o presentate como "${userName}, ${tableLabel}".`
  )
}

/**
 * Devuelve la URL de WhatsApp con el mensaje pre-codificado
 */
export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

function formatDateEs(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
