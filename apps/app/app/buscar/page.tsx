import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { DesktopExplorar } from '@/components/lab/DesktopExplorar'
import Link from 'next/link'
import type { Venue } from '@/lib/shared'

export const revalidate = 60

export default async function BuscarPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const venues = (data ?? []) as Venue[]

  return (
    <div className="min-h-screen bg-bg pb-28 lg:pb-0">
      {/* Desktop: pantalla completa de exploración */}
      <div className="hidden lg:block">
        <DesktopExplorar venues={venues} />
      </div>

      {/* Mobile: placeholder suave. El buscar mobile vive en el home. */}
      <div className="lg:hidden screen-x pt-14 pb-8">
        <p className="text-tx3 text-[11px] font-bold uppercase tracking-[0.16em] mb-1">
          Explorar
        </p>
        <h1 className="font-display text-[26px] font-bold text-tx tracking-tight">
          Buscar restaurantes
        </h1>
        <p className="text-tx2 text-[13px] mt-3 leading-relaxed">
          En mobile, usá los filtros y la búsqueda desde el inicio.
        </p>
        <Link
          href="/"
          className="btn-primary mt-5 inline-block w-full text-center"
        >
          Volver al inicio
        </Link>
      </div>

      <BottomNav />
    </div>
  )
}
