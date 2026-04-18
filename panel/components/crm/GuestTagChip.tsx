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
  primera_vez:      'bg-olive/18 text-olive border-olive/35',
  habitue:          'bg-olive/25 text-olive border-olive/45',
  vip:              'bg-gold/22 text-gold border-gold/40',
  no_show_previo:   'bg-wine/25 text-wine-soft border-wine/45',
  regular_reciente: 'bg-ink-3 text-ink-text-2 border-ink-line-2',
}

const LIGHT_STYLES: Record<GuestTag, string> = {
  primera_vez:      'bg-olive/12 text-[#2E6B52] border border-olive/25',
  habitue:          'bg-olive/18 text-[#2E6B52] border border-olive/30',
  vip:              'bg-gold/18 text-[#8F6618] border border-gold/35',
  no_show_previo:   'bg-wine/12 text-wine border border-wine/28',
  regular_reciente: 'bg-sf2 text-tx2 border border-[var(--br)]',
}

export function GuestTagChip({ tag, theme = 'dark' }: GuestTagChipProps) {
  const cls = theme === 'dark' ? DARK_STYLES[tag] : LIGHT_STYLES[tag]
  // DARK ya incluye border; LIGHT también. No agregamos uno extra.
  return (
    <span
      className={`text-[9.5px] font-bold uppercase tracking-wide
                  px-1.5 py-0.5 rounded ${theme === 'dark' ? 'border' : ''} ${cls}`}
    >
      {LABELS[tag]}
    </span>
  )
}
