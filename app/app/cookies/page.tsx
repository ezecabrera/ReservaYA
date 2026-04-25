import type { Metadata } from 'next'
import { LegalShell } from '@/components/legal/LegalShell'
import { LegalContact } from '@/components/legal/LegalContact'
import { IubendaPlaceholder } from '@/components/legal/IubendaPlaceholder'

export const metadata: Metadata = {
  title: 'Política de cookies · UnToque',
  description:
    'Detalle de las cookies utilizadas por UnToque, su finalidad, duración y cómo controlarlas desde tu navegador.',
}

interface CookieRow {
  name: string
  category: 'Necesaria' | 'Funcional' | 'Analítica' | 'Tercero'
  provider: string
  purpose: string
  duration: string
}

const COOKIES: CookieRow[] = [
  {
    name: 'sb-access-token',
    category: 'Necesaria',
    provider: 'UnToque (Supabase Auth)',
    purpose: 'Mantener tu sesión iniciada de forma segura.',
    duration: '1 hora (rotación automática)',
  },
  {
    name: 'sb-refresh-token',
    category: 'Necesaria',
    provider: 'UnToque (Supabase Auth)',
    purpose: 'Renovar la sesión sin volver a iniciar sesión cada hora.',
    duration: '30 días',
  },
  {
    name: 'untoque-csrf',
    category: 'Necesaria',
    provider: 'UnToque',
    purpose: 'Protección contra ataques CSRF (Cross-Site Request Forgery).',
    duration: 'Sesión',
  },
  {
    name: 'untoque-theme',
    category: 'Funcional',
    provider: 'UnToque',
    purpose: 'Recordar tu preferencia visual (claro / oscuro).',
    duration: '1 año',
  },
  {
    name: 'untoque-locale',
    category: 'Funcional',
    provider: 'UnToque',
    purpose: 'Recordar tu idioma preferido (actualmente solo español AR).',
    duration: '1 año',
  },
  {
    name: 'untoque-push-dismissed',
    category: 'Funcional',
    provider: 'UnToque',
    purpose: 'Evitar volver a pedirte permiso de notificaciones push si lo rechazaste.',
    duration: '6 meses',
  },
  {
    name: '_vercel_*',
    category: 'Analítica',
    provider: 'Vercel Analytics',
    purpose:
      'Métricas agregadas y anónimas de páginas vistas y rendimiento. No usa fingerprinting ni cross-site tracking.',
    duration: '24 horas',
  },
  {
    name: '_mp_*',
    category: 'Tercero',
    provider: 'Mercado Pago',
    purpose:
      'Solo se establecen cuando completás un pago en el dominio mercadopago.com.ar. Antifraude y autenticación del comprador.',
    duration: 'Definido por Mercado Pago',
  },
]

const CATEGORY_TONE: Record<CookieRow['category'], string> = {
  Necesaria: '#1F4D2C',
  Funcional: '#1F3D6B',
  Analítica: '#5C3A1F',
  Tercero: '#5C1F4D',
}

export default function CookiesPage() {
  return (
    <LegalShell title="Política de cookies" updated="2026-04-25">
      <IubendaPlaceholder />

      <section>
        <h2>1. Qué son las cookies</h2>
        <p>
          Las cookies son pequeños archivos de texto que tu navegador almacena cuando visitás un sitio web.
          Permiten que el sitio recuerde tu sesión, tus preferencias y, opcionalmente, recolecte estadísticas
          de uso. UnToque utiliza cookies con criterio minimalista: solo las imprescindibles para que la
          Plataforma funcione, más algunas opcionales para mejorar tu experiencia.
        </p>
      </section>

      <section>
        <h2>2. Tipos de cookies que usamos</h2>
        <ul>
          <li>
            <strong>Estrictamente necesarias</strong>: imprescindibles para iniciar sesión, mantenerla activa
            y proteger contra ataques (CSRF). Sin ellas la Plataforma no funciona. No requieren
            consentimiento.
          </li>
          <li>
            <strong>Funcionales</strong>: recuerdan preferencias (tema, idioma, descarte de prompts). Mejoran
            tu experiencia pero no son indispensables.
          </li>
          <li>
            <strong>Analíticas</strong>: nos permiten entender cómo se usa la Plataforma de forma agregada
            y anónima para mejorarla. Nunca individualizan a una persona.
          </li>
          <li>
            <strong>De terceros</strong>: las establecen proveedores externos cuando interactuás con sus
            servicios desde nuestra Plataforma (por ejemplo Mercado Pago al pagar).
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Detalle exhaustivo</h2>
        <p>
          La siguiente tabla lista todas las cookies que el dominio de UnToque puede establecer en tu
          navegador. Si alguna falta, escribinos a{' '}
          <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>: actualizamos esta página
          activamente.
        </p>

        <div style={{ overflowX: 'auto', margin: '16px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              minWidth: 640,
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(23, 25, 27, 0.12)' }}>
                <th style={{ padding: '10px 8px', fontWeight: 700 }}>Cookie</th>
                <th style={{ padding: '10px 8px', fontWeight: 700 }}>Categoría</th>
                <th style={{ padding: '10px 8px', fontWeight: 700 }}>Proveedor</th>
                <th style={{ padding: '10px 8px', fontWeight: 700 }}>Finalidad</th>
                <th style={{ padding: '10px 8px', fontWeight: 700 }}>Duración</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr
                  key={c.name}
                  style={{ borderBottom: '1px solid rgba(23, 25, 27, 0.08)', verticalAlign: 'top' }}
                >
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        color: CATEGORY_TONE[c.category],
                        background: 'rgba(23, 25, 27, 0.06)',
                      }}
                    >
                      {c.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>{c.provider}</td>
                  <td style={{ padding: '10px 8px' }}>{c.purpose}</td>
                  <td style={{ padding: '10px 8px' }}>{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>4. Cómo controlarlas o desactivarlas</h2>
        <p>
          Podés bloquear o eliminar cookies desde la configuración de tu navegador. Tené en cuenta que si
          desactivás las cookies estrictamente necesarias no vas a poder iniciar sesión ni utilizar la
          Plataforma.
        </p>

        <h3>Google Chrome</h3>
        <p>
          Configuración → Privacidad y seguridad → Cookies y otros datos de sitios.{' '}
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Guía oficial de Chrome
          </a>
          .
        </p>

        <h3>Mozilla Firefox</h3>
        <p>
          Ajustes → Privacidad y seguridad → Cookies y datos del sitio.{' '}
          <a
            href="https://support.mozilla.org/es/kb/Borrar%20cookies"
            target="_blank"
            rel="noopener noreferrer"
          >
            Guía oficial de Firefox
          </a>
          .
        </p>

        <h3>Apple Safari (macOS)</h3>
        <p>
          Safari → Preferencias → Privacidad → Gestionar datos de sitios web.{' '}
          <a
            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Guía oficial de Safari
          </a>
          .
        </p>

        <h3>Safari (iOS / iPadOS)</h3>
        <p>
          Ajustes → Safari → Privacidad y seguridad → Bloquear todas las cookies.
        </p>

        <h3>Microsoft Edge</h3>
        <p>
          Configuración → Cookies y permisos del sitio → Administrar y eliminar cookies.{' '}
          <a
            href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
            target="_blank"
            rel="noopener noreferrer"
          >
            Guía oficial de Edge
          </a>
          .
        </p>
      </section>

      <section>
        <h2>5. Banner de consentimiento</h2>
        <p>
          Mientras estamos consolidando la inscripción societaria, las cookies analíticas y funcionales se
          establecen con base en el <strong>interés legítimo</strong> previsto en el art. 5 inc. 2 de la
          Ley 25.326, en versiones que no permiten reidentificación individual.{' '}
          <strong>Próximamente integraremos un banner de consentimiento granular</strong> (estamos
          evaluando Iubenda y Cookiebot) que te permitirá aceptar o rechazar por categoría antes de que
          cualquier cookie no esencial se establezca.
        </p>
        <p>
          Hasta que el banner esté en producción, podés controlar las cookies funcionales y analíticas
          desde tu navegador siguiendo las guías de la sección anterior.
        </p>
      </section>

      <section>
        <h2>6. Usuarios de la Unión Europea (GDPR)</h2>
        <p>
          Si nos visitás desde la Unión Europea, el <strong>art. 7 del Reglamento (UE) 2016/679 (GDPR)</strong>{' '}
          exige consentimiento libre, específico, informado e inequívoco antes de instalar cookies no
          esenciales. Mientras el banner de consentimiento esté en desarrollo:
        </p>
        <ul>
          <li>
            Solo establecemos cookies estrictamente necesarias hasta detectar interacción consciente con
            funcionalidades opcionales (ej. cambio de tema).
          </li>
          <li>
            Vercel Analytics está configurado en modo <em>privacy-first</em>, sin uso de identificadores
            persistentes ni fingerprinting.
          </li>
          <li>
            Podés ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición y
            portabilidad escribiendo a{' '}
            <a href="mailto:soporte@deuntoque.com">soporte@deuntoque.com</a>.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Cambios en esta política</h2>
        <p>
          Si actualizamos las cookies que utilizamos, modificaremos este documento y publicaremos la nueva
          fecha de actualización al inicio. Los cambios sustanciales en cookies analíticas o de terceros se
          notificarán por email a los usuarios registrados.
        </p>
      </section>

      <LegalContact />
    </LegalShell>
  )
}
