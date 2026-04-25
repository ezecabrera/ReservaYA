'use client'

/**
 * Bloque de baja sin penalidad — Botón de arrepentimiento Ley 24.240 art. 34.
 * Pensado para insertarse en /dashboard/billing del panel del restaurante
 * (también puede usarse en pantallas legales del marketplace).
 *
 * Abre un mailto pre-rellenado a hola@deuntoque.com con el asunto requerido
 * por la normativa de Defensa del Consumidor. NO realiza la baja por sí mismo:
 * la baja efectiva la procesa el equipo de soporte tras validar identidad.
 *
 * El componente es visualmente neutro: confía en la tipografía heredada del
 * sistema (Plus Jakarta Sans + Fraunces). Funciona dentro y fuera de LegalShell.
 */

interface CancellationButtonProps {
  /** Email del titular pre-rellenado en el cuerpo del mail. */
  customerEmail?: string
  /** Identificador interno (id usuario / suscripción) para que soporte ubique la cuenta. */
  accountId?: string
  /** Variante visual: prominente para /billing, sutil para páginas legales. */
  variant?: 'prominent' | 'inline'
}

const SUPPORT_EMAIL = 'hola@deuntoque.com'
const SUBJECT = 'BAJA — derecho de arrepentimiento Ley 24.240'

export function CancellationButton({
  customerEmail,
  accountId,
  variant = 'prominent',
}: CancellationButtonProps) {
  const body = [
    'Hola equipo UnToque,',
    '',
    'Quiero ejercer mi derecho de arrepentimiento previsto en el art. 34 de la Ley 24.240 de Defensa del Consumidor y solicitar la baja de mi suscripción sin penalidad.',
    '',
    customerEmail ? `Email registrado: ${customerEmail}` : 'Email registrado: [completar]',
    accountId ? `ID de cuenta: ${accountId}` : 'ID de cuenta: [completar]',
    'Razón social del comercio: [completar]',
    '',
    'Quedo a la espera de la confirmación de la baja y del reintegro proporcional, si correspondiere.',
    '',
    'Saludos.',
  ].join('\n')

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`

  const isProminent = variant === 'prominent'

  return (
    <section
      aria-labelledby="cancellation-heading"
      style={{
        marginTop: 32,
        padding: isProminent ? 24 : 16,
        borderRadius: 16,
        background: isProminent ? '#F0EDE5' : 'transparent',
        border: isProminent ? '1px solid rgba(23, 25, 27, 0.08)' : '1px dashed rgba(23, 25, 27, 0.18)',
        color: '#17191B',
      }}
    >
      <h3
        id="cancellation-heading"
        style={{
          fontFamily: 'var(--font-display, "Fraunces", serif)',
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}
      >
        Botón de arrepentimiento — Ley 24.240
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 16px', color: '#5A5852' }}>
        Tenés derecho a revocar la contratación de la suscripción dentro de los <strong>10 días corridos</strong>{' '}
        desde su celebración, sin necesidad de invocar causa y sin penalidad alguna (art. 34, Ley 24.240 de
        Defensa del Consumidor). También podés cancelar tu suscripción en cualquier momento posterior desde tu
        panel; la baja se hace efectiva al cierre del ciclo de facturación en curso.
      </p>

      <a
        href={mailto}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 20px',
          borderRadius: 999,
          background: '#17191B',
          color: '#F6F4EE',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '0.01em',
        }}
      >
        Solicitar baja sin penalidad
      </a>

      <p style={{ fontSize: 12, lineHeight: 1.5, margin: '12px 0 0', color: '#8B897F' }}>
        El botón abre tu cliente de mail con un mensaje pre-rellenado dirigido a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#17191B' }}>
          {SUPPORT_EMAIL}
        </a>
        . Si preferís, podés escribirnos directamente desde tu casilla con el asunto{' '}
        <strong>"BAJA"</strong>. Te respondemos dentro de las 48 horas hábiles confirmando la baja.
      </p>
    </section>
  )
}
