import { Heading, Text } from '@react-email/components'
import { BaseEmail } from './_base'

export interface SupportAckProps {
  firstName?: string
  ticketId: string
  /** Resumen corto del mensaje original del usuario. */
  summary: string
}

/**
 * Email auto-respuesta cuando alguien escribe a soporte@.
 * Le da certidumbre (ticket #, tiempo estimado) y promete una respuesta
 * humana. Reduce la ansiedad del "¿llegó mi mensaje?"
 */
export function SupportAck({ firstName, ticketId, summary }: SupportAckProps) {
  const greeting = firstName ? `Hola ${firstName}` : 'Hola'

  return (
    <BaseEmail preview={`Recibimos tu mensaje · Ticket #${ticketId}`}>
      <Heading style={h1Style}>Recibimos tu mensaje ✓</Heading>

      <Text style={paragraphStyle}>
        {greeting}, gracias por escribirnos. Un humano va a responderte en las
        próximas <strong>24 horas hábiles</strong>.
      </Text>

      <div style={ticketBoxStyle}>
        <div style={ticketRowStyle}>
          <span style={labelStyle}>Ticket</span>
          <span style={valueStyle}>#{ticketId}</span>
        </div>
        <div style={{ ...ticketRowStyle, borderBottom: 'none' }}>
          <span style={labelStyle}>Tu consulta</span>
          <span style={valueStyle}>{summary}</span>
        </div>
      </div>

      <Text style={smallTextStyle}>
        Si es urgente, podés responder este email y sumás contexto al mismo
        ticket.
      </Text>
    </BaseEmail>
  )
}

const h1Style = {
  color: '#111',
  fontSize: '24px',
  fontWeight: 700,
  margin: '0 0 16px 0',
}

const paragraphStyle = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
}

const ticketBoxStyle = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px 0',
}

const ticketRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6',
  gap: '12px',
}

const labelStyle = {
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: 500,
  flexShrink: 0,
}

const valueStyle = {
  color: '#111',
  fontSize: '14px',
  fontWeight: 600,
  textAlign: 'right' as const,
}

const smallTextStyle = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: 0,
}
