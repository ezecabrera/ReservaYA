import Link from 'next/link'
import { BottomNav } from '@/components/ui/BottomNav'
import { GUIDES } from '@/lib/occasions'
import { getGuideImage } from '@/lib/venue-images'

export const metadata = {
  title: 'Guías · Un Toque',
}

export default function GuidesListPage() {
  return (
    <div className="min-h-screen bg-bg pb-28">
      <header className="screen-x pt-14 pb-4 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="flex-shrink-0 w-10 h-10 rounded-full bg-sf border border-[var(--br)]
                     flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <p className="text-tx3 text-[11px] font-bold uppercase tracking-wider">
            Elegí por ocasión
          </p>
          <h1 className="font-display text-[26px] text-tx leading-none mt-0.5">
            Guías
          </h1>
        </div>
      </header>

      <div className="screen-x">
        <p className="text-tx2 text-[13.5px] leading-relaxed mb-5">
          Listas curadas para cada momento. Elegí la ocasión y te mostramos los
          restaurantes que mejor encajan.
        </p>

        <div className="grid gap-3">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guias/${g.slug}`}
              className="relative rounded-xl overflow-hidden border border-[var(--br)]
                         shadow-sm bg-white active:scale-[0.99]
                         transition-transform duration-[180ms]"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getGuideImage(g.imageSeed, 800, 450)}
                  alt={g.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[1.2px] opacity-90">
                    {g.eyebrow}
                  </p>
                  <h2 className="font-display text-[22px] leading-tight tracking-[-0.2px]
                                 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                    {g.title}
                  </h2>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <p className="text-[13px] text-tx2 leading-snug line-clamp-1 max-w-[240px]">
                  {g.lede}
                </p>
                <span className="text-c1 text-[13px] font-bold flex-shrink-0 ml-2 inline-flex items-center gap-1">
                  Ver
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
