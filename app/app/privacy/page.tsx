import type { Metadata } from 'next'
import { LegalShell } from '@/components/legal/LegalShell'
import { LegalContact } from '@/components/legal/LegalContact'
import { IubendaPlaceholder } from '@/components/legal/IubendaPlaceholder'

export const metadata: Metadata = {
  title: 'Política de privacidad · UnToque',
  description:
    'Política de privacidad de UnToque conforme a la Ley 25.326 de Protección de Datos Personales (Argentina) y referencia GDPR para usuarios de la Unión Europea.',
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Política de privacidad" updated="2026-04-25">
      <IubendaPlaceholder />

      <section>
        <p>
          En UnToque tomamos la privacidad como un compromiso central del producto, no como un trámite
          legal. Esta política describe qué datos recolectamos, para qué los usamos, con quién los
          compartimos y cómo podés ejercer tus derechos. Está redactada conforme a la{' '}
          <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina y, para
          quienes nos visiten desde la Unión Europea, contempla las garantías equivalentes del{' '}
          <strong>Reglamento (UE) 2016/679 (GDPR)</strong>.
        </p>
      </section>

      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          El responsable del tratamiento de los datos personales es{' '}
          <strong>[Razón social — Monotributo en trámite]</strong>, comercialmente conocida como{' '}
          <strong>"UnToque"</strong>, con domicilio en la Ciudad Autónoma de Buenos Aires, República
          Argentina.
        </p>
        <p>
          La base de datos se encuentra en proceso de inscripción ante la{' '}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> conforme al artículo 21 de la
          Ley 25.326. El número de inscripción será publicado en esta página apenas sea otorgado por la
          AAIP.
        </p>
        <p>
          Contacto del responsable y delegado de privacidad:{' '}
          <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Qué datos recopilamos</h2>

        <h3>2.1. Comensal (usuario final)</h3>
        <ul>
          <li>Nombre y apellido.</li>
          <li>Número de teléfono celular (campo obligatorio para confirmar reserva por WhatsApp).</li>
          <li>Email (opcional, para envío de confirmación y recordatorios).</li>
          <li>
            Historial de reservas: restaurantes visitados, fechas, cantidad de comensales, estado
            (confirmada / cancelada / no-show), seña abonada.
          </li>
          <li>
            Preferencias y notas: alergias, restricciones alimentarias, motivo de la reserva (cumpleaños,
            aniversario), mesa preferida, idioma.
          </li>
          <li>
            Dirección IP y datos técnicos del dispositivo (navegador, sistema operativo) recolectados de
            forma agregada para seguridad y antifraude.
          </li>
        </ul>

        <h3>2.2. Restaurante (cliente B2B)</h3>
        <ul>
          <li>Razón social, nombre de fantasía, CUIT, condición fiscal frente al IVA.</li>
          <li>Domicilio comercial, teléfono y email de contacto.</li>
          <li>Datos de los integrantes del staff con acceso al panel (nombre, email, rol asignado).</li>
          <li>
            Información operativa: planos de mesas, menú, horarios, política de señas, integración con
            Mercado Pago.
          </li>
        </ul>

        <h3>2.3. Cookies y tecnologías de tracking</h3>
        <p>
          Utilizamos cookies de sesión y analíticas conforme se detalla en nuestra{' '}
          <a href="/cookies">política de cookies</a>. No usamos cookies publicitarias de terceros.
        </p>
      </section>

      <section>
        <h2>3. Finalidad del tratamiento</h2>
        <p>Tratamos tus datos exclusivamente para los siguientes fines:</p>
        <ul>
          <li>
            <strong>Gestión de reservas</strong>: confirmar, modificar y cancelar reservas; enviar
            recordatorios y notificaciones operativas.
          </li>
          <li>
            <strong>Comunicación operativa</strong>: WhatsApp transaccional (confirmaciones, recordatorios,
            cambios de turno), email de soporte.
          </li>
          <li>
            <strong>Facturación y obligaciones fiscales</strong>: emisión de facturas electrónicas vía AFIP,
            conservación de documentación contable.
          </li>
          <li>
            <strong>Mejora del servicio</strong>: análisis estadístico agregado y anonimizado para optimizar
            la Plataforma.
          </li>
          <li>
            <strong>Prevención de fraude</strong>: detección de cuentas duplicadas, no-shows reiterados o
            uso indebido.
          </li>
          <li>
            <strong>Marketing directo</strong> (solo con consentimiento previo y revocable): novedades del
            producto, promociones de restaurantes elegidos por vos.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Base legal del tratamiento</h2>
        <ul>
          <li>
            <strong>Ejecución de contrato</strong> (art. 5 inc. 2.b Ley 25.326): los datos necesarios para
            prestar el servicio de reservas y suscripción.
          </li>
          <li>
            <strong>Consentimiento expreso</strong> (art. 5 inc. 1 Ley 25.326 / art. 6 GDPR): comunicaciones
            de marketing, notificaciones push, almacenamiento de preferencias no esenciales.
          </li>
          <li>
            <strong>Interés legítimo</strong>: analytics agregados, prevención de fraude, mejora del
            producto, siempre balanceando con tus derechos como titular.
          </li>
          <li>
            <strong>Cumplimiento de obligaciones legales</strong>: conservación de comprobantes fiscales
            (AFIP), respuesta a requerimientos judiciales.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Con quién compartimos tus datos</h2>
        <p>
          Compartimos datos únicamente con los proveedores estrictamente necesarios para operar la
          Plataforma. Cada uno actúa como <em>encargado del tratamiento</em> bajo contrato escrito que
          garantiza confidencialidad y nivel de seguridad equivalente.
        </p>
        <ul>
          <li>
            <strong>Mercado Pago S.R.L. (Argentina)</strong> — procesamiento de cobros de suscripción y
            señas. Recibe los datos mínimos del comprador y del medio de pago. UnToque no almacena datos de
            tarjeta.
          </li>
          <li>
            <strong>Resend, Inc. (EU/US)</strong> — envío transaccional de emails (confirmaciones,
            recordatorios). Recibe nombre y email.
          </li>
          <li>
            <strong>Meta Platforms — WhatsApp Cloud API (Irlanda/EE.UU.)</strong> — envío de notificaciones
            por WhatsApp. Recibe nombre, número de teléfono y el contenido del mensaje transaccional.
          </li>
          <li>
            <strong>Vercel, Inc. (EE.UU.)</strong> — hosting de la aplicación web y CDN. Recibe metadatos de
            request (IP, user-agent) en logs de servidor.
          </li>
          <li>
            <strong>Supabase, Inc. (EE.UU.)</strong> — base de datos PostgreSQL gestionada y autenticación.
            Almacena la totalidad de los datos personales descritos en la sección 2.
          </li>
          <li>
            <strong>Sentry (EE.UU.)</strong> — monitoreo de errores en producción. Recibe trazas de error
            que pueden incluir IP y user-agent; configurado para <em>scrub</em> automático de PII.
          </li>
          <li>
            <strong>AFIP</strong> — facturación electrónica conforme normativa fiscal argentina.
          </li>
        </ul>
        <p>
          <strong>No vendemos datos personales a terceros</strong>, ni los compartimos para finalidades de
          publicidad de terceros.
        </p>
      </section>

      <section>
        <h2>6. Transferencia internacional de datos</h2>
        <p>
          Algunos de nuestros proveedores (Resend, Vercel, Supabase, Sentry) procesan datos fuera de la
          República Argentina, principalmente en Estados Unidos y Unión Europea. Estas transferencias se
          realizan con garantías adecuadas:
        </p>
        <ul>
          <li>
            <strong>Cláusulas Contractuales Tipo (Standard Contractual Clauses)</strong> aprobadas por la
            Comisión Europea y reconocidas como nivel adecuado por la AAIP (Disposición 60-E/2016).
          </li>
          <li>Contratos de tratamiento de datos (DPA) firmados con cada proveedor.</li>
          <li>Cifrado en tránsito (TLS 1.2+) y en reposo (AES-256).</li>
        </ul>
        <p>
          Podés solicitar copia de los acuerdos de transferencia escribiéndonos a{' '}
          <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>.
        </p>
      </section>

      <section>
        <h2>7. Conservación de los datos</h2>
        <ul>
          <li>
            <strong>Datos de cuenta activa</strong>: se conservan mientras tu cuenta esté operativa.
          </li>
          <li>
            <strong>Datos posteriores a la baja</strong>: se conservan por un plazo de hasta{' '}
            <strong>5 años</strong> por imperativo fiscal (AFIP — RG 4290 y concordantes), únicamente con
            fines contables y de eventual respuesta a requerimientos legales.
          </li>
          <li>
            <strong>Logs técnicos y de error</strong>: 90 días.
          </li>
          <li>
            <strong>Métricas agregadas y anonimizadas</strong>: indefinidas (no permiten reidentificarte).
          </li>
        </ul>
        <p>
          Cumplido el plazo de conservación legal, los datos se eliminan o anonimizan irreversiblemente.
        </p>
      </section>

      <section>
        <h2>8. Tus derechos como titular</h2>
        <p>
          La Ley 25.326 (arts. 14, 15 y 16) y, para usuarios EU, el GDPR (arts. 15 a 22), te reconocen los
          siguientes derechos sobre tus datos personales:
        </p>
        <ul>
          <li>
            <strong>Acceso</strong>: obtener confirmación de qué datos tuyos tratamos y una copia de ellos.
          </li>
          <li>
            <strong>Rectificación</strong>: corregir datos inexactos o incompletos.
          </li>
          <li>
            <strong>Actualización</strong>: mantener vigentes los datos que cambian con el tiempo.
          </li>
          <li>
            <strong>Supresión</strong>: solicitar la eliminación de tus datos cuando ya no sean necesarios o
            hayas revocado el consentimiento.
          </li>
          <li>
            <strong>Oposición</strong>: oponerte al tratamiento para fines de marketing directo o por
            motivos vinculados a tu situación particular.
          </li>
          <li>
            <strong>Portabilidad</strong> (usuarios EU): recibir tus datos en formato estructurado
            interoperable.
          </li>
        </ul>
        <p>
          <strong>Cómo ejercerlos:</strong> escribinos a{' '}
          <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a> indicando tu nombre completo, DNI
          y el detalle del pedido. Respondemos dentro de los <strong>10 días corridos</strong> previstos
          por el art. 14 de la Ley 25.326. El ejercicio de estos derechos es gratuito.
        </p>
        <p>
          Si considerás que el tratamiento no se ajusta a la ley, podés presentar reclamo ante la{' '}
          <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> —{' '}
          <a
            href="https://www.argentina.gob.ar/aaip"
            target="_blank"
            rel="noopener noreferrer"
          >
            argentina.gob.ar/aaip
          </a>
          .
        </p>
      </section>

      <section>
        <h2>9. Notificación de incidentes de seguridad</h2>
        <p>
          En caso de un incidente de seguridad que afecte datos personales (acceso no autorizado, pérdida o
          alteración), notificaremos a la <strong>AAIP dentro de las 72 horas</strong> de tomar
          conocimiento, conforme a la Resolución AAIP 47/2018, y a los titulares afectados a la mayor
          brevedad cuando el incidente pueda generar un riesgo para sus derechos. La notificación incluirá
          la naturaleza del incidente, los datos comprometidos, las medidas adoptadas y las
          recomendaciones para minimizar el impacto.
        </p>
      </section>

      <section>
        <h2>10. Marketing y baja</h2>
        <p>
          Solo te enviamos comunicaciones de marketing si nos diste consentimiento expreso al registrarte o
          posteriormente. Podés revocar ese consentimiento en cualquier momento, sin costo y sin necesidad
          de invocar causa, mediante:
        </p>
        <ul>
          <li>
            Respondiendo <strong>"BAJA"</strong> (sin distinción de mayúsculas) al WhatsApp del cual recibís
            la comunicación.
          </li>
          <li>Tocando el link de baja al pie de cada email.</li>
          <li>Desactivando las notificaciones push desde la configuración de tu perfil.</li>
          <li>
            Escribiéndonos a <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>.
          </li>
        </ul>
        <p>
          Las comunicaciones <em>transaccionales</em> (confirmaciones, cambios de turno) se envían como
          parte de la prestación del servicio y no pueden desactivarse mientras mantengas reservas activas.
        </p>
      </section>

      <section>
        <h2>11. Datos de menores</h2>
        <p>
          La Plataforma está dirigida a personas mayores de 18 años. No solicitamos ni almacenamos
          conscientemente datos de menores sin autorización del responsable legal. Si detectás que un
          menor utilizó la Plataforma sin autorización, escribinos a{' '}
          <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a> y eliminaremos los datos en
          forma inmediata.
        </p>
      </section>

      <section>
        <h2>12. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política para reflejar cambios legales, técnicos u operativos.
          Notificaremos cualquier cambio sustancial por email y mediante aviso destacado en la Plataforma
          con al menos 15 días de anticipación. La fecha de la última actualización figura al inicio de
          este documento: <strong>25 de abril de 2026</strong>.
        </p>
      </section>

      <LegalContact />
    </LegalShell>
  )
}
