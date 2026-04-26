import type { Metadata } from 'next'
import ComparativeLayout, {
  type ComparativeRow,
  type ComparativeHero,
} from '@/components/landing/ComparativeLayout'

export const metadata: Metadata = {
  title: 'UnToque vs Fudo · Comparativa 2026',
  description:
    'UnToque vs Fudo: CRM nativo, WhatsApp segmentado, modo grupo y rating bidireccional. Sin comisión por cubierto. ARS 30.000/mes flat.',
  metadataBase: new URL('https://deuntoque.com'),
  alternates: { canonical: 'https://deuntoque.com/vs-fudo' },
  openGraph: {
    title: 'UnToque vs Fudo · Comparativa 2026',
    description:
      'Fudo es gestión gastro completa. UnToque es panel de reservas + CRM + WhatsApp con foco en fidelización.',
    type: 'article',
    locale: 'es_AR',
    url: 'https://deuntoque.com/vs-fudo',
    images: [
      {
        url: 'https://panel.deuntoque.com/og/vs',
        width: 1200,
        height: 630,
        alt: 'UnToque vs Fudo · La comparación honesta',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UnToque vs Fudo · 2026',
    description: 'Reservas + CRM + WhatsApp vs gestión gastro. Comparación feature × feature.',
    images: ['https://panel.deuntoque.com/og/vs'],
  },
}

const ROWS: ComparativeRow[] = [
  { feature: 'Comisión por cubierto', us: 'ARS 0', them: 'No aplica', usWin: false },
  { feature: 'Pricing', us: 'ARS 30.000/mes flat', them: 'Plan según volumen + módulos', usWin: true },
  { feature: 'Reservas online + waitlist', us: 'Nativo · multi-canal', them: 'Módulo de reservas básico', usWin: true },
  { feature: 'CRM con segmentación VIP/Dormidos', us: 'Automática por hábito', them: 'Manual — listas estáticas', usWin: true },
  { feature: 'WhatsApp segmentado (winback)', us: 'Sí — templates Meta aprobados', them: 'WhatsApp transaccional', usWin: true },
  { feature: 'Rating bidireccional', us: 'Sí — respondés reviews público', them: 'No', usWin: true },
  { feature: 'Modo grupo (cuenta dividida)', us: 'Sí, hasta 12 personas', them: 'Limitado', usWin: true },
  { feature: 'Migration toolkit', us: 'Wizard 5 pasos · idempotente', them: 'Importación asistida con costo', usWin: true },
  { feature: 'Panel realtime + push móvil', us: 'Sí — push al teléfono', them: 'Notif por email', usWin: true },
  { feature: 'Importar / exportar data', us: 'CSV/JSON cuando quieras', them: 'Export desde panel admin', usWin: false },
  { feature: 'Soporte humano AR', us: 'WhatsApp lun-sáb 10-22 hs', them: 'Soporte LATAM, ticket', usWin: false },
  { feature: 'Factura A', us: 'Sí — UnToque SAS', them: 'Sí', usWin: false },
  { feature: 'Contrato cancelable', us: 'Mes a mes, sin permanencia', them: 'Mensual o anual con descuento', usWin: false },
]

const HERO: ComparativeHero = {
  title: 'UnToque vs Fudo',
  italic: 'fidelizá, no sólo factures',
  intro:
    'Fudo es muy bueno como suite gastro: caja, stock, pedidos, delivery. UnToque va a otro problema: cómo hacer que tus clientes vuelvan. Tu CRM segmentado, WhatsApp con winback automático, rating bidireccional. Convivimos perfecto con Fudo via API.',
  bigStat: { value: 'Gestión', label: 'Fudo se enfoca en', accent: 'var(--text-2)' },
  ourStat: { value: 'Fidelización', label: 'UnToque se enfoca en', accent: 'var(--p-mint-2, #A8C2BF)' },
}

const MIGRATION_COPY =
  'Fudo te resuelve la cocina, el stock, la caja y los pedidos. Ahí brilla. Lo que muchos restaurantes nos dicen: "ya tengo la base de clientes en Fudo, pero no sé cuáles son VIP y cuáles dormidos, y no tengo cómo mandarles WhatsApp segmentado". Eso es lo que hace UnToque. Migrás clientes en 10 minutos y seguís usando Fudo para todo lo demás.'

export default function VsFudoPage() {
  return (
    <ComparativeLayout brand="Fudo" rows={ROWS} hero={HERO} migrationCopy={MIGRATION_COPY} />
  )
}
