import type { Metadata } from 'next'
import { PreviewButton } from './PreviewButton'

export const metadata: Metadata = {
  title: 'Muy pronto — UnToque',
  description:
    'Estamos construyendo UnToque, la forma más simple de reservar mesa en Argentina.',
  robots: { index: false, follow: false },
}

/**
 * Holding page pre-lanzamiento. Fondo negro, tipografía serif (Fraunces),
 * copy minimalista. Incluye un botón de preview de 60s que setea cookie
 * y manda a la home real.
 *
 * Para desactivar este holding page y abrir el sitio al público:
 *   → setear ENABLE_HOLDING_PAGE=0 en Vercel y redeployar.
 */
export default function ProximamentePage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {/* Header mínimo */}
      <header className="flex items-center justify-between px-6 py-6 sm:px-12">
        <span className="font-display text-xl font-black tracking-tight">
          UnToque
        </span>
        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-white/40 sm:block">
          deuntoque.com
        </span>
      </header>

      {/* Contenido centrado */}
      <main className="relative flex flex-1 items-center justify-center px-6 sm:px-12">
        {/* Acento coral de fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: '#FF4757' }}
        />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-white/40">
            Muy pronto
          </p>

          <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
            Estamos
            <br />
            preparando
            <br />
            <span style={{ color: '#FF4757' }}>algo bueno.</span>
          </h1>

          <p className="mx-auto mt-10 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
            Trabajamos en la forma más simple de reservar mesa en los
            restaurantes de Argentina. Volvé en unos días.
          </p>

          <PreviewButton />

          <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/30">
            Vista previa en desarrollo · 1 minuto
          </p>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="px-6 py-6 sm:px-12">
        <div className="flex flex-col items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-white/30 sm:flex-row">
          <span>© {new Date().getFullYear()} UnToque</span>
          <span>Buenos Aires · Argentina</span>
        </div>
      </footer>
    </div>
  )
}
