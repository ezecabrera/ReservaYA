import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad · Un Toque',
}

const NAVY = '#0F3460'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sf">
      <header className="border-b border-[rgba(0,0,0,0.07)] bg-white">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-[18px] text-tx tracking-tight">
            Un <span style={{ color: NAVY }}>Toque</span>
          </Link>
          <Link href="/terms" className="text-tx2 hover:text-tx text-[13px] font-semibold">
            Términos
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <p className="text-tx3 text-[11px] font-semibold uppercase tracking-[0.16em] mb-2">Legal</p>
        <h1 className="font-display text-[32px] text-tx leading-none mb-2">Política de Privacidad</h1>
        <p className="text-tx2 text-[13px] mb-8">
          Última actualización: {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div className="space-y-6 text-tx2 text-[14px] leading-relaxed">
          <Section title="1. Responsable">
            <strong>Un Toque</strong> es responsable del tratamiento de tus datos personales conforme
            a la Ley 25.326 de Protección de Datos Personales de la República Argentina.
          </Section>
          <Section title="2. Datos que recolectamos (del staff del restaurante)">
            Email, nombre, rol dentro del local, actividad en el panel, IP de acceso. En pagos de
            suscripción, los datos los procesa Mercado Pago — no almacenamos tarjetas.
          </Section>
          <Section title="3. Datos que recolectamos (de los comensales)">
            Cuando un comensal reserva en tu restaurante vía Un Toque, procesamos su nombre, email,
            teléfono, historial de reservas y eventuales reseñas. El Cliente (restaurante) es
            co-responsable de este tratamiento.
          </Section>
          <Section title="4. Finalidad">
            Prestar el servicio, enviar comunicaciones transaccionales (reservas, recordatorios),
            analítica agregada, cumplir obligaciones legales y fiscales. No vendemos datos a terceros.
          </Section>
          <Section title="5. Terceros con los que compartimos datos">
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Mercado Pago</strong> — procesamiento de pagos</li>
              <li><strong>Meta</strong> — envío de mensajes WhatsApp (si se habilita)</li>
              <li><strong>Supabase</strong> — infraestructura de base de datos</li>
              <li><strong>Vercel</strong> — hosting de la aplicación</li>
              <li><strong>Sentry</strong> — monitoreo de errores</li>
            </ul>
          </Section>
          <Section title="6. Derechos del titular">
            Derechos ARCO conforme a la Ley 25.326: acceso, rectificación, actualización y supresión.
            Ejercelos escribiendo a <a href="mailto:privacidad@untoque.app" className="font-semibold" style={{ color: NAVY }}>privacidad@untoque.app</a>.
            La AAIP es el órgano de control.
          </Section>
          <Section title="7. Retención">
            Mientras la cuenta esté activa y hasta 5 años después de la última actividad, salvo
            obligación legal de retención mayor (facturación AFIP: 10 años).
          </Section>
          <Section title="8. Seguridad">
            HTTPS en tránsito, cifrado en reposo, control de accesos por rol (RLS a nivel de DB),
            auditoría de eventos sensibles. Notificaremos brechas materiales conforme a la normativa.
          </Section>
          <Section title="9. Cookies">
            Solo cookies técnicas indispensables (sesión). No usamos trackers de terceros sin
            consentimiento explícito.
          </Section>
          <Section title="10. Contacto">
            <a href="mailto:privacidad@untoque.app" className="font-semibold" style={{ color: NAVY }}>
              privacidad@untoque.app
            </a>
          </Section>

          <div className="rounded-md bg-white border border-[rgba(0,0,0,0.06)] p-4 mt-8">
            <p className="text-tx3 text-[12px]">
              <strong className="text-tx2">Borrador inicial.</strong> Requiere revisión legal y
              registro como base de datos en la AAIP antes del lanzamiento comercial.
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
      <div>{children}</div>
    </section>
  )
}
