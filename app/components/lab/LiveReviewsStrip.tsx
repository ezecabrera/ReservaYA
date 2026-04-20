'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// Reviews hardcoded (datos demo). Se rotan para dar sensación de "en vivo".
// venueId apunta a un venue real del seed (formato decXXXXX-...) para que
// tocar la reseña navegue al detalle, landing en la tab Reseñas.
const SEED_REVIEWS = [
  { name: 'Martina', venueId: 'dec00001-0000-4000-a000-000000000000', venue: 'Trattoria Sentori', text: 'Las pastas al ragú estaban espectaculares. Volvemos.', score: 5, minsAgo: 12 },
  { name: 'Joaquín', venueId: 'dec00005-0000-4000-a000-000000000000', venue: 'El Fogón del Sur', text: 'Ojo de bife en su punto. Atención impecable.', score: 5, minsAgo: 34 },
  { name: 'Sofía',   venueId: 'dec00010-0000-4000-a000-000000000000', venue: 'Napoli Forno', text: 'La masa se deshace, 10 puntos. Pedí la margherita.', score: 5, minsAgo: 48 },
  { name: 'Lucas',   venueId: 'dec00017-0000-4000-a000-000000000000', venue: 'Niko Sushi Bar', text: 'Combinado generoso, pescado súper fresco.', score: 4, minsAgo: 63 },
  { name: 'Camila',  venueId: 'dec00013-0000-4000-a000-000000000000', venue: 'Verde de Mercado', text: 'Probé el buddha bowl y el ceviche de coliflor. Ambos 10.', score: 5, minsAgo: 71 },
  { name: 'Valentina', venueId: 'dec00008-0000-4000-a000-000000000000', venue: 'Asador Don Ramiro', text: 'La parrillada para 2 súper abundante. Volvemos con amigos.', score: 5, minsAgo: 95 },
  { name: 'Tomás',   venueId: 'dec00011-0000-4000-a000-000000000000', venue: 'Piedra Viva', text: 'Pizza a la piedra fina, masa madre notable.', score: 4, minsAgo: 118 },
  { name: 'Julieta', venueId: 'dec00018-0000-4000-a000-000000000000', venue: 'Omakase Kintaro', text: 'Experiencia única, el chef súper atento.', score: 5, minsAgo: 142 },
]

function formatTime(mins: number): string {
  if (mins < 60) return `Hace ${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `Hace ${h}h` : `Hace ${h}h ${m}min`
}

export function LiveReviewsStrip() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000) // +30s cada 30s
    return () => clearInterval(id)
  }, [])

  const reviews = SEED_REVIEWS.map((r, i) => ({
    ...r,
    minsAgo: r.minsAgo + Math.floor(tick / 2) + i * 3,
  }))

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-c1 animate-pulse" />
          <p className="text-[11px] font-bold text-tx uppercase tracking-wider">
            Lo que dice la gente
          </p>
        </div>
        <span className="text-[11px] text-tx3">En vivo</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] snap-x">
        {reviews.map((r, i) => (
          <Link
            key={i}
            href={`/${r.venueId}?tab=resenas`}
            aria-label={`Ver reseñas de ${r.venue}`}
            className="flex-shrink-0 w-[270px] bg-white rounded-xl border border-[var(--br)]
                       p-4 snap-start shadow-sm active:scale-[0.98]
                       transition-transform duration-[180ms] cursor-pointer
                       hover:border-c1/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-c1 to-c3
                                flex items-center justify-center text-white font-bold text-[12px]">
                  {r.name[0]}
                </div>
                <span className="text-[12px] font-semibold text-tx">{r.name}</span>
              </div>
              <div className="flex items-center gap-0.5 text-c3">
                {Array.from({ length: r.score }).map((_, i) => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-[13px] text-tx leading-snug line-clamp-3">&ldquo;{r.text}&rdquo;</p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--br)]">
              <span className="text-[11px] text-tx2 font-semibold truncate max-w-[150px]">
                {r.venue}
              </span>
              <span className="text-[10px] text-tx3">{formatTime(r.minsAgo)}</span>
            </div>
            <div className="mt-2 text-[11px] text-c1 font-bold inline-flex items-center gap-1">
              Ver restaurante
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
