'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker una sola vez al cargar el shell del panel.
 * Sólo se ejecuta en producción — en dev el SW agresivo interfiere con HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (err) {
        // No queremos tirar la app si el SW falla al registrarse
        console.warn('[panel] SW register falló:', err)
      }
    }

    register()
  }, [])

  return null
}
