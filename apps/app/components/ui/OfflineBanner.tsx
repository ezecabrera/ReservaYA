'use client'

import { useEffect, useState } from 'react'

/**
 * Banner fijo arriba cuando el browser reporta sin conexión.
 * Escucha los eventos 'online' y 'offline' del window.
 *
 * Se mostra sólo cuando isOnline === false. Cuando vuelve online muestra un
 * mini toast "Volviste a estar online" que se oculta en 2s.
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [justCameBack, setJustCameBack] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setIsOnline(navigator.onLine)

    function handleOnline() {
      setIsOnline(true)
      setJustCameBack(true)
      window.setTimeout(() => setJustCameBack(false), 2500)
    }
    function handleOffline() {
      setIsOnline(false)
      setJustCameBack(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !justCameBack) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[150]
                  flex items-center justify-center gap-2
                  text-white text-[13px] font-bold py-2
                  ${isOnline ? 'bg-c2' : 'bg-tx'}
                  transition-all duration-300`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full
                    ${isOnline ? 'bg-white' : 'bg-c1 animate-pulse'}`}
      />
      {isOnline ? 'Volviste a estar online' : 'Sin conexión — algunas funciones no están disponibles'}
    </div>
  )
}
