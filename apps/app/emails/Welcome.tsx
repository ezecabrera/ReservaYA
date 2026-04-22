import { Button, Heading, Text } from '@react-email/components'
import { BaseEmail } from './_base'

export interface WelcomeProps {
  firstName: string
  appUrl?: string
}

/**
 * Email de bienvenida cuando un usuario se registra por primera vez.
 * Tono cálido, argentino, con 3 acciones claras para que no queden
 * mirando un email sin saber qué hacer.
 */
export function Welcome({
  firstName,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deuntoque.com',
}: WelcomeProps) {
  return (
    <BaseEmail preview={`¡Bienvenido a UnToque, ${firstName}!`}>
      <Heading style={h1Style}>
        ¡Bienvenido a UnToque, {firstName}! 🎉
      </Heading>

      <Text style={paragraphStyle}>
        Gracias por sumarte. Desde ahora tenés el catálogo curado de los
        mejores restaurantes de Argentina a un toque de distancia.
      </Text>

      <Text style={paragraphStyle}>Para arrancar:</Text>

      <div style={listStyle}>
        <div style={listItemStyle}>
          <span style={bulletStyle}>1</span>
          <span>Explorá restaurantes según tu barrio y tipo de cocina</span>
        </div>
        <div style={listItemStyle}>
          <span style={bulletStyle}>2</span>
          <span>Reservá en 3 toques — fecha, hora, personas</span>
        </div>
        <div style={listItemStyle}>
          <span style={bulletStyle}>3</span>
          <span>
            Recibí tu QR y presentalo al llegar. Sin anotaciones, sin llamar.
          </span>
        </div>
      </div>

      <Button href={appUrl} style={buttonStyle}>
        Empezar a explorar →
      </Button>

      <Text style={paragraphStyle}>
        Si tenés alguna duda, respondé este mail — nos llega directo.
      </Text>

      <Text style={signatureStyle}>
        — El equipo de UnToque
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
  margin: '0 0 20px 0',
}

const listStyle = {
  margin: '0 0 28px 0',
}

const listItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '10px 0',
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.5',
}

const bulletStyle = {
  backgroundColor: '#FF4757',
  color: '#ffffff',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 700,
  flexShrink: 0,
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
  marginBottom: '24px',
}

const signatureStyle = {
  color: '#6b7280',
  fontSize: '13px',
  fontStyle: 'italic',
  marginTop: '24px',
  margin: 0,
}
