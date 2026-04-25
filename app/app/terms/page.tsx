import type { Metadata } from 'next'
import { LegalShell } from '@/components/legal/LegalShell'
import { LegalContact } from '@/components/legal/LegalContact'
import { CancellationButton } from '@/components/legal/CancellationButton'
import { IubendaPlaceholder } from '@/components/legal/IubendaPlaceholder'

export const metadata: Metadata = {
  title: 'Términos y condiciones · UnToque',
  description:
    'Términos y condiciones de uso de UnToque, plataforma SaaS de reservas para restaurantes en Argentina. Marco legal Ley 24.240 + Ley 25.326.',
}

export default function TermsPage() {
  return (
    <LegalShell title="Términos y condiciones" updated="2026-04-25">
      <IubendaPlaceholder />

      <section>
        <h2>1. Aceptación y partes</h2>
        <p>
          Estos Términos y Condiciones (los <strong>"Términos"</strong>) regulan el acceso y uso de la
          plataforma <strong>UnToque</strong> (la <strong>"Plataforma"</strong>), un servicio digital de
          gestión de reservas para restaurantes operado en la República Argentina por{' '}
          <strong>[Razón social — Monotributo en trámite]</strong> (en adelante, <strong>"UnToque"</strong>,{' '}
          <em>"nosotros"</em>).
        </p>
        <p>Las partes involucradas son tres:</p>
        <ul>
          <li>
            <strong>UnToque</strong>: prestador del servicio SaaS (software como servicio) que provee la
            tecnología.
          </li>
          <li>
            <strong>Restaurante</strong> o <strong>"Negocio"</strong>: persona humana o jurídica que contrata
            la suscripción a UnToque para gestionar sus reservas y canales de comunicación.
          </li>
          <li>
            <strong>Comensal</strong> o <strong>"Usuario final"</strong>: persona que utiliza la Plataforma
            para reservar mesa en un Restaurante adherido.
          </li>
        </ul>
        <p>
          Al registrarte, contratar la suscripción o reservar a través de la Plataforma, declarás haber leído,
          comprendido y aceptado estos Términos en forma íntegra. Si no estás de acuerdo con cualquiera de
          ellos, no utilices la Plataforma.
        </p>
      </section>

      <section>
        <h2>2. Definiciones</h2>
        <ul>
          <li>
            <strong>Reserva</strong>: solicitud confirmada de mesa para un día, horario y cantidad de
            comensales determinada en un Restaurante adherido.
          </li>
          <li>
            <strong>Seña</strong>: pago anticipado, parcial o total, que el Comensal abona al confirmar la
            Reserva. Se descuenta del consumo final cuando el Comensal se presenta.
          </li>
          <li>
            <strong>No-show</strong>: ausencia total del Comensal en el día y horario reservado, sin
            cancelación previa.
          </li>
          <li>
            <strong>Late-cancel</strong> o <strong>cancelación tardía</strong>: cancelación realizada por el
            Comensal dentro de la ventana de gracia definida por el Restaurante (típicamente 2 a 24 horas
            antes del turno).
          </li>
          <li>
            <strong>Penalización</strong>: monto que el Restaurante puede retener de la seña o cargar al
            medio de pago en caso de no-show o late-cancel, según política del Restaurante informada al
            Comensal antes de confirmar la Reserva.
          </li>
          <li>
            <strong>Suscripción</strong>: contrato de prestación continua mediante el cual el Restaurante
            accede a las funcionalidades de UnToque a cambio del pago mensual establecido.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Servicio prestado y limitaciones</h2>
        <p>
          UnToque es una herramienta tecnológica que conecta a Comensales con Restaurantes adheridos. La
          Plataforma facilita: (i) descubrimiento de restaurantes, (ii) reservas con o sin seña, (iii)
          gestión de mesas y turnos, (iv) comunicación operativa por WhatsApp y email, (v) reportes y
          analítica para el Restaurante.
        </p>
        <p>
          UnToque <strong>no opera el restaurante ni presta servicio gastronómico</strong>. La calidad de la
          comida, la atención, el cumplimiento horario y la experiencia presencial son responsabilidad
          exclusiva del Restaurante. UnToque actúa como intermediario tecnológico.
        </p>
        <p>
          La Plataforma se ofrece <em>"tal cual está"</em> y <em>"según disponibilidad"</em>. Nos reservamos
          el derecho a interrumpir el servicio por mantenimiento, mejoras o causas de fuerza mayor, con aviso
          razonable cuando sea posible.
        </p>
      </section>

      <section>
        <h2>4. Cuenta de usuario</h2>
        <p>Para utilizar la Plataforma necesitás crear una cuenta. Te comprometés a:</p>
        <ul>
          <li>Proporcionar datos verídicos, exactos y actualizados.</li>
          <li>
            Elegir una contraseña segura y mantenerla en absoluta reserva. Sos responsable de toda actividad
            que ocurra bajo tu cuenta.
          </li>
          <li>
            Notificarnos de inmediato a <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a> si
            sospechás que tu cuenta fue accedida sin autorización.
          </li>
          <li>No transferir, prestar ni compartir tu cuenta con terceros.</li>
        </ul>
        <p>
          Podemos suspender o cerrar cuentas que incumplan estos Términos, presenten datos falsos o sean
          utilizadas para actividades ilegítimas, previo aviso cuando corresponda.
        </p>
      </section>

      <section>
        <h2>5. Pago y suscripción</h2>
        <p>
          La suscripción al plan mensual de UnToque para Restaurantes tiene un precio de{' '}
          <strong>ARS 30.000 (treinta mil pesos argentinos) por mes</strong>, IVA 21% incluido cuando
          corresponda según el régimen tributario del prestador. Mientras la sociedad opere bajo Monotributo,
          la facturación se emite con el tratamiento fiscal que corresponda a esa categoría.
        </p>
        <p>
          La cobranza se procesa a través de <strong>Mercado Pago Suscripciones</strong> (servicio de pagos
          recurrentes). Al contratar:
        </p>
        <ul>
          <li>
            Autorizás el débito automático mensual contra el medio de pago que registres en Mercado Pago.
          </li>
          <li>
            El primer cobro se efectúa al confirmar la suscripción. Los siguientes, en la misma fecha de cada
            mes calendario.
          </li>
          <li>
            Si el cobro falla (por fondos insuficientes, tarjeta vencida u otro), Mercado Pago reintenta
            automáticamente. Si tras los reintentos el pago no se concreta, suspendemos el acceso al panel
            hasta regularizar.
          </li>
          <li>
            La factura electrónica se emite vía AFIP y se envía al email registrado dentro de los 10 días
            hábiles siguientes al cobro.
          </li>
        </ul>
        <p>
          UnToque puede modificar el precio de la suscripción notificando con <strong>30 días</strong> de
          anticipación al email registrado. Si no aceptás el nuevo precio, podés dar de baja sin penalidad
          antes de la fecha de entrada en vigor.
        </p>
      </section>

      <section>
        <h2>6. Botón de arrepentimiento — Ley 24.240 art. 34</h2>
        <p>
          De acuerdo con el artículo 34 de la Ley 24.240 de Defensa del Consumidor,{' '}
          <strong>
            tenés derecho a revocar la contratación de la suscripción dentro de los 10 días corridos contados
            desde su celebración, sin necesidad de invocar causa y sin penalidad alguna
          </strong>
          . Para ejercer este derecho podés:
        </p>
        <ul>
          <li>
            Escribirnos a <a href="mailto:hola@deuntoque.com">hola@deuntoque.com</a> con el asunto{' '}
            <strong>"BAJA — derecho de arrepentimiento Ley 24.240"</strong>, indicando tu razón social y el
            email registrado.
          </li>
          <li>
            Tocar el botón <strong>"Cancelar suscripción"</strong> dentro de tu panel, en la sección{' '}
            <code>/dashboard/billing</code>.
          </li>
        </ul>
        <p>
          Procesaremos la baja dentro de las 48 horas hábiles y reintegraremos cualquier monto cobrado por
          ese período. La devolución se realiza a través del mismo medio de pago utilizado para la
          contratación.
        </p>

        <CancellationButton variant="inline" />
      </section>

      <section>
        <h2>7. Política de cancelaciones y reembolsos</h2>
        <p>
          Pasados los 10 días del derecho de arrepentimiento, podés cancelar la suscripción en cualquier
          momento desde tu panel. La baja se hace efectiva al cierre del ciclo de facturación en curso, sin
          penalidad. No emitimos reembolsos por períodos parcialmente consumidos, salvo que medie
          incumplimiento atribuible a UnToque.
        </p>
        <p>
          Las cancelaciones de Reservas por parte del Comensal se rigen por la política del Restaurante
          informada antes de confirmar la Reserva (ventana de gracia, retención de seña, etc.). UnToque no
          tiene injerencia sobre los términos comerciales que cada Restaurante establece con sus comensales.
        </p>
      </section>

      <section>
        <h2>8. Comportamiento prohibido</h2>
        <p>Queda expresamente prohibido al Usuario:</p>
        <ul>
          <li>
            Crear reservas falsas, suplantar identidades o utilizar datos de terceros sin su consentimiento.
          </li>
          <li>
            Realizar <em>spam</em>, envíos masivos no solicitados o intentar acceder a datos de otros
            Usuarios.
          </li>
          <li>
            Realizar <em>scraping</em>, extracción automatizada, ingeniería inversa, descompilación o
            cualquier intento de obtener el código fuente de la Plataforma.
          </li>
          <li>
            Intentar evadir penalizaciones por no-show, manipular precios, alterar la disponibilidad o
            interferir con la operación normal del servicio.
          </li>
          <li>Utilizar la Plataforma para actividades contrarias a la ley, la moral o las buenas costumbres.</li>
          <li>Distribuir malware, virus, troyanos o cualquier código malicioso.</li>
        </ul>
        <p>
          El incumplimiento habilita a UnToque a suspender o dar de baja la cuenta, conservar logs para
          eventuales acciones legales y, cuando corresponda, denunciar el hecho ante la autoridad competente.
        </p>
      </section>

      <section>
        <h2>9. Propiedad intelectual</h2>
        <p>
          La marca <strong>"UnToque"</strong>, su logotipo, identidad visual, código fuente, diseños,
          arquitectura, base de datos y demás elementos de la Plataforma son de titularidad exclusiva de
          UnToque y se encuentran <strong>en trámite de registro ante el INPI en clases 42 y 43</strong>{' '}
          (servicios tecnológicos y servicios de restauración, respectivamente). Ningún uso, reproducción o
          modificación está permitido sin autorización expresa por escrito.
        </p>
        <p>
          Los contenidos cargados por los Restaurantes (fotos del local, menúes, descripciones) son
          propiedad de cada Restaurante. Al cargarlos a la Plataforma, otorgan a UnToque una licencia no
          exclusiva, mundial y gratuita para reproducirlos en el contexto del servicio.
        </p>
      </section>

      <section>
        <h2>10. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida que permite la legislación aplicable, UnToque <strong>no será responsable</strong>{' '}
          por:
        </p>
        <ul>
          <li>
            No-shows, late-cancels o conducta del Comensal en el Restaurante (ni el Restaurante en relación
            con el Comensal).
          </li>
          <li>
            Lucro cesante, daño emergente indirecto, pérdida de oportunidad de negocio o daños consecuentes
            derivados del uso o imposibilidad de uso de la Plataforma.
          </li>
          <li>
            Fallas atribuibles a terceros proveedores (Mercado Pago, Meta WhatsApp, Resend, Vercel, Supabase,
            Sentry, operadoras telefónicas o ISPs).
          </li>
          <li>Eventos de fuerza mayor o caso fortuito (cortes de servicios públicos, ataques DDoS, etc.).</li>
          <li>Conflictos comerciales entre Restaurante y Comensal.</li>
        </ul>
        <p>
          La responsabilidad total agregada de UnToque, ante cualquier reclamo, no excederá el equivalente a{' '}
          <strong>tres (3) cuotas mensuales</strong> de suscripción del reclamante.
        </p>
      </section>

      <section>
        <h2>11. Modificaciones a los Términos</h2>
        <p>
          UnToque puede actualizar estos Términos. Las modificaciones se notificarán por email al
          responsable de la cuenta y mediante aviso destacado en la Plataforma con al menos{' '}
          <strong>30 días</strong> de anticipación a su entrada en vigor. Si continuás usando el servicio
          luego de esa fecha, se considera que aceptaste los nuevos Términos. Si no estás de acuerdo, podés
          dar de baja antes sin penalidad.
        </p>
      </section>

      <section>
        <h2>12. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por las leyes de la <strong>República Argentina</strong>. Para cualquier
          controversia, las partes se someten a la jurisdicción de los <strong>tribunales ordinarios de la
          Ciudad Autónoma de Buenos Aires</strong>, renunciando a cualquier otro fuero o jurisdicción que
          pudiera corresponderles, sin perjuicio del derecho del Comensal-consumidor a optar por su propio
          domicilio cuando la legislación de defensa del consumidor así lo permita.
        </p>
      </section>

      <section>
        <h2>13. Contacto</h2>
        <p>
          Cualquier consulta, notificación, denuncia o reclamo relacionado con estos Términos podés
          dirigirlo a <a href="mailto:hola@deuntoque.com">hola@deuntoque.com</a>.
        </p>
      </section>

      <LegalContact />
    </LegalShell>
  )
}
