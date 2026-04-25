import type { Metadata } from 'next'
import { LegalShell } from '@/components/legal/LegalShell'

export const metadata: Metadata = {
  title: 'Privacidad · UnToque',
  description: 'Política de privacidad de UnToque. Cómo tratamos tus datos según la ley 25.326.',
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Política de privacidad" updated="2026-04-24">
      <section>
        <h2>1. Responsable</h2>
        <p>
          UnToque SAS, con domicilio en la República Argentina, es el responsable del tratamiento de tus datos
          personales según la ley 25.326 de Protección de Datos Personales.
        </p>
      </section>

      <section>
        <h2>2. Qué datos recolectamos</h2>
        <ul>
          <li><strong>Cuenta</strong>: nombre, email, teléfono.</li>
          <li><strong>Reservas</strong>: fechas, restaurantes, pax, notas que ingresás (ej. alergias, aniversario).</li>
          <li><strong>Pagos</strong>: Mercado Pago procesa — nosotros solo guardamos el ID de transacción y el estado.</li>
          <li><strong>Uso</strong>: eventos agregados (qué página visitaste, cuándo reservaste) para mejorar el servicio.</li>
          <li><strong>Dispositivo</strong>: tipo de browser, IP (agregada), aceptación de notificaciones push.</li>
        </ul>
      </section>

      <section>
        <h2>3. Para qué los usamos</h2>
        <ul>
          <li>Procesar tus reservas y coordinarlas con el restaurante.</li>
          <li>Enviar recordatorios (WhatsApp, email, push) si aceptaste recibirlos.</li>
          <li>Mejorar la Plataforma (analytics agregados, no individualizados).</li>
          <li>Prevenir fraude (detectar no-shows reiterados, cuentas duplicadas).</li>
          <li>Cumplir obligaciones legales (facturación, requerimientos judiciales).</li>
        </ul>
      </section>

      <section>
        <h2>4. Con quién compartimos</h2>
        <ul>
          <li><strong>Restaurantes</strong>: ven tu nombre, teléfono y la reserva. Nada más.</li>
          <li><strong>Mercado Pago</strong>: datos de pago que vos ingresás directamente en su checkout.</li>
          <li><strong>Meta (WhatsApp)</strong>: solo el teléfono al que enviamos mensajes si los habilitás.</li>
          <li><strong>Proveedores técnicos</strong>: Supabase (hosting DB), Vercel (hosting app), Sentry (errores). Todos con contratos de tratamiento de datos.</li>
        </ul>
        <p>No vendemos ni cedemos tus datos para marketing de terceros.</p>
      </section>

      <section>
        <h2>5. Cuánto tiempo los guardamos</h2>
        <ul>
          <li>Datos de cuenta: mientras tu cuenta esté activa.</li>
          <li>Reservas: 5 años (obligación fiscal AR).</li>
          <li>Logs de error (Sentry): 90 días.</li>
          <li>Analytics agregados: indefinido (ya no están vinculados a vos).</li>
        </ul>
      </section>

      <section>
        <h2>6. Tus derechos</h2>
        <p>Según la ley 25.326 podés:</p>
        <ul>
          <li><strong>Acceder</strong> a tus datos — te los enviamos a pedido.</li>
          <li><strong>Rectificar</strong> datos incorrectos — desde tu perfil o por email.</li>
          <li><strong>Eliminar</strong> tu cuenta — borramos todo en 30 días, excepto lo que estamos obligados a conservar.</li>
          <li><strong>Oponerte</strong> a comunicaciones de marketing — opt-out en la app o respondé "BAJA" al WhatsApp.</li>
        </ul>
        <p>
          Contacto de privacidad: <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>
        </p>
        <p>
          Agencia de Acceso a la Información Pública (autoridad de control):{' '}
          <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">
            argentina.gob.ar/aaip
          </a>
        </p>
      </section>

      <section>
        <h2>7. Cookies y tracking</h2>
        <p>
          Usamos cookies técnicas (sesión, preferencias) y, si las aceptás, analytics agregados. Detalles en
          nuestra <a href="/cookies">política de cookies</a>.
        </p>
      </section>

      <section>
        <h2>8. Seguridad</h2>
        <p>
          Encriptamos datos en tránsito (HTTPS/TLS) y en reposo. Supabase ofrece certificación SOC 2. Tu
          contraseña está hasheada. Nunca guardamos datos de tarjeta.
        </p>
      </section>

      <section>
        <h2>9. Menores</h2>
        <p>
          UnToque está pensado para mayores de 18 años. Si sos menor, usá la Plataforma con autorización de tu
          responsable legal.
        </p>
      </section>

      <section>
        <h2>10. Cambios</h2>
        <p>
          Si modificamos esta política, te avisamos por email con al menos 15 días de anticipación. El uso
          continuado implica aceptación.
        </p>
      </section>
    </LegalShell>
  )
}
