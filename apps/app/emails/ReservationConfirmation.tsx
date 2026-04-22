import { Button, Heading, Hr, Text } from '@react-email/components'
import { BaseEmail } from './_base'

export interface ReservationConfirmationProps {
  /** Nombre del cliente. */
  customerName: string
  /** Nombre del restaurante. */
  venueName: string
  /** Fecha formateada, ej "Sábado 15 de junio". */
  date: string
  /** Hora formateada, ej "21:00". */
  time: string
  /** Cantidad de personas. */
  partySize: number
  /** URL al QR / ticket de la reserva. */
  reservationUrl: string
  /** Dirección del restaurante. */
  venueAddress?: string
}

/**
 * Email que se envía inmediatamente después de que el usuario completa
 * una reserva. Incluye datos clave + link al QR para presentar en el lugar.
 */
export function ReservationConfirmation({
  customerName,
  venueName,
  date,
  time,
  partySize,
  reservationUrl,
  venueAddress,
}: ReservationConfirmationProps) {
  return (
    <BaseEmail preview={`Tu reserva en ${venueName} está confirmada`}>
      <Heading style={h1Style}>¡Reserva confirmada! ✨</Heading>

      <Text style={paragraphStyle}>
        Hola {customerName}, gracias por usar UnToque. Te esperamos en{' '}
        <strong>{venueName}</strong>.
      </Text>

      {/* Card de datos */}
      <div style={cardStyle}>
        <div style={cardRowStyle}>
          <span style={labelStyle}>Fecha</span>
          <span style={valueStyle}>{date}</span>
        </div>
        <div style={cardRowStyle}>
          <span style={labelStyle}>Hora</span>
          <span style={valueStyle}>{time}</span>
        </div>
        <div style={cardRowStyle}>
          <span style={labelStyle}>Personas</span>
          <span style={valueStyle}>{partySize}</span>
        </div>
        {venueAddress && (
          <div style={cardRowStyle}>
            <span style={labelStyle}>Lugar</span>
            <span style={valueStyle}>{venueAddress}</span>
          </div>
        )}
      </div>

      <Button href={reservationUrl} style={buttonStyle}>
        Ver mi reserva y QR →
      </Button>

      <Hr style={hrStyle} />

      <Text style={smallTextStyle}>
        <strong>Tip:</strong> llegá 5 minutos antes y mostrá el QR en la puerta.
        Si vas a cancelar o cambiar algo, hacelo desde la app con al menos
        2 horas de anticipación.
      </Text>
    </BaseEmail>
  )
}

const h1Style = {
  color: '#111',
  fontSize: '26px',
  fontWeight: 700,
  margin: '0 0 16px 0',
  lineHeight: '1.2',
}

const paragraphStyle = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
}

const cardStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 28px 0',
}

const cardRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid #f3f4f6',
}

const labelStyle = {
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: 500,
}

const valueStyle = {
  color: '#111',
  fontSize: '14px',
  fontWeight: 600,
  textAlign: 'right' as const,
}

const buttonStyle = {
  backgroundColor: '#FF4757',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '999px',
  fontSize: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
}

const hrStyle = {
  borderColor: '#eaeaea',
  margin: '32px 0',
}

const smallTextStyle = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: 0,
}
