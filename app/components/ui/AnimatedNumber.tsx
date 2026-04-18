'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Count-up suave que respeta prefers-reduced-motion.
 * Mismo comportamiento que el del panel — copiado para mantener app y panel
 * independientes (sin acoplar shared con hooks de UI).
 */
export function AnimatedNumber({
  value,
  duration = 700,
  decimals = 0,
  suffix = '',
}: {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
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
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + delta * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = value
      }
    }
    frameRef.current = requestAnimationFrame(step)
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current) }
  }, [value, duration])

  const formatted = decimals === 0
    ? Math.round(display).toString()
    : display.toFixed(decimals)
  return <>{formatted}{suffix}</>
}
