import type { Metadata } from 'next'
import ComparativeLayout, {
  type ComparativeRow,
  type ComparativeHero,
} from '@/components/landing/ComparativeLayout'

export const metadata: Metadata = {
  title: 'UnToque vs TheFork · Comparativa 2026',
  description:
    'UnToque vs TheFork: $0 comisión por cubierto vs €2.50, CRM nativo, soporte humano AR. Pricing flat ARS 30.000/mes. Comparativa feature × feature.',
  metadataBase: new URL('https://deuntoque.com'),
  alternates: { canonical: 'https://deuntoque.com/vs-thefork' },
  openGraph: {
    title: 'UnToque vs TheFork · Comparativa 2026',
    description:
      'TheFork cobra €2.50 por cubierto. UnToque cobra $0. Mirá la comparación feature × feature.',
    type: 'article',
    locale: 'es_AR',
    url: 'https://deuntoque.com/vs-thefork',
    images: [
      {
        url: 'https://panel.deuntoque.com/og/vs',
        width: 1200,
        height: 630,
        alt: 'UnToque vs TheFork · La comparación honesta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnToque vs TheFork · 2026',
    description: '$0 vs €2.50 por cubierto. Mirá la comparación feature × feature.',
    images: ['https://panel.deuntoque.com/og/vs'],
  },
}

const ROWS: ComparativeRow[] = [
  { feature: 'Comisión por cubierto', us: 'ARS 0', them: '€2.50 por persona', usWin: true },
  { feature: 'Pricing', us: 'ARS 30.000/mes flat', them: 'Suscripción + comisión variable', usWin: true },
  { feature: 'CRM nativo con segmentación', us: 'Sí — VIP, Fieles, Dormidos', them: 'Limitado, datos compartidos con TheFork', usWin: true },
  { feature: 'WhatsApp segmentado integrado', us: 'Sí — templates Meta aprobados', them: 'No', usWin: true },
  { feature: 'Rating bidireccional', us: 'Sí — respondés reviews público', them: 'Solo el cliente puntúa', usWin: true },
  { feature: 'Modo grupo (cuenta dividida)', us: 'Sí, hasta 12 personas', them: 'No', usWin: true },
  { feature: 'Migration toolkit', us: 'Wizard 5 pasos · idempotente', them: 'No (importan ellos, vos atrapado)', usWin: true },
  { feature: 'Panel realtime + push', us: 'Sí — sonido, toast y push', them: 'Email + dashboard básico', usWin: true },
  { feature: 'Importar / exportar tu data', us: 'CSV/JSON cuando quieras', them: 'Restringido — los datos quedan con ellos', usWin: true },
  { feature: 'Soporte humano AR', us: 'WhatsApp lun-sáb 10-22 hs', them: 'Tickets en inglés/francés, 24-48 hs', usWin: true },
  { feature: 'Factura A', us: 'Sí — UnToque SAS', them: 'Factura desde Europa', usWin: true },
  { feature: 'Contrato cancelable', us: 'Mes a mes, sin permanencia', them: 'Permanencia 12 meses + cláusulas', usWin: true },
]

const HERO: ComparativeHero = {
  title: 'UnToque vs TheFork',
  italic: 'la comparación honesta',
  intro:
    'TheFork cobra €2.50 por cada cubierto reservado. Si tenés 1.500 cubiertos al mes, eso son ~ARS 4.300.000 en comisiones (al cambio actual). UnToque cuesta ARS 30.000 fijos. Sin trampas.',
  bigStat: { value: '€2.50', label: 'TheFork por cubierto', strike: true, accent: 'var(--text-3)' },
  ourStat: { value: 'ARS 0', label: 'UnToque por cubierto', accent: 'var(--p-mint-2, #A8C2BF)' },
}

const MIGRATION_COPY =
  'Restaurantes nos cuentan que TheFork les llena el local con clientes de un solo uso, no fideliza, y al final del mes la comisión se come todo el margen. Con UnToque tenés CRM, WhatsApp y tu base de clientes — los volvés a traer sin pagar comisión cada vez.'

export default function VsTheForkPage() {
  return (
    <ComparativeLayout
      brand="TheFork"
      rows={ROWS}
      hero={HERO}
      migrationCopy={MIGRATION_COPY}
    />
  )
}
