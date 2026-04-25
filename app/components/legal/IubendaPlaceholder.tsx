/**
 * IubendaPlaceholder
 * ------------------
 * Marcador visual + comentario técnico para anticipar la integración con
 * Iubenda (Privacy Policy + Cookie Solution + Consent DB) cuando UnToque
 * cuente con razón social inscripta y MRR que justifique el upgrade pago.
 *
 * Estado actual (2026-04):
 *   - Estamos operando con razón social pendiente ("Monotributo en trámite").
 *   - El copy de /terms, /privacy y /cookies es custom y legalmente válido para
 *     Argentina (Ley 25.326 + Ley 24.240) según asesoramiento del agente
 *     Compliance AR. NO requiere Iubenda para ser exigible.
 *   - Sin embargo, para escalar a EU users (GDPR art. 7 — consentimiento
 *     granular probable), para tener un Cookie Banner conforme y para
 *     mantener actualizada la política con cambios regulatorios, conviene
 *     migrar a Iubenda apenas tengamos:
 *       1) Razón social formal (Monotributo o SAS).
 *       2) CUIT activo.
 *       3) MRR > USD 200/mes (justifica plan paid ~9 EUR/mes).
 *
 * Pasos de migración:
 *   - Ver `docs/iubenda-setup.md` para la guía completa (Free → Paid).
 *   - Reemplazar el texto de /terms, /privacy, /cookies por <iframe> embed
 *     de Iubenda o por links a iubenda.com/privacy-policy/<id>.
 *   - Insertar el script de Cookie Solution en el layout raíz.
 *   - Activar Consent DB para cumplir GDPR art. 7.4 (prueba de consentimiento).
 *
 * Mientras tanto este componente es un no-op: renderiza un comentario
 * minimalista (oculto por defecto) que sirve como anchor para devs.
 */

interface IubendaPlaceholderProps {
  /** Si true, muestra el aviso visualmente (útil en /admin o staging). */
  visible?: boolean
}

export function IubendaPlaceholder({ visible = false }: IubendaPlaceholderProps) {
  if (!visible) {
    // Render vacío en producción: solo deja un comentario HTML como hint.
    return (
      <span
        aria-hidden
        data-iubenda-placeholder="pending"
        style={{ display: 'none' }}
      />
    )
  }

  return (
    <aside
      role="note"
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        background: '#FFF8E1',
        border: '1px solid #E0C97A',
        fontSize: 13,
        lineHeight: 1.55,
        color: '#5A4A1F',
      }}
    >
      <strong>Pendiente Iubenda.</strong> Esta página usa copy legal custom mientras la sociedad esté en
      trámite. Cuando se inscriba la razón social y el MRR justifique el plan pago, migrar siguiendo{' '}
      <code>docs/iubenda-setup.md</code>. El copy actual ya cumple Ley 25.326 + Ley 24.240; Iubenda agrega
      cobertura GDPR, banner de cookies conforme y prueba documentada de consentimiento.
    </aside>
  )
}
