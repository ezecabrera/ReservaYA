'use client'

import { useEffect, useState } from 'react'

/**
 * Splash screen de Un Toque. Se muestra una sola vez por sesión (flag en
 * sessionStorage) para sentirse como un cold-start nativo sin ser molesto
 * en navegaciones internas.
 *
 * Animación: sprite sheet horizontal de 24 frames · 256×256 c/u · 900 ms
 * duration, run-once via `steps(24)` sobre background-position. Respeta
 * prefers-reduced-motion mostrando el poster estático + fade out corto.
 */

const FRAMES = 24
const FRAME_SIZE = 256
const DURATION_MS = 900
const FADE_MS = 280
const TOTAL_MS = DURATION_MS + FADE_MS
const STORAGE_KEY = 'un-toque-splash-shown'

export function SplashScreen() {
  const [show, setShow] = useState<boolean | null>(null)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    // Primera vez por sesión?
    let already = false
    try { already = sessionStorage.getItem(STORAGE_KEY) === '1' } catch { /* storage bloqueado */ }
    if (already) { setShow(false); return }

    setShow(true)
    try { sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* noop */ }

    // Mostrar el poster un rato, fade out, desmontar
    const t1 = window.setTimeout(() => setFadingOut(true), DURATION_MS)
    const t2 = window.setTimeout(() => setShow(false), TOTAL_MS)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
  }, [])

  if (show !== true) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex items-center justify-center
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
          animation: `splashPlay ${DURATION_MS}ms steps(${FRAMES}) forwards`,
        }}
      />
      <p className="absolute bottom-16 font-display text-white font-bold text-[22px] tracking-tight">
        Un Toque
      </p>
    </div>
  )
}
