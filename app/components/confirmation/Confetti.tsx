'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#FF4757', '#2ED8A8', '#FFB800', '#4E8EFF', '#9B59FF', '#FF8C42']

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; color: string
  opacity: number; rotation: number; rotationSpeed: number
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: 1.5 + Math.random() * 3.5,
      size: 4 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.85 + Math.random() * 0.15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
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
        p.vy += 0.04 // gravity
        p.rotation += p.rotationSpeed
        if (elapsed > 90) p.opacity -= 0.012

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
      className="pointer-events-none fixed inset-0 z-10"
      aria-hidden="true"
    />
  )
}
