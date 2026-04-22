import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-[rgba(0,0,0,0.07)]">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-[18px] text-tx tracking-tight">
            UnToque
          </Link>
          <div className="flex gap-5 text-[13px]">
            <Link href="/terms" className="text-tx2 hover:text-tx font-semibold">Términos</Link>
            <Link href="/privacy" className="text-tx2 hover:text-tx font-semibold">Privacidad</Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-[rgba(0,0,0,0.07)] mt-12">
        <div className="max-w-3xl mx-auto px-5 py-6 text-tx3 text-[12px]">
          © {new Date().getFullYear()} UnToque. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
