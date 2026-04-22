'use client'

import { useRouter } from 'next/navigation'

/**
 * Back button del wizard. Prioriza router.back() cuando la entrada previa
 * del history es el detalle del venue (flujo normal), y cae a router.replace
 * al detalle cuando entraron directo al wizard desde un deep-link. En ambos
 * casos NO pusheamos una entrada nueva — eso evita el bug "clickeo atrás,
 * vuelvo al venue, clickeo atrás otra vez y vuelvo al wizard".
 */
export function ReservarBackButton({ venueId }: { venueId: string }) {
  const router = useRouter()

  function handleBack() {
    // history.length > 1 significa que entramos navegando, así que back()
    // retrocede sin agregar entry. Si es 1 (deep link directo), replace
    // al detalle también reemplaza la entry actual.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.replace(`/${venueId}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Volver al detalle del restaurante"
      className="flex-shrink-0 w-10 h-10 rounded-full bg-sf border border-[var(--br)]
                 flex items-center justify-center active:scale-95 transition-transform"
    >
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M15 18l-6-6 6-6" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
