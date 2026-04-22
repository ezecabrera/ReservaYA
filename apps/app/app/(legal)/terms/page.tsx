import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones · UnToque',
  description: 'Términos y condiciones de uso de la plataforma UnToque.',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">
        Legal
      </p>
      <h1 className="font-display text-[32px] text-tx leading-none mb-2">
        Términos y Condiciones
      </h1>
      <p className="text-tx2 text-[13px] mb-8">
        Última actualización: {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="prose prose-sm text-tx2 max-w-none space-y-6">
        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">1. Objeto</h2>
          <p>
            Estos Términos regulan el uso de <strong>UnToque</strong>, una plataforma de reservas
            para restaurantes operada en la República Argentina. Al usar el servicio, aceptás
            estos términos en su totalidad.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">2. Servicio</h2>
          <p>
            UnToque permite a restaurantes adheridos recibir reservas y a comensales realizarlas.
            El servicio se presta tal cual está disponible, sin garantías de disponibilidad
            ininterrumpida.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">3. Cuentas</h2>
          <p>
            Para usar el servicio debés crear una cuenta con información veraz. Sos responsable
            de mantener la confidencialidad de tus credenciales y de toda actividad bajo tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">4. Pagos y cancelaciones</h2>
          <p>
            Los pagos se procesan a través de Mercado Pago. La seña abonada al reservar se
            descuenta del consumo al llegar al restaurante. Las políticas de cancelación las
            define cada restaurante.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">5. Uso aceptable</h2>
          <p>
            No está permitido usar el servicio para actividades ilegales, realizar reservas
            fraudulentas, ni interferir con el funcionamiento técnico de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">6. Limitación de responsabilidad</h2>
          <p>
            UnToque es un intermediario tecnológico. La calidad del servicio gastronómico
            es responsabilidad del restaurante. Nuestra responsabilidad se limita al monto
            abonado en concepto de seña por la reserva objeto del reclamo.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">7. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos. Te notificaremos por email los cambios
            materiales con 15 días de anticipación.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">8. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por la ley argentina. Cualquier controversia se someterá
            a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
          </p>
        </section>

        <section>
          <h2 className="font-display text-[20px] text-tx mb-2">9. Contacto</h2>
          <p>
            Para consultas: <a href="mailto:legal@untoque.app" className="text-c4 hover:underline">legal@untoque.app</a>
          </p>
        </section>

        <div className="mt-10 rounded-md bg-sf border border-[rgba(0,0,0,0.06)] p-4">
          <p className="text-tx3 text-[12px] leading-relaxed">
            <strong className="text-tx2">Borrador inicial.</strong> Este documento requiere revisión
            legal antes del lanzamiento comercial. No sustituye asesoramiento jurídico profesional.
          </p>
        </div>
      </div>
    </main>
  )
}
