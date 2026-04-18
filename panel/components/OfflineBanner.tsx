'use client'

import { useOnline } from '@/lib/useOnline'

/**
 * Banner superior que se muestra cuando el navegador perdió conexión.
 * Se posiciona sobre el header de cada página y respeta el safe-area top.
 */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[60] bg-c3 text-[#1A1A2E]
                 text-[12.5px] font-bold text-center py-2 px-4
                 flex items-center justify-center gap-2"
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M1 1l22 22M16.72 11.06a10 10 0 012.54 1.89M5 12.55a10 10 0 015.17-2.39M10.71 5.05a15.91 15.91 0 0110.86 3.39M3.43 8.44A15.9 15.9 0 016.08 6.3M12 19.08h.01"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Sin conexión · podés seguir viendo las reservas</span>
    </div>
  )
}
