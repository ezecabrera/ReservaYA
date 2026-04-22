'use client'

import { useEffect, useState } from 'react'

/**
 * Splash screen de UnToque. Se muestra una sola vez por sesión (flag en
 * sessionStorage) para sentirse como un cold-start nativo sin ser molesto
 * en navegaciones internas.
 *
 * Secuencia:
 *  1. Sprite 24 frames / 900ms (steps, run-once — queda en el último frame
 *     vía animation-fill-mode: forwards)
 *  2. Mientras el sprite termina, entra el texto "UnToque" con fade-up
 *     (delay casi al final del sprite, duración 600ms)
 *  3. Hold de 2s mostrando el último frame + texto completo
 *  4. Fade-out 400ms y unmount
 *
 * Respeta prefers-reduced-motion: sin animaciones, sólo crossfade.
 */

const FRAMES = 24
const FRAME_SIZE = 256
const SPRITE_MS = 900
const TEXT_DELAY_MS = 750      // entra al final del sprite
const TEXT_IN_MS = 500
const HOLD_MS = 2000
const FADE_MS = 400
const TOTAL_MS = SPRITE_MS + HOLD_MS + FADE_MS
const STORAGE_KEY = 'un-toque-splash-shown'

export function SplashScreen() {
  const [show, setShow] = useState<boolean | null>(null)
  const [textIn, setTextIn] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    let already = false
    try { already = sessionStorage.getItem(STORAGE_KEY) === '1' } catch { /* storage bloqueado */ }
    if (already) { setShow(false); return }

    setShow(true)
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* noop */ }

    const tText = window.setTimeout(() => setTextIn(true), TEXT_DELAY_MS)
    const tFade = window.setTimeout(() => setFadingOut(true), SPRITE_MS + HOLD_MS)
    const tEnd  = window.setTimeout(() => setShow(false),    TOTAL_MS)
    return () => {
      window.clearTimeout(tText)
      window.clearTimeout(tFade)
      window.clearTimeout(tEnd)
    }
  }, [])

  if (show !== true) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center
                  bg-c1 transition-opacity
                  ${fadingOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div
        className="splash-sprite"
        style={{
          width: FRAME_SIZE,
          height: FRAME_SIZE,
          backgroundImage: 'url(/sprites/un-toque/hand-sheet.png)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${FRAME_SIZE * FRAMES}px ${FRAME_SIZE}px`,
          animation: `splashPlay ${SPRITE_MS}ms steps(${FRAMES}) forwards`,
        }}
      />

      {/* Texto "UnToque" — entra en fade-up cuando el sprite llega al final */}
      <p
        className="font-display text-white text-[44px] leading-none tracking-[-0.02em] mt-6"
        style={{
          fontWeight: 900,
          opacity: textIn ? 1 : 0,
          transform: textIn ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          transition: `opacity ${TEXT_IN_MS}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${TEXT_IN_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
          textShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}
      >
        UnToque
      </p>
    </div>
  )
}
