/**
 * Página fallback para cuando el user navega sin red.
 * El service worker de next-pwa la sirve cuando el cache de la ruta
 * objetivo no está disponible.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-sf flex items-center justify-center mb-5 border border-[var(--br)]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M1 1l22 22" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M10.71 5.05A16 16 0 0122.58 9" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.53 16.11a6 6 0 016.95 0" stroke="var(--tx3)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="20" r="1" fill="var(--tx3)" />
        </svg>
      </div>
      <h1 className="font-display text-[24px] text-tx">Sin conexión</h1>
      <p className="text-tx2 text-[14px] mt-2 max-w-[320px] leading-relaxed">
        Parece que perdiste conexión. Revisá tu red y volvé a intentar.
      </p>
      <a
        href="/"
        className="mt-6 inline-block btn-primary"
        style={{ maxWidth: 280 }}
      >
        Reintentar
      </a>
    </div>
  )
}
