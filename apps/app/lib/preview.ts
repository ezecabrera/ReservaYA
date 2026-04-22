'use client'

import { useEffect, useState } from 'react'

/**
 * Devuelve `true` si el usuario está en modo preview (cookie `preview_access=1`).
 * Usado para ocultar CTAs que aún no funcionan (búsqueda, notificaciones,
 * botón reservar) mientras el producto está pre-lanzamiento.
 *
 * SSR-safe: durante el primer render en el server devuelve `false` y al
 * hidratar corrige. Evita mismatches usando el valor como prop en
 * renderizados condicionales simples (hide/show).
 */
export function usePreviewMode(): boolean {
  const [isPreview, setIsPreview] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const has = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('preview_access=1'))
    setIsPreview(has)
  }, [])

  return isPreview
}
