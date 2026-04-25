/**
 * Bloque de contacto reusable. Va al final de cada página legal:
 * /terms, /privacy, /cookies. Centraliza datos de la empresa,
 * emails de contacto y referencia a la AAIP (autoridad AR).
 *
 * Cuando se defina la razón social y CUIT, reemplazar los placeholders
 * `LEGAL_ENTITY` y `LEGAL_TAX_ID`.
 */

const LEGAL_ENTITY = '[Razón social — Monotributo en trámite]'
const LEGAL_TAX_ID = '[CUIT — pendiente de inscripción]'
const LEGAL_ADDRESS = 'Ciudad Autónoma de Buenos Aires, República Argentina'

export function LegalContact() {
  return (
    <section style={{ marginTop: 48 }}>
      <h2>Datos de la empresa y contacto</h2>
      <p>
        UnToque es operada bajo la titularidad de <strong>{LEGAL_ENTITY}</strong>, con domicilio fiscal y de
        notificaciones en {LEGAL_ADDRESS}.
      </p>
      <ul>
        <li>
          <strong>Razón social:</strong> {LEGAL_ENTITY}
        </li>
        <li>
          <strong>CUIT:</strong> {LEGAL_TAX_ID}
        </li>
        <li>
          <strong>Domicilio:</strong> {LEGAL_ADDRESS}
        </li>
        <li>
          <strong>Consultas generales:</strong>{' '}
          <a href="mailto:hola@deuntoque.com">hola@deuntoque.com</a>
        </li>
        <li>
          <strong>Privacidad / ejercicio de derechos / bajas:</strong>{' '}
          <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>
        </li>
      </ul>

      <h3>Autoridad de control (Argentina)</h3>
      <p>
        En Argentina, la autoridad de aplicación de la Ley 25.326 de Protección de Datos Personales es la{' '}
        <strong>Agencia de Acceso a la Información Pública (AAIP)</strong>. Tenés derecho a presentar un reclamo
        ante este organismo si considerás que el tratamiento de tus datos no se ajusta a la ley.
      </p>
      <ul>
        <li>
          Web:{' '}
          <a
            href="https://www.argentina.gob.ar/aaip"
            target="_blank"
            rel="noopener noreferrer"
          >
            argentina.gob.ar/aaip
          </a>
        </li>
        <li>Domicilio: Av. Pte. Gral. Julio A. Roca 710, piso 2, CABA</li>
        <li>
          Mesa de entradas:{' '}
          <a href="mailto:datospersonales@aaip.gob.ar">datospersonales@aaip.gob.ar</a>
        </li>
      </ul>

      <p style={{ marginTop: 24, fontSize: 13, opacity: 0.75 }}>
        Si tu consulta es una solicitud formal de acceso, rectificación, supresión u oposición sobre tus datos
        personales, escribinos a <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a> indicando tu
        nombre completo, DNI y el detalle del pedido. Te respondemos dentro de los 10 días corridos previstos
        por la Ley 25.326.
      </p>
    </section>
  )
}
