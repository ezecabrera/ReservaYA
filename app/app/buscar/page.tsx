import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { PageHero } from '@/components/ui/PageHero'
import { SearchClient } from '@/components/search/SearchClient'
import type { Venue } from '@/lib/shared'

export const revalidate = 60

/**
 * Página dedicada de búsqueda de restaurantes.
 *
 * Server component que carga todos los venues activos y delega al
 * SearchClient (client) el filtrado por nombre/dirección/descripción.
 * Resultado: click-to-type desde el bottom nav pill "Buscar" ahora
 * funciona sin SSR overhead ni loader.
 */
export default async function BuscarPage() {
  const supabase = await createClient()
  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const venueList = (venues ?? []) as Venue[]

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PageHero
        kicker="Reservaya"
        title="Buscar"
        subtitle="Filtrá por nombre, barrio o tipo de cocina."
        accent="wine"
      />

      <SearchClient venues={venueList} />

      <BottomNav />
    </div>
  )
}
