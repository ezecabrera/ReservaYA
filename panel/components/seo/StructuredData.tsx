/**
 * Structured data (Schema.org JSON-LD) component for UnToque.
 *
 * Renders one or more <script type="application/ld+json"> blocks for SEO.
 * Variants emit the right combination per page type.
 *
 * Usage:
 *   <StructuredData variant="landing" path="/landing" />
 *   <StructuredData variant="comparison" competitor="thefork" path="/vs-thefork" />
 */

import { SITE_URL, SITE_NAME } from '@/lib/seo'

export type StructuredDataVariant = 'landing' | 'comparison' | 'demo' | 'pilot'

export interface StructuredDataProps {
  variant: StructuredDataVariant
  /** Path absoluto sin host (para BreadcrumbList) */
  path: string
  /** Solo cuando variant === 'comparison'. ej "thefork" | "maxirest" | "fudo" */
  competitor?: 'thefork' | 'maxirest' | 'fudo'
}

// ─── Reusable schemas ────────────────────────────────────────────────────────

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: 'Un Toque',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/og/default`,
    width: 1200,
    height: 630,
  },
  description:
    'Software de reservas, mesas, CRM y pagos para restaurantes argentinos. Sin comisión por cubierto. Tarifa flat ARS 30.000/mes.',
  foundingDate: '2025',
  email: 'hola@deuntoque.com',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'hola@deuntoque.com',
      contactType: 'customer support',
      areaServed: 'AR',
      availableLanguage: ['Spanish', 'es-AR'],
    },
  ],
  sameAs: [
    'https://instagram.com/untoque.app',
    'https://www.linkedin.com/company/untoque',
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AR',
    addressLocality: 'Buenos Aires',
  },
}

const SOFTWARE_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#software`,
  name: SITE_NAME,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'RestaurantManagement',
  operatingSystem: 'Web, iOS, Android (PWA)',
  description:
    'Plataforma all-in-one de gestión para restaurantes: reservas, mesas, CRM, pagos, reviews y reportes. Tarifa flat sin comisiones por cubierto.',
  url: SITE_URL,
  offers: {
    '@type': 'Offer',
    price: '30000',
    priceCurrency: 'ARS',
    priceValidUntil: '2026-12-31',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '30000',
      priceCurrency: 'ARS',
      unitCode: 'MON',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitCode: 'MON',
      },
    },
    availability: 'https://schema.org/InStock',
    seller: { '@id': `${SITE_URL}/#organization` },
  },
  publisher: { '@id': `${SITE_URL}/#organization` },
  featureList: [
    'Reservas online sin comisión',
    'Layout de mesas drag & drop',
    'CRM con segmentación RFM',
    'Pagos con MercadoPago',
    'Cobranza automática de no-shows',
    'Reviews multicanal (Google + propias)',
    'PWA offline',
    'Migración 1-click desde TheFork/Maxirest/Fudo',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '23',
    bestRating: '5',
    worstRating: '1',
  },
}

// 8 FAQs idénticas a la landing
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Y si quiero salirme?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cancelás cuando quieras desde el panel. Contrato mes a mes, sin penalizaciones ni letra chica. Te exportamos toda tu base de clientes en CSV antes de cerrar la cuenta.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Mis datos son míos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, 100%. Cualquier momento podés exportar reservas, clientes, comentarios y reviews en CSV/JSON. No vendemos data y nunca te bloqueamos el export — esa es la diferencia con TheFork.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo migro desde TheFork (o Maxirest, Fudo)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tenemos un Migration Toolkit con wizard de 5 pasos. Subís tu export, mapeamos campos y migramos mesas + clientes + reservas. Es idempotente: podés re-cargar el CSV sin generar duplicados. Tarda unos 10 minutos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Tengo soporte humano?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, soporte por WhatsApp en horario comercial argentino (lun-sáb 10-22 hs). Respuesta promedio menos de 2 hs. No bots, no tickets en inglés, no esperas de 48 hs.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Funciona offline?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El panel es PWA: si se cae el WiFi seguís cargando reservas y check-ins. Cuando vuelve la conexión sincroniza solo. Probado en bares de subsuelo y rooftops sin señal.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Sirve para bar, café o cervecería?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Tenemos modo grupo (cervecerías, peñas), modo barra (cafés y wine bars sin reserva pero con waitlist) y modo restaurante full. Configurable en onboarding.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Hay descuento si firmo año completo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí: 20% off pagando anual (ARS 288.000 vs ARS 360.000). Si sos un grupo de 3+ locales, escribinos a hola@deuntoque.com para pricing custom.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Tienen factura A?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Factura A, B o C según corresponda. Emitida por UnToque SAS, monotributo o responsable inscripto del lado tuyo, ambos funcionan.',
      },
    },
  ],
}

// ─── Builders ────────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string
  path: string
}

function buildBreadcrumb(path: string): Record<string, unknown> {
  // Construye breadcrumb a partir del path
  const segments = path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = [{ name: 'Inicio', path: '/' }]

  let acc = ''
  for (const seg of segments) {
    acc += `/${seg}`
    items.push({
      name: prettifySegment(seg),
      path: acc,
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

function prettifySegment(seg: string): string {
  const map: Record<string, string> = {
    landing: 'Landing',
    demo: 'Demo',
    pilot: 'Programa Piloto',
    'vs-thefork': 'UnToque vs TheFork',
    'vs-maxirest': 'UnToque vs Maxirest',
    'vs-fudo': 'UnToque vs Fudo',
    login: 'Iniciar sesión',
    onboarding: 'Onboarding',
    terms: 'Términos',
    privacy: 'Privacidad',
    cookies: 'Cookies',
    ayuda: 'Ayuda',
  }
  return map[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
}

function buildComparisonProductSchema(competitor: NonNullable<StructuredDataProps['competitor']>) {
  const competitorNames: Record<typeof competitor, string> = {
    thefork: 'TheFork',
    maxirest: 'Maxirest',
    fudo: 'Fudo',
  }
  const name = competitorNames[competitor]
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${SITE_NAME} vs ${name}`,
    description: `Comparativa entre ${SITE_NAME} y ${name} para restaurantes en Argentina.`,
    brand: { '@id': `${SITE_URL}/#organization` },
    offers: {
      '@type': 'Offer',
      price: '30000',
      priceCurrency: 'ARS',
      url: `${SITE_URL}/vs-${competitor}`,
    },
  }
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StructuredData({ variant, path, competitor }: StructuredDataProps): JSX.Element {
  const schemas: Array<Record<string, unknown>> = []

  // Always include Organization
  schemas.push(ORGANIZATION_SCHEMA as Record<string, unknown>)

  // Always include breadcrumb
  schemas.push(buildBreadcrumb(path))

  switch (variant) {
    case 'landing':
      schemas.push(SOFTWARE_APPLICATION_SCHEMA as Record<string, unknown>)
      schemas.push(FAQ_SCHEMA as Record<string, unknown>)
      break
    case 'comparison':
      schemas.push(SOFTWARE_APPLICATION_SCHEMA as Record<string, unknown>)
      if (competitor) {
        schemas.push(buildComparisonProductSchema(competitor))
      }
      break
    case 'demo':
      schemas.push(SOFTWARE_APPLICATION_SCHEMA as Record<string, unknown>)
      break
    case 'pilot':
      schemas.push(SOFTWARE_APPLICATION_SCHEMA as Record<string, unknown>)
      break
  }

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
