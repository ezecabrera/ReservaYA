import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · Un Toque',
}

const NAVY = '#0F3460'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-sf">
      <header className="border-b border-[rgba(0,0,0,0.07)] bg-white">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-[18px] text-tx tracking-tight">
            Un <span style={{ color: NAVY }}>Toque</span>
          </Link>
          <Link href="/privacy" className="text-tx2 hover:text-tx text-[13px] font-semibold">
            Privacidad
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">Legal</p>
        <h1 className="font-display text-[32px] text-tx leading-none mb-2">Términos y Condiciones</h1>
        <p className="text-tx2 text-[13px] mb-8">
          Última actualización: {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-6 text-tx2 text-[14px] leading-relaxed">
          <Section title="1. Objeto">
            Estos Términos regulan el uso de <strong>Un Toque</strong>, una plataforma SaaS de reservas
            para restaurantes operada en la República Argentina. Al contratar el servicio y/o usar la
            plataforma, el restaurante contratante (&quot;Cliente&quot;) y sus usuarios aceptan estos
            términos en su totalidad.
          </Section>
          <Section title="2. Servicio">
            Un Toque provee un panel de gestión, un widget de reservas y herramientas de comunicación
            con comensales. El servicio se presta en modalidad SaaS, sin garantías de disponibilidad
            ininterrumpida aunque nos comprometemos a un SLA razonable (95% uptime mensual).
          </Section>
          <Section title="3. Suscripción y pagos">
            El servicio se factura mensualmente mediante suscripción automática procesada por
            Mercado Pago. El primer período puede ser gratuito a discreción de Un Toque. Si un cobro
            falla, el Cliente tiene 7 días para regularizar antes de la suspensión del servicio.
          </Section>
          <Section title="4. Datos del Cliente y de los comensales">
            El Cliente mantiene la titularidad de los datos cargados en la plataforma. Un Toque procesa
            datos de comensales en carácter de co-responsable conforme a la Ley 25.326. El Cliente
            debe informar a sus comensales sobre esta plataforma y su política de privacidad.
          </Section>
          <Section title="5. Uso aceptable">
            No está permitido usar el servicio para actividades ilegales, realizar spam, extraer
            datos mediante scraping, ni interferir con el funcionamiento técnico. El abuso puede
            causar suspensión inmediata sin reembolso.
          </Section>
          <Section title="6. Propiedad intelectual">
            Un Toque retiene la propiedad de la plataforma, su código, diseño y marca. El Cliente
            recibe una licencia de uso limitada, no exclusiva y revocable mientras la suscripción
            esté activa.
          </Section>
          <Section title="7. Limitación de responsabilidad">
            La responsabilidad máxima de Un Toque frente al Cliente se limita al monto abonado en
            los 3 meses previos al incidente. No somos responsables del servicio gastronómico que
            presta el restaurante, ni de pérdidas indirectas, lucro cesante o daño reputacional.
          </Section>
          <Section title="8. Cancelación">
            El Cliente puede cancelar la suscripción en cualquier momento desde su cuenta de
            Mercado Pago. La baja es efectiva al fin del período de facturación actual. No
            reembolsamos pagos parciales.
          </Section>
          <Section title="9. Modificaciones">
            Podemos actualizar estos términos notificando por email con 15 días de anticipación
            los cambios materiales. El uso continuado del servicio implica aceptación.
          </Section>
          <Section title="10. Ley aplicable y jurisdicción">
            Estos términos se rigen por la ley argentina. Cualquier controversia se someterá a
            los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando a
            cualquier otro fuero que pudiera corresponder.
          </Section>
          <Section title="11. Contacto">
            Consultas legales: <a href="mailto:legal@untoque.app" className="font-semibold" style={{ color: NAVY }}>legal@untoque.app</a>
          </Section>

          <div className="rounded-md bg-white border border-[rgba(0,0,0,0.06)] p-4 mt-8">
            <p className="text-tx3 text-[12px]">
              <strong className="text-tx2">Borrador inicial.</strong> Este documento requiere revisión
              por abogado antes del lanzamiento comercial.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-sans-black text-[18px] text-tx mb-2">{title}</h2>
      <p>{children}</p>
    </section>
  )
}
