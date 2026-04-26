import type { Metadata } from 'next'
import ComparativeLayout, {
  type ComparativeRow,
  type ComparativeHero,
} from '@/components/landing/ComparativeLayout'

export const metadata: Metadata = {
  title: 'UnToque vs Maxirest · Comparativa 2026',
  description:
    'UnToque vs Maxirest: CRM nativo, WhatsApp segmentado, rating bidireccional y panel realtime. Sin comisión por cubierto. ARS 30.000/mes flat.',
  metadataBase: new URL('https://deuntoque.com'),
  alternates: { canonical: 'https://deuntoque.com/vs-maxirest' },
  openGraph: {
    title: 'UnToque vs Maxirest · Comparativa 2026',
    description:
      'Maxirest es POS, UnToque es panel de reservas + CRM + WhatsApp. Mirá feature × feature.',
    type: 'article',
    locale: 'es_AR',
    url: 'https://deuntoque.com/vs-maxirest',
    images: [
      {
        url: 'https://panel.deuntoque.com/og/vs',
        width: 1200,
        height: 630,
        alt: 'UnToque vs Maxirest · La comparación honesta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnToque vs Maxirest · 2026',
    description: 'Reservas + CRM + WhatsApp vs POS clásico. Comparación feature × feature.',
    images: ['https://panel.deuntoque.com/og/vs'],
  },
}

const ROWS: ComparativeRow[] = [
  { feature: 'Comisión por cubierto', us: 'ARS 0', them: 'No aplica (POS)', usWin: false },
  { feature: 'Pricing', us: 'ARS 30.000/mes flat', them: 'Licencia + módulos extra', usWin: true },
  { feature: 'Reservas online', us: 'Nativo · multi-canal', them: 'Módulo extra o integración', usWin: true },
  { feature: 'CRM con segmentación', us: 'Sí — VIP, Fieles, Dormidos', them: 'Básico, sin segmentación auto', usWin: true },
  { feature: 'WhatsApp segmentado', us: 'Sí — templates Meta aprobados', them: 'No (sólo notif transaccional)', usWin: true },
  { feature: 'Rating bidireccional', us: 'Sí — respondés reviews', them: 'No', usWin: true },
  { feature: 'Modo grupo', us: 'Sí, hasta 12 personas', them: 'Mesa compuesta limitada', usWin: true },
  { feature: 'Migration toolkit', us: 'Wizard 5 pasos · idempotente', them: 'Migración asistida con costo', usWin: true },
  { feature: 'Panel realtime + push', us: 'Sí — push al teléfono', them: 'Polling, sin push móvil', usWin: true },
  { feature: 'Importar / exportar data', us: 'CSV/JSON cuando quieras', them: 'Sólo desde panel admin', usWin: true },
  { feature: 'Soporte humano AR', us: 'WhatsApp lun-sáb 10-22 hs', them: 'Mesa de ayuda telefónica', usWin: false },
  { feature: 'Factura A', us: 'Sí — UnToque SAS', them: 'Sí — proveedor argentino', usWin: false },
  { feature: 'Contrato cancelable', us: 'Mes a mes, sin permanencia', them: 'Licencia anual habitual', usWin: true },
]

const HERO: ComparativeHero = {
  title: 'UnToque vs Maxirest',
  italic: 'el panel que te faltaba',
  intro:
    'Maxirest es un POS muy sólido para facturar y manejar caja. UnToque vive en otro lado: es el panel para reservas, CRM y WhatsApp segmentado. Muchos restaurantes los usan en paralelo — y pagás menos por UnToque que por sumar el módulo de reservas a Maxirest.',
  bigStat: { value: 'POS', label: 'Maxirest se enfoca en', accent: 'var(--text-2)' },
  ourStat: { value: 'CRM + Reservas', label: 'UnToque se enfoca en', accent: 'var(--p-mint-2, #A8C2BF)' },
}

const MIGRATION_COPY =
  'Maxirest es excelente como punto de venta. El problema arranca cuando querés hacer reservas online, segmentar clientes por hábito o mandar campañas WhatsApp: necesitás módulos extra, integraciones o mantenerlo con Excel. Con UnToque ese stack se reduce a una sola herramienta. Conectamos por API si querés mantener Maxirest para facturación.'

export default function VsMaxirestPage() {
  return (
    <ComparativeLayout
      brand="Maxirest"
      rows={ROWS}
      hero={HERO}
      migrationCopy={MIGRATION_COPY}
    />
  )
}
