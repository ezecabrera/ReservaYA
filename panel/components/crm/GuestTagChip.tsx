import type { GuestTag } from '@/lib/shared'

interface GuestTagChipProps {
  tag: GuestTag
  /** dark = sobre fondo oscuro (dashboard), light = sobre bottom sheet blanco */
  theme?: 'dark' | 'light'
}

const LABELS: Record<GuestTag, string> = {
  primera_vez:      'Primera vez',
  habitue:          'Habitué',
  vip:              'VIP',
  no_show_previo:   'No-show previo',
  regular_reciente: 'Regular',
}

const DARK_STYLES: Record<GuestTag, string> = {
  primera_vez:      'bg-c4/20 text-c4l border-c4/30',
  habitue:          'bg-c2/20 text-c2l border-c2/30',
  vip:              'bg-c3/25 text-c3l border-c3/35',
  no_show_previo:   'bg-c1/25 text-c1l border-c1/40',
  regular_reciente: 'bg-white/10 text-white/80 border-white/15',
}

const LIGHT_STYLES: Record<GuestTag, string> = {
  primera_vez:      'bg-c4l text-[#2B5FCC]',
  habitue:          'bg-c2l text-[#0A9A72]',
  vip:              'bg-c3l text-[#A66400]',
  no_show_previo:   'bg-c1l text-[#C0313E]',
  regular_reciente: 'bg-sf2 text-tx2',
}

export function GuestTagChip({ tag, theme = 'dark' }: GuestTagChipProps) {
  const cls = theme === 'dark' ? DARK_STYLES[tag] : LIGHT_STYLES[tag]
  return (
    <span
      className={`text-[9.5px] font-bold uppercase tracking-wide
                  px-1.5 py-0.5 rounded border ${cls}`}
    >
      {LABELS[tag]}
    </span>
  )
}
