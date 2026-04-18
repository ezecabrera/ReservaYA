'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  /** Duración total de la animación en ms (default 700ms). */
  duration?: number
  /** Decimales a mostrar (default 0). */
  decimals?: number
  /** Sufijo estático (ej: "%", "hs"). */
  suffix?: string
}

/**
 * Anima un número desde su último valor hasta el nuevo con easing suave.
 * Respeta prefers-reduced-motion: si el usuario lo tiene activo, setea el
 * valor final de una.
 *
 * Uso:
 *   <AnimatedNumber value={stats.visitas} />
 *   <AnimatedNumber value={occupancy} decimals={1} suffix="%" />
 */
export function AnimatedNumber({
  value,
  duration = 700,
  decimals = 0,
  suffix = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    // Si el usuario pidió menos movimiento, saltamos la animación
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const from = fromRef.current
    const delta = value - from
    if (delta === 0) return

    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic — desacelera hacia el final, nunca overshoots
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + delta * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = value
      }
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  const formatted = decimals === 0
    ? Math.round(display).toString()
    : display.toFixed(decimals)

  return <>{formatted}{suffix}</>
}
