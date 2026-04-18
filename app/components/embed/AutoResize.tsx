'use client'

import { useEffect } from 'react'

/**
 * Observa el tamaño del documento y lo postea al parent del iframe.
 * El script instalador (embed.js) escucha este mensaje y ajusta la altura
 * del iframe dinámicamente — así no queda scroll interno ni espacio vacío.
 *
 * Mensaje: { type: 'reservaya:resize', height: <number px> }
 */
export function AutoResize() {
  useEffect(() => {
    // Sólo tiene sentido si estamos dentro de un iframe
    if (typeof window === 'undefined' || window.parent === window) return

    const post = () => {
      const height = Math.ceil(document.documentElement.scrollHeight)
      window.parent.postMessage(
        { type: 'reservaya:resize', height },
        '*', // El parent puede validar origin; nosotros no sabemos cuál es
      )
    }

    // Inicial + observer de cambios de tamaño
    post()
    const ro = new ResizeObserver(() => post())
    ro.observe(document.body)

    // También reportar cuando cambian imágenes u otras async resources
    window.addEventListener('load', post)

    return () => {
      ro.disconnect()
      window.removeEventListener('load', post)
    }
  }, [])

  return null
}
