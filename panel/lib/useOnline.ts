'use client'

import { useEffect, useState } from 'react'

/**
 * Hook que refleja el estado de conexión del navegador.
 * SSR-safe: durante la hidratación asume "online" y se ajusta en el primer
 * mount para evitar flashear el banner offline en cada carga.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    // Sync inicial con el estado real del navegador
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)

    const onOnline  = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return online
}
