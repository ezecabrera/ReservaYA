'use client'

import { useEffect, useState, useCallback } from 'react'

type StepId = 'welcome' | 'explore' | 'detail' | 'reserve' | 'confirm' | 'ready'

interface Step {
  id: StepId
  eyebrow: string
  title: string
  description: string
  illustration: React.ReactNode
}

const CORAL = '#FF4757'

/* ─── Ilustraciones SVG inline con acento coral ─────────────────────── */

function IllustrationWelcome() {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="#111" />
      <circle cx="120" cy="80" r="46" fill={CORAL} opacity="0.18" />
      <circle cx="120" cy="80" r="28" fill={CORAL} />
      <text
        x="120"
        y="89"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="28"
        fontWeight="900"
        fill="white"
      >
        ✦
      </text>
    </svg>
  )
}

function IllustrationExplore() {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="#111" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${24 + i * 68}, 40)`}>
          <rect width="60" height="80" rx="8" fill="white" opacity="0.08" />
          <rect width="60" height="44" rx="8" fill={CORAL} opacity={0.25 + i * 0.15} />
          <rect x="8" y="52" width="32" height="6" rx="3" fill="white" opacity="0.6" />
          <rect x="8" y="62" width="22" height="4" rx="2" fill="white" opacity="0.3" />
        </g>
      ))}
    </svg>
  )
}

function IllustrationDetail() {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="#111" />
      {/* Preview de una venue card expandida: foto + datos */}
      <rect x="32" y="24" width="176" height="60" rx="10" fill={CORAL} opacity="0.22" />
      <rect x="46" y="38" width="30" height="30" rx="5" fill={CORAL} />
      <rect x="84" y="42" width="70" height="8" rx="3" fill="white" opacity="0.85" />
      <rect x="84" y="56" width="50" height="5" rx="2" fill="white" opacity="0.45" />
      {/* Stars */}
      <text x="166" y="50" fontSize="10" fill={CORAL}>★★★★</text>
      {/* Tabs debajo */}
      <rect x="32" y="96" width="44" height="16" rx="8" fill={CORAL} />
      <rect x="82" y="96" width="44" height="16" rx="8" fill="white" opacity="0.12" />
      <rect x="132" y="96" width="44" height="16" rx="8" fill="white" opacity="0.12" />
      {/* Body lines */}
      <rect x="32" y="122" width="176" height="5" rx="2" fill="white" opacity="0.25" />
      <rect x="32" y="132" width="140" height="5" rx="2" fill="white" opacity="0.2" />
    </svg>
  )
}

function IllustrationReserve() {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="#111" />
      {[
        { x: 58, label: '📅' },
        { x: 120, label: '🕘' },
        { x: 182, label: '👥' },
      ].map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy="80" r="22" fill={CORAL} opacity={i === 1 ? 1 : 0.35} />
          <text x={s.x} y="86" textAnchor="middle" fontSize="20">
            {s.label}
          </text>
          {i < 2 && (
            <line
              x1={s.x + 22}
              y1="80"
              x2={s.x + 40}
              y2="80"
              stroke="white"
              strokeOpacity="0.3"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}
        </g>
      ))}
    </svg>
  )
}

function IllustrationConfirm() {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="#111" />
      <circle cx="120" cy="80" r="38" fill={CORAL} />
      <path
        d="M104 82l11 11 22-22"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="120" cy="80" r="50" fill="none" stroke={CORAL} strokeWidth="1.5" opacity="0.4" />
      <circle cx="120" cy="80" r="62" fill="none" stroke={CORAL} strokeWidth="1" opacity="0.2" />
    </svg>
  )
}

function IllustrationReady() {
  return (
    <svg viewBox="0 0 240 160" className="h-full w-full" aria-hidden>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="#111" />
      <ellipse cx="120" cy="120" rx="70" ry="8" fill={CORAL} opacity="0.2" />
      <rect x="88" y="72" width="64" height="48" rx="6" fill="white" opacity="0.08" />
      <circle cx="105" cy="92" r="8" fill={CORAL} />
      <circle cx="135" cy="100" r="5" fill="white" opacity="0.35" />
      <text x="60" y="44" fontSize="18" fill={CORAL}>★</text>
      <text x="170" y="38" fontSize="14" fill="white" opacity="0.6">★</text>
      <text x="196" y="62" fontSize="16" fill={CORAL}>★</text>
      <text x="40" y="72" fontSize="12" fill="white" opacity="0.5">★</text>
    </svg>
  )
}

const STEPS: Step[] = [
  {
    id: 'welcome',
    eyebrow: 'Bienvenido al preview',
    title: '¿Así funciona UnToque?',
    description:
      'Te mostramos en 6 pasos cómo vas a reservar tu próxima mesa. Al terminar, te damos 60 segundos para que pruebes la app tranquilo.',
    illustration: <IllustrationWelcome />,
  },
  {
    id: 'explore',
    eyebrow: 'Paso 1 · Explorar',
    title: 'Descubrí restaurantes',
    description:
      'Mirá los lugares destacados cerca tuyo, filtrá por cocina, barrio o rango de precio. El catálogo curado de Argentina en un scroll.',
    illustration: <IllustrationExplore />,
  },
  {
    id: 'detail',
    eyebrow: 'Paso 2 · Detalle',
    title: 'Mirá fotos, menú y reseñas',
    description:
      'Entrás al lugar que te gustó y ves todo: fotos reales, menú con precios, reviews de otros comensales y qué tan serio es el lugar con las cancelaciones.',
    illustration: <IllustrationDetail />,
  },
  {
    id: 'reserve',
    eyebrow: 'Paso 3 · Reservar',
    title: 'Elegí fecha, hora y personas',
    description:
      'Seleccioná el día, el horario y cuántos van. Te mostramos las mesas disponibles al toque.',
    illustration: <IllustrationReserve />,
  },
  {
    id: 'confirm',
    eyebrow: 'Paso 4 · Confirmar',
    title: 'Tu reserva en un toque',
    description:
      'Dejás tus datos, recibís la confirmación por WhatsApp y un QR para presentar en el lugar. Listo, sin idas y vueltas.',
    illustration: <IllustrationConfirm />,
  },
  {
    id: 'ready',
    eyebrow: 'Paso 5 · Disfrutar',
    title: '¡Y ahora probalo vos!',
    description:
      'Cuando toques el botón, te damos 60 segundos para navegar la app. Al final, el restaurante también te califica a vos — parte de nuestra magia.',
    illustration: <IllustrationReady />,
  },
]

interface Props {
  open: boolean
  onComplete: () => void
  onSkip: () => void
}

/**
 * Tutorial modal de 6 pasos con ilustraciones SVG + navegación ← →.
 *
 * Controlado por el padre via `open`. Al terminar invoca `onComplete`
 * (el padre setea la cookie de preview y navega al home). `onSkip`
 * se dispara si el usuario cierra con ✕, Esc o click en backdrop.
 */
export function PreviewTutorial({ open, onComplete, onSkip }: Props) {
  const [entering, setEntering] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setIndex(0)
      // Animación de entrada rápida para que se sienta instantáneo.
      const t = requestAnimationFrame(() => setEntering(true))
      return () => cancelAnimationFrame(t)
    } else {
      setEntering(false)
    }
  }, [open])

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }, [])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  // Keyboard nav
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onSkip, next, prev])

  if (!open) return null

  const step = STEPS[index]
  const isFirst = index === 0
  const isLast = index === STEPS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-tutorial-title"
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-150 ${
        entering ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onSkip}
        aria-hidden
      />

      {/* Modal */}
      <div
        className={`relative mx-4 flex w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] bg-black text-white shadow-2xl ring-1 ring-white/10 transition-transform duration-200 sm:mx-0 ${
          entering ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'
        }`}
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5">
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            Tutorial · {index + 1} de {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-[12px] font-semibold text-white/50 transition-colors hover:text-white"
          >
            Saltar ✕
          </button>
        </div>

        {/* Ilustración */}
        <div className="px-6 pt-5">
          <div className="aspect-[3/2] w-full overflow-hidden rounded-2xl">
            {step.illustration}
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 pt-5">
          <p
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: CORAL }}
          >
            {step.eyebrow}
          </p>
          <h2
            id="preview-tutorial-title"
            className="font-display mt-2 text-[26px] font-black leading-tight sm:text-[32px]"
          >
            {step.title}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/70 sm:text-[15px]">
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 px-6 pt-5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al paso ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 22 : 8,
                backgroundColor: i === index ? CORAL : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-5">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-white/70 transition-colors hover:border-white/40 hover:text-white disabled:opacity-30 disabled:hover:border-white/15"
          >
            ← Anterior
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={onComplete}
              className="rounded-full px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: CORAL }}
            >
              Empezar los 60s →
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="rounded-full px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: CORAL }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
