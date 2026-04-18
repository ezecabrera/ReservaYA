'use client'

import { useEffect, useRef } from 'react'

/**
 * Confetti editorial — paleta ink (wine / olive / gold / terracotta).
 *
 * Contenido: 40 partículas, gravedad suave, fade-out a los ~1.5s.
 * Respeta prefers-reduced-motion (no renderiza el canvas).
 *
 * Uso: montar cuando termine una acción celebratoria. Auto-desmonta o lo
 * remueve el parent cuando el animation frame devuelve alive=false.
 */

const COLORS = [
  '#A13143', // wine
  '#C36878', // wine-soft
  '#4F8A5F', // olive
  '#C99130', // gold
  '#D66A3F', // terracotta
  '#F3F0EA', // ink-text (paper warm)
]

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; color: string
  opacity: number; rotation: number; rotationSpeed: number
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 40 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 180,
      y: canvas.height / 2 - 40 - Math.random() * 60,
      vx: (Math.random() - 0.5) * 6,
      vy: -2 - Math.random() * 4,
      size: 5 + Math.random() * 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.9,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    }))

    let frame: number
    let elapsed = 0

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      elapsed++

      let alive = false
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12 // gravity
        p.rotation += p.rotationSpeed
        if (elapsed > 60) p.opacity -= 0.018

        if (p.y < canvas!.height && p.opacity > 0) alive = true

        ctx!.save()
        ctx!.globalAlpha = Math.max(0, p.opacity)
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rotation)
        ctx!.fillStyle = p.color
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx!.restore()
      }

      if (alive) frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[90]"
      aria-hidden="true"
    />
  )
}
