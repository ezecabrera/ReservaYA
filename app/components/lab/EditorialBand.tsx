import Link from 'next/link'

interface Guide {
  slug: string
  eyebrow: string
  title: string
  lede: string
  imageSeed: string
  count: number
}

const GUIDES: Guide[] = [
  {
    slug: 'parrillas-cortes-premium',
    eyebrow: 'Guía curada',
    title: 'Parrillas con cortes premium',
    lede: 'Bodegones contemporáneos y steakhouses con carne madurada.',
    imageSeed: 'guide-parrillas',
    count: 4,
  },
  {
    slug: 'nuevas-aperturas',
    eyebrow: 'Recién aterrizados',
    title: 'Nuevos en la ciudad',
    lede: 'Los restaurantes que abrieron hace menos de 3 meses.',
    imageSeed: 'guide-nuevos',
    count: 5,
  },
  {
    slug: 'al-aire-libre',
    eyebrow: 'Para este finde',
    title: 'Al aire libre',
    lede: 'Terrazas, patios y veredas que valen la ocasión.',
    imageSeed: 'guide-terrazas',
    count: 6,
  },
  {
    slug: 'para-cita',
    eyebrow: 'Escena romántica',
    title: 'Para una cita',
    lede: 'Luz tenue, cocina con autor y buena carta de vinos.',
    imageSeed: 'guide-cita',
    count: 4,
  },
]

export function EditorialBand() {
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold text-tx3 uppercase tracking-wider mb-0.5">
            Guías
          </p>
          <h2 className="font-display text-[22px] font-bold text-tx tracking-tight">
            Elegí por ocasión
          </h2>
        </div>
        <Link href="/" className="text-[13px] text-tx2 font-semibold underline underline-offset-2">
          Ver todas
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] snap-x pb-1">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href="/"
            className="flex-shrink-0 w-[260px] rounded-xl overflow-hidden
                       bg-white border border-[var(--br)] shadow-sm snap-start
                       active:scale-[0.98] transition-transform duration-[180ms]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-sf2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/${g.imageSeed}/520/390`}
                alt={g.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                  {g.eyebrow}
                </p>
                <h3 className="font-display text-[18px] font-bold leading-tight drop-shadow">
                  {g.title}
                </h3>
              </div>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between">
              <p className="text-[12px] text-tx2 line-clamp-2 leading-snug">{g.lede}</p>
              <span className="badge bg-sf text-tx2 text-[10px] flex-shrink-0 ml-2">
                {g.count}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
