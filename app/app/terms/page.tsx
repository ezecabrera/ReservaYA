import type { Metadata } from 'next'
import { LegalShell } from '@/components/legal/LegalShell'

export const metadata: Metadata = {
  title: 'Términos y condiciones · UnToque',
  description: 'Términos de uso de la plataforma UnToque para clientes finales.',
}

export default function TermsPage() {
  return (
    <LegalShell title="Términos y condiciones" updated="2026-04-24">
      <section>
        <h2>1. Aceptación</h2>
        <p>
          Al usar <strong>UnToque</strong> (la "Plataforma") aceptás estos términos. Si no estás de acuerdo, no
          uses la Plataforma. La Plataforma es operada por UnToque SAS, constituida bajo las leyes de la
          República Argentina.
        </p>
      </section>

      <section>
        <h2>2. Qué es UnToque</h2>
        <p>
          UnToque conecta comensales con restaurantes adheridos. Reservás mesas, pagás señas opcionales y
          gestionás tus reservas desde la app. Los restaurantes son responsables del servicio, la comida y el
          trato; UnToque facilita la coordinación.
        </p>
      </section>

      <section>
        <h2>3. Reservas y señas</h2>
        <ul>
          <li>Las reservas se confirman cuando el restaurante las acepta o, si exige seña, cuando completás el pago.</li>
          <li>La seña se descuenta del consumo final. Si no te presentás (<em>no-show</em>), el restaurante puede retenerla.</li>
          <li>Podés cancelar con al menos {'{'}horas de gracia{'}'} antes del turno para obtener reembolso completo. Cancelaciones tardías pueden tener reembolso parcial o nulo, según el restaurante.</li>
        </ul>
      </section>

      <section>
        <h2>4. Comportamiento del usuario</h2>
        <p>
          No podés crear reservas falsas, usar datos de terceros sin su consentimiento, ni intentar evadir las
          penalizaciones por no-show. Reservamos el derecho de suspender cuentas que violen estos términos.
        </p>
      </section>

      <section>
        <h2>5. Reviews y calificaciones</h2>
        <p>
          Tus reviews son públicas. Los restaurantes pueden responder con un descargo público. No toleramos
          contenido discriminatorio, difamatorio ni spam. Reservamos el derecho de moderar o eliminar reviews
          que violen nuestras políticas.
        </p>
      </section>

      <section>
        <h2>6. Pagos</h2>
        <p>
          Los pagos se procesan a través de Mercado Pago. UnToque no almacena datos de tarjetas. Las comisiones
          aplicables (generalmente 4.99% + IVA) son retenidas por Mercado Pago. Para consultas de pago contactá
          directamente a{' '}
          <a href="https://mercadopago.com.ar" target="_blank" rel="noopener noreferrer">
            mercadopago.com.ar
          </a>
          .
        </p>
      </section>

      <section>
        <h2>7. Privacidad</h2>
        <p>
          Tu información personal se trata según nuestra{' '}
          <a href="/privacy">política de privacidad</a>. Tenés derecho a acceder, rectificar y solicitar la
          eliminación de tus datos (ley 25.326).
        </p>
      </section>

      <section>
        <h2>8. Limitación de responsabilidad</h2>
        <p>
          UnToque no se responsabiliza por: calidad de servicio del restaurante, alergias o intolerancias no
          comunicadas, demoras en el restaurante, ni por disputas entre comensal y restaurante. La Plataforma se
          ofrece "tal cual está".
        </p>
      </section>

      <section>
        <h2>9. Cambios en los términos</h2>
        <p>
          Podemos modificar estos términos. Te notificaremos por email o en la app. El uso continuado implica
          aceptación de los cambios.
        </p>
      </section>

      <section>
        <h2>10. Contacto</h2>
        <p>
          Dudas o reclamos: <a href="mailto:hola@deuntoque.com">hola@deuntoque.com</a>.
        </p>
      </section>
    </LegalShell>
  )
}
