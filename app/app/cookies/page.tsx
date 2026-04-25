import type { Metadata } from 'next'
import { LegalShell } from '@/components/legal/LegalShell'

export const metadata: Metadata = {
  title: 'Cookies · UnToque',
  description: 'Qué cookies usa UnToque y cómo podés controlarlas.',
}

export default function CookiesPage() {
  return (
    <LegalShell title="Política de cookies" updated="2026-04-24">
      <section>
        <h2>1. Qué son las cookies</h2>
        <p>
          Pequeños archivos que tu navegador guarda cuando visitás un sitio. Las usamos para mantenerte
          logueado, recordar preferencias y medir uso agregado.
        </p>
      </section>

      <section>
        <h2>2. Qué cookies usamos</h2>
        <h3>Cookies técnicas (necesarias)</h3>
        <ul>
          <li><code>sb-*</code> — Supabase Auth. Mantiene tu sesión iniciada.</li>
          <li><code>theme</code> — Preferencia dark/light del panel.</li>
        </ul>
        <h3>Cookies de preferencia</h3>
        <ul>
          <li><code>untoque-push-dismissed</code> — Recordamos si ya te preguntamos por push.</li>
          <li><code>untoque-locale</code> — Tu idioma (solo español AR por ahora).</li>
        </ul>
        <h3>Analytics</h3>
        <p>
          Usamos <a href="https://plausible.io" target="_blank" rel="noopener noreferrer">Plausible Analytics</a>,
          que <strong>no usa cookies</strong> y es privacy-friendly. No necesitás aceptar banners para navegar.
        </p>
      </section>

      <section>
        <h2>3. Cómo controlarlas</h2>
        <ul>
          <li>
            <strong>Chrome</strong>: Configuración → Privacidad → Cookies
          </li>
          <li>
            <strong>Safari</strong>: Preferencias → Privacidad
          </li>
          <li>
            <strong>Firefox</strong>: Preferencias → Privacidad y seguridad
          </li>
        </ul>
        <p>
          Si desactivás cookies técnicas, la Plataforma no va a funcionar (no podrás loguearte). Las de
          preferencia son opcionales.
        </p>
      </section>

      <section>
        <h2>4. Terceros</h2>
        <p>
          Al pagar con Mercado Pago, te redirigimos a su dominio donde ellos ponen sus propias cookies según su
          política. No tenemos control sobre eso.
        </p>
      </section>

      <section>
        <h2>5. Contacto</h2>
        <p>
          <a href="mailto:privacidad@deuntoque.com">privacidad@deuntoque.com</a>
        </p>
      </section>
    </LegalShell>
  )
}
