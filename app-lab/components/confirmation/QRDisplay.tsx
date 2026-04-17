'use client'

import { useEffect, useRef } from 'react'

interface QRDisplayProps {
  /** URL o string a codificar en el QR */
  value: string
}

export function QRDisplay({ value }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!value) return
    // Importar qrcode dinámicamente para no bloquearlo en SSR
    import('qrcode').then((QRCode) => {
      if (!canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, value, {
        width: 200,
        margin: 2,
        color: { dark: '#0D0D0D', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      })
    })
  }, [value])

  return (
    <div className="flex flex-col items-center gap-3 card p-5">
      <canvas
        ref={canvasRef}
        className="rounded-lg"
        width={200}
        height={200}
        aria-label="Código QR de check-in"
      />
      <p className="text-tx3 text-[11px] font-semibold text-center">
        Mostrá este QR en la entrada para el check-in
      </p>
    </div>
  )
}
