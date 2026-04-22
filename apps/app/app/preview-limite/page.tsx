import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Preview — UnToque',
  description:
    'Estás en modo preview. Los pagos y reservas reales se habilitan cuando lancemos.',
  robots: { index: false, follow: false },
}

/**
 * Pantalla que se muestra cuando el usuario en preview intenta llegar a una
 * ruta que normalmente requiere auth real o procesa un pago:
 *   /login, /recuperar, /reserva/*\/pagar, /reserva/*\/confirmacion,
 *   /mis-reservas, /perfil/configuracion, etc.
 *
 * En vez de redirigir a login (confuso), les explicamos la situación y los
 * invitamos a seguir explorando el catálogo.
 */
export default function PreviewLimitePage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 sm:px-12">
        <Link
          href="/"
          className="font-display text-xl font-black tracking-tight no-underline text-white"
        >
          UnToque
        </Link>
        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-white/40 sm:block">
          Preview · deuntoque.com
        </span>
      </header>

      {/* Contenido centrado */}
      <main className="relative flex flex-1 items-center justify-center px-6 sm:px-12">
        {/* Glow coral */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-[100px]"
          style={{ background: '#FF4757' }}
        />

        <div className="relative z-10 mx-auto max-w-xl text-center">
          {/* Icono candado con acento coral */}
          <div
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255, 71, 87, 0.14)' }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="4"
                y="11"
                width="16"
                height="10"
                rx="2"
                stroke="#FF4757"
                strokeWidth="2"
              />
              <path
                d="M8 11V7a4 4 0 018 0v4"
                stroke="#FF4757"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1.4" fill="#FF4757" />
            </svg>
          </div>

          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-white/40">
            Modo preview
          </p>

          <h1 className="font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Acá es donde
            <br />
            <span style={{ color: '#FF4757' }}>reservás de verdad.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-white/70">
            Esta es una vista previa de la app — los pagos, logins y reservas
            reales se habilitan cuando lancemos oficialmente. Mientras tanto,
            seguí explorando el catálogo.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13px] font-bold text-white transition-transform hover:scale-[1.02] no-underline"
              style={{ backgroundColor: '#FF4757' }}
            >
              ← Volver a explorar
            </Link>
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/50 hover:text-white no-underline"
            >
              Ver más restaurantes →
            </Link>
          </div>

          <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-white/30">
            ¿Sos dueño de un restaurante? Escribinos a hola@deuntoque.com
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 sm:px-12">
        <div className="flex flex-col items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-white/30 sm:flex-row">
          <span>© {new Date().getFullYear()} UnToque</span>
          <span>Buenos Aires · Argentina</span>
        </div>
      </footer>
    </div>
  )
}
