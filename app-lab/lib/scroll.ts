/**
 * Smooth scroll custom con easeInOutCubic — mucho más suave que el
 * `behavior: 'smooth'` nativo del browser, especialmente en mobile Safari
 * (que tiende a snapear). La curva se siente como "empujar y soltar" en
 * lugar de "tirar fuerte al inicio y frenar".
 *
 * Respeta `prefers-reduced-motion: reduce`: si el user lo pidió, salta al
 * destino sin animar.
 */

const DEFAULT_DURATION = 580

// Flag global para que el IntersectionObserver (o cualquier listener de scroll)
// sepa que una animación programática está en curso y pueda ignorar updates
// spurios — evita que el activeTab salte a una sección intermedia mientras
// el scroll pasa por ella.
let _programmaticScrollActive = false

export function isProgrammaticScrollActive(): boolean {
  return _programmaticScrollActive
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Scrollea la ventana a la posición Y absoluta (desde el top del documento).
 * Duración default 580ms con easeInOutCubic. Cancela si el delta es < 2px.
 */
export function smoothScrollTo(y: number, duration = DEFAULT_DURATION): void {
  if (typeof window === 'undefined') return
  if (prefersReducedMotion()) {
    window.scrollTo(0, y)
    return
  }

  const startY = window.scrollY
  const delta = y - startY
  if (Math.abs(delta) < 2) return

  _programmaticScrollActive = true
  const start = performance.now()
  function step(now: number) {
    const elapsed = now - start
    const t = Math.min(1, elapsed / duration)
    // easeInOutCubic — arranca suave, acelera, y desacelera al final.
    // Se percibe como "natural" en ambos extremos, sin el tirón inicial
    // del easeOutCubic ni el frenado brusco del easeInCubic.
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
    window.scrollTo(0, startY + delta * eased)
    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      _programmaticScrollActive = false
    }
  }
  requestAnimationFrame(step)
}

/**
 * Scrollea hasta posicionar el elemento con un offset desde arriba
 * (útil para no pegar la sección a un sticky header/tab bar).
 */
export function smoothScrollToElement(
  el: HTMLElement | null | undefined,
  offset = 80,
  duration = DEFAULT_DURATION,
): void {
  if (!el || typeof window === 'undefined') return
  // Esperar un frame para que React pinte cambios recientes antes de medir
  requestAnimationFrame(() => {
    const rect = el.getBoundingClientRect()
    const y = rect.top + window.scrollY - offset
    smoothScrollTo(y, duration)
  })
}
