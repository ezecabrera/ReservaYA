import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from '@react-email/components'
import type { ReactNode } from 'react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://deuntoque.com'

interface BaseEmailProps {
  /** Texto que se ve en la bandeja antes de abrir el mail (tipo Snippet). */
  preview: string
  children: ReactNode
}

/**
 * Layout base para todos los emails transaccionales de UnToque.
 * Mantiene el branding coherente: coral + negro + Fraunces-like.
 *
 * Regla: cada template importa esto y mete su contenido como children.
 * Footer con legal + link unsubscribe, header con logo texto.
 */
export function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>UnToque</Text>
          </Section>

          {/* Contenido */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              Recibiste este email porque reservaste o te registraste en{' '}
              <Link href={APP_URL} style={footerLinkStyle}>
                deuntoque.com
              </Link>
              .
            </Text>
            <Text style={footerTextStyle}>
              ¿Dudas? Respondé a este mail o escribí a{' '}
              <Link href="mailto:soporte@deuntoque.com" style={footerLinkStyle}>
                soporte@deuntoque.com
              </Link>
              .
            </Text>
            <Text style={footerLegalStyle}>
              © {new Date().getFullYear()} UnToque · Buenos Aires, Argentina
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/* ─── Estilos inline (obligatorio en emails — no hay CSS externo) ─── */

const bodyStyle = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const containerStyle = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  maxWidth: '560px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}

const headerStyle = {
  backgroundColor: '#000000',
  padding: '28px 32px',
  textAlign: 'center' as const,
}

const logoStyle = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: 900,
  letterSpacing: '-0.5px',
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
}

const contentStyle = {
  padding: '40px 32px',
}

const footerStyle = {
  borderTop: '1px solid #eaeaea',
  padding: '24px 32px',
  backgroundColor: '#fafafa',
}

const footerTextStyle = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 6px 0',
}

const footerLinkStyle = {
  color: '#FF4757',
  textDecoration: 'none',
  fontWeight: 600,
}

const footerLegalStyle = {
  color: '#9ca3af',
  fontSize: '11px',
  marginTop: '12px',
  marginBottom: 0,
}
