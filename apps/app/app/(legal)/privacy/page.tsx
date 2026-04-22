import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad · UnToque',
  description: 'Cómo tratamos tus datos personales en UnToque.',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
        Legal
      </p>
      <h1 className="font-display text-[32px] text-tx leading-none mb-2">
        Política de Privacidad
      </h1>
      <p className="text-tx2 text-[13px] mb-8">
        Última actualización: {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="prose prose-sm text-tx2 max-w-none space-y-6">
        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">1. Responsable del tratamiento</h2>
          <p>
            <strong>UnToque</strong> (en adelante, &ldquo;nosotros&rdquo;) es responsable del
            tratamiento de tus datos personales conforme a la Ley 25.326 de Protección de Datos
            Personales de la República Argentina.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">2. Datos que recolectamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email, nombre y teléfono (al crear cuenta)</li>
            <li>Historial de reservas y preferencias</li>
            <li>Datos de pago procesados por Mercado Pago (no almacenamos tarjetas)</li>
            <li>Datos de uso: navegación, dispositivo, IP</li>
            <li>Reseñas y calificaciones que publiques voluntariamente</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">3. Finalidad del tratamiento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Procesar tus reservas y pagos</li>
            <li>Enviar confirmaciones y recordatorios (email, WhatsApp)</li>
            <li>Compartir con el restaurante la información necesaria para tu reserva</li>
            <li>Mejorar el servicio mediante análisis agregado</li>
            <li>Cumplir obligaciones legales y fiscales</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">4. Compartición con terceros</h2>
          <p>Compartimos datos estrictamente necesarios con:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Restaurantes</strong>: nombre, email, teléfono y party size de tu reserva</li>
            <li><strong>Mercado Pago</strong>: para procesar pagos</li>
            <li><strong>Meta</strong>: para envío de mensajes por WhatsApp (solo si optás)</li>
            <li><strong>Proveedores de infraestructura</strong> (Supabase, Vercel)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">5. Tus derechos</h2>
          <p>
            Conforme a la Ley 25.326, tenés derecho a acceder, rectificar, actualizar o suprimir
            tus datos personales. Podés ejercerlos escribiendo a{' '}
            <a href="mailto:privacidad@untoque.app" className="text-c4 hover:underline">
              privacidad@untoque.app
            </a>.
          </p>
          <p className="mt-2">
            La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de
            la Ley 25.326.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">6. Retención de datos</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa y hasta 5 años después de la
            última actividad, salvo obligación legal de retención mayor (facturación: 10 años).
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">7. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas razonables: cifrado en tránsito
            (HTTPS), cifrado en reposo, control de accesos por rol, y auditoría de eventos
            sensibles. Ningún sistema es 100% seguro — notificaremos cualquier brecha que
            te afecte conforme a la legislación aplicable.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">8. Cookies</h2>
          <p>
            Usamos cookies técnicas indispensables para el funcionamiento del sitio.
            No usamos cookies de tracking de terceros sin tu consentimiento.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">9. Menores de edad</h2>
          <p>
            El servicio no está dirigido a menores de 16 años. Si sos padre/madre/tutor y
            detectás que un menor usa el servicio, contactanos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">10. Contacto</h2>
          <p>
            Consultas de privacidad:{' '}
            <a href="mailto:privacidad@untoque.app" className="text-c4 hover:underline">
              privacidad@untoque.app
            </a>
          </p>
        </section>

        <div className="mt-10 rounded-md bg-sf border border-[rgba(0,0,0,0.06)] p-4">
          <p className="text-tx3 text-[12px] leading-relaxed">
            <strong className="text-tx2">Borrador inicial.</strong> Este documento requiere revisión
            legal antes del lanzamiento comercial y registro como base de datos en la AAIP.
          </p>
        </div>
      </div>
    </main>
  )
}
