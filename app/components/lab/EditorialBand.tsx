import Link from 'next/link'
import { GUIDES } from '@/lib/occasions'
import { getGuideImage } from '@/lib/venue-images'

export function EditorialBand() {
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-0.5">
            Guías
          </p>
          <h2 className="font-display text-[22px] text-tx tracking-tight">
            Elegí por ocasión
          </h2>
        </div>
        <Link
          href="/guias"
          className="text-[13px] text-tx2 font-semibold underline underline-offset-2"
        >
          Ver todas
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] snap-x pb-1">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guias/${g.slug}`}
            className="flex-shrink-0 w-[260px] rounded-xl overflow-hidden
                       bg-white border border-[var(--br)] shadow-sm snap-start
                       active:scale-[0.98] transition-transform duration-[180ms]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-sf2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getGuideImage(g.imageSeed, 520, 390)}
                alt={g.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                  {g.eyebrow}
                </p>
                <h3 className="font-display text-[18px] leading-tight drop-shadow">
                  {g.title}
                </h3>
              </div>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between">
              <p className="text-[12px] text-tx2 line-clamp-2 leading-snug">
                {g.lede}
              </p>
              <span className="text-c1 text-[11px] font-bold flex-shrink-0 ml-2 inline-flex items-center gap-1">
                Ver
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
