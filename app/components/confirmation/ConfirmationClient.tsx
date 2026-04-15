'use client'

import { useEffect, useState } from 'react'
import { Confetti } from './Confetti'
import { QRDisplay } from './QRDisplay'
import { BottomNav } from '@/components/ui/BottomNav'
import { buildWhatsAppUrl, buildWhatsAppMessage, generateICS } from '@/lib/shared'

interface ConfirmationData {
  userName: string
  tableLabel: string
  venueName: string
  venueAddress: string
  date: string       // YYYY-MM-DD
  timeSlot: string   // HH:MM
  partySize: number
  qrUrl: string
  reservationId: string
  depositAmount: number
}

interface ConfirmationClientProps {
  data: ConfirmationData
  status: 'approved' | 'pending' | 'rejected'
}

export function ConfirmationClient({ data, status }: ConfirmationClientProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [animStep, setAnimStep] = useState(0)
  const [groupToken, setGroupToken] = useState<string | null>(null)
  const [groupLoading, setGroupLoading] = useState(false)

  async function handleCreateGroup() {
    setGroupLoading(true)
    try {
      const res = await fetch('/api/grupo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: data.reservationId }),
      })
      const json = await res.json() as { link_token: string }
      setGroupToken(json.link_token)
    } finally {
      setGroupLoading(false)
    }
  }

  const groupUrl = groupToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/grupo/${groupToken}`
    : null

  useEffect(() => {
    if (status !== 'approved') return
    // Stagger de animaciones de entrada
    setShowConfetti(true)
    const timers = [
      setTimeout(() => setAnimStep(1), 100),
      setTimeout(() => setAnimStep(2), 300),
      setTimeout(() => setAnimStep(3), 500),
      setTimeout(() => setAnimStep(4), 700),
      setTimeout(() => setAnimStep(5), 900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [status])

  const whatsAppMsg = buildWhatsAppMessage({
    venueName: data.venueName,
    date: data.date,
    timeSlot: data.timeSlot,
    userName: data.userName,
    tableLabel: data.tableLabel,
    venueAddress: data.venueAddress,
  })

  function handleAddToCalendar() {
    const icsContent = generateICS({
      reservationId: data.reservationId,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      date: data.date,
      timeSlot: data.timeSlot,
      tableLabel: data.tableLabel,
      userName: data.userName,
    })
    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reserva-${data.venueName.toLowerCase().replace(/\s+/g, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Estado de pago rechazado
  if (status === 'rejected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center screen-x text-center">
        <div className="w-16 h-16 rounded-full bg-c1l flex items-center justify-center mb-4">
          <span className="text-[#D63646] text-[28px]">✕</span>
        </div>
        <h1 className="font-display text-[24px] font-bold text-tx">Pago no aprobado</h1>
        <p className="text-tx2 text-[14px] mt-2">
          El pago fue rechazado o cancelado. Podés volver a intentarlo.
        </p>
        <a href="/" className="btn-primary mt-6 block">Volver al inicio</a>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center screen-x text-center">
        <div className="w-16 h-16 rounded-full bg-c3l flex items-center justify-center mb-4">
          <span className="text-[#CC7700] text-[28px]">⏳</span>
        </div>
        <h1 className="font-display text-[24px] font-bold text-tx">Pago pendiente</h1>
        <p className="text-tx2 text-[14px] mt-2">
          Tu pago está siendo procesado. Te confirmamos por email cuando se acredite.
        </p>
        <a href="/" className="btn-surface mt-6 block">Volver al inicio</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-28 relative overflow-hidden">
      {showConfetti && <Confetti />}

      <div className="screen-x pt-12 space-y-5 relative z-20">

        {/* 1. Animación de éxito */}
        <div className="flex flex-col items-center gap-3">
          <div
            className={`transition-all duration-500 ${animStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2ED8A8, #00E5C4)' }}>
              <svg width="36" height="36" viewBox="0 0 50 50" fill="none">
                <path
                  d="M12 25l9 9 17-17"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: animStep >= 1 ? 0 : 100,
                    transition: 'stroke-dashoffset 0.65s 0.4s ease forwards',
                  }}
                />
              </svg>
            </div>
          </div>

          {/* 2. Título */}
          <div className={`text-center transition-all duration-400
            ${animStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">
              ¡Reserva confirmada!
            </h1>
            <p className="text-tx2 text-[14px] mt-1">
              {data.venueName} · {
                new Date(data.date + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })
              } · {data.timeSlot} hs
            </p>
          </div>
        </div>

        {/* 3. Card de código de mesa — el elemento más prominente */}
        <div
          className={`transition-all duration-400
            ${animStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <div className="bg-tx rounded-xl p-7 text-center">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.15em] mb-3">
              Tu código de mesa
            </p>
            <p
              className="text-white font-display font-bold"
              style={{ fontSize: '32px', letterSpacing: '-0.02em' }}
            >
              {data.userName} · {data.tableLabel}
            </p>
            <p className="text-white/40 text-[11px] font-semibold mt-3 uppercase tracking-wider">
              Mostrá este código en la entrada
            </p>
          </div>
        </div>

        {/* 4. QR */}
        <div className={`transition-all duration-400
          ${animStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <QRDisplay value={data.qrUrl} />
        </div>

        {/* 5. Botones de acción */}
        <div className={`space-y-3 transition-all duration-400
          ${animStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a
            href={buildWhatsAppUrl(whatsAppMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Guardar en WhatsApp
          </a>

          <button onClick={handleAddToCalendar} className="btn-surface">
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"
                  stroke="var(--tx)" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18"
                  stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Agregar al calendario
            </span>
          </button>

          {/* Modo grupo */}
          {!groupToken ? (
            <button
              onClick={handleCreateGroup}
              disabled={groupLoading}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" stroke="var(--tx)" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {groupLoading ? 'Generando link…' : 'Invitar al grupo'}
            </button>
          ) : (
            <div className="card-confirmation p-4 space-y-3">
              <p className="text-[12px] font-bold text-[#15A67A] uppercase tracking-wider">
                Link del grupo
              </p>
              <div className="bg-white/80 rounded-lg px-3 py-2">
                <p className="text-[12px] text-tx2 break-all font-mono">{groupUrl}</p>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Te invito a la salida! 🎉\n${data.venueName} el ${
                    new Date(data.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
                  } a las ${data.timeSlot} hs.\nConfirmá tu lugar acá: ${groupUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Compartir por WhatsApp
              </a>
            </div>
          )}

          <a href="/mis-reservas" className="block text-center text-tx2 text-[13px] py-2 font-semibold">
            Ver mis reservas →
          </a>
        </div>

        {/* Info de seña */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-tx2">Seña abonada</p>
            <p className="text-[11px] text-tx3 mt-0.5">Se descuenta de tu consumo al llegar</p>
          </div>
          <span className="font-display text-[20px] font-bold text-c2">
            ${data.depositAmount.toLocaleString('es-AR')}
          </span>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
