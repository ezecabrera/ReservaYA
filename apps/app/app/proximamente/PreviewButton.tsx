'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PreviewTutorial } from '@/components/ui/PreviewTutorial'

const PREVIEW_SECONDS = 60

/**
 * Botón de entrada al preview.
 *
 * Flow:
 *  1. Click → abre el tutorial INSTANTÁNEAMENTE (no hay redirect ni carga de
 *     página; la modal monta sobre la holding page que ya está en pantalla).
 *  2. Usuario completa o salta el tutorial.
 *  3. Al terminar (botón "Empezar los 60s"), recién ahí seteamos la cookie
 *     `preview_access=1` con TTL de 60s y navegamos al home real.
 *  4. Si el usuario salta (✕ / Esc / backdrop), también le damos los 60s —
 *     la idea es que la única razón para bloquearlos es que no tocaron el
 *     botón desde la holding page.
 */
export function PreviewButton() {
  const router = useRouter()
  const [tutorialOpen, setTutorialOpen] = useState(false)

  const openTutorial = () => setTutorialOpen(true)

  const grantPreviewAndGo = () => {
    document.cookie = `preview_access=1; max-age=${PREVIEW_SECONDS}; path=/; SameSite=Lax`
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={openTutorial}
        className="group mt-10 inline-flex items-center gap-3 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium tracking-wide text-white/80 transition-all hover:border-white/50 hover:text-white"
      >
        <span>Ver un adelanto ({PREVIEW_SECONDS}s)</span>
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </button>

      <PreviewTutorial
        open={tutorialOpen}
        onComplete={grantPreviewAndGo}
        onSkip={grantPreviewAndGo}
      />
    </>
  )
}
